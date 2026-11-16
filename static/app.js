'use strict';
const $ = (id) => document.getElementById(id);
let contacts = [];
let favoritesOnly = false;
let editingId = null;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function message(text, error = false) {
  $('message').textContent = text;
  $('message').classList.toggle('error', error);
}
async function api(path, method = 'GET', body) {
  const options = { method };
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }
  const response = await fetch(path, options);
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}
async function refresh() {
  contacts = (await api('/api/contacts')).contacts;
  render();
}
function render() {
  const query = $('search').value.trim().toLocaleLowerCase();
  const shown = contacts.filter((c) => (!favoritesOnly || c.favorite)
    && [c.name, c.company, c.notes, ...c.methods.map((m) => m.value)].join(' ').toLocaleLowerCase().includes(query));
  $('allCount').textContent = contacts.length;
  $('favCount').textContent = contacts.filter((c) => c.favorite).length;
  $('resultCount').textContent = shown.length + (shown.length === 1 ? ' CONNECTION' : ' CONNECTIONS');
  $('contacts').replaceChildren();
  $('empty').hidden = shown.length > 0;
  for (const c of shown) {
    const card = element('article', 'card');
    const head = element('div', 'card-head');
    const initials = c.name.split(/\s+/).map((s) => Array.from(s)[0]).slice(0, 2).join('').toUpperCase();
    head.append(element('div', 'avatar', initials));
    const person = element('div', 'person');
    person.append(element('h2', '', c.name), element('p', '', c.company || 'Independent connection'));
    const star = element('button', 'star' + (c.favorite ? ' selected' : ''), c.favorite ? '★' : '☆');
    star.setAttribute('aria-label', (c.favorite ? 'Unfavorite ' : 'Favorite ') + c.name);
    star.setAttribute('aria-pressed', String(c.favorite));
    star.onclick = () => action(star, async () => {
      await api('/api/contacts/' + c.id + '/favorite', 'PATCH', { favorite: !c.favorite });
      await refresh();
    });
    head.append(person, star);
    card.append(head);
    for (const m of c.methods) {
      const row = element('div', 'detail');
      row.append(element('span', 'kind', m.kind), element('span', 'detail-value', m.value));
      card.append(row);
    }
    if (!c.methods.length) card.append(element('p', 'hint', 'No contact methods yet.'));
    if (c.notes) card.append(element('p', 'notes', c.notes));
    const actions = element('div', 'card-actions');
    const edit = element('button', '', 'Edit contact');
    edit.onclick = () => openEditor(c);
    const remove = element('button', 'delete', 'Delete');
    remove.onclick = () => {
      if (confirm('Delete ' + c.name + '? This cannot be undone.')) {
        action(remove, async () => {
          await api('/api/contacts/' + c.id, 'DELETE');
          await refresh();
          message('Contact deleted.');
        });
      }
    };
    actions.append(edit, remove);
    card.append(actions);
    $('contacts').append(card);
  }
}
async function action(button, task) {
  button.disabled = true;
  try { await task(); } catch (error) { message(error.message, true); }
  finally { button.disabled = false; }
}
function addMethod(kind = 'phone', value = '') {
  if ($('methods').children.length >= 40) {
    $('formError').textContent = 'Maximum 40 contact methods.';
    return;
  }
  const row = element('div', 'method-row');
  const select = element('select');
  select.setAttribute('aria-label', 'Method type');
  for (const type of ['phone', 'email', 'social', 'address']) {
    const option = element('option', '', type[0].toUpperCase() + type.slice(1));
    option.value = type;
    select.append(option);
  }
  select.value = kind;
  const input = element('input');
  input.value = value;
  input.required = true;
  input.maxLength = 300;
  input.setAttribute('aria-label', 'Method value');
  input.placeholder = 'Contact details';
  const remove = element('button', '', '✕');
  remove.type = 'button';
  remove.setAttribute('aria-label', 'Remove method');
  remove.onclick = () => row.remove();
  row.append(select, input, remove);
  $('methods').append(row);
}
function openEditor(contact = null) {
  editingId = contact?.id ?? null;
  $('contactForm').reset();
  $('editorTitle').textContent = contact ? 'Edit contact' : 'New contact';
  $('name').value = contact?.name || '';
  $('company').value = contact?.company || '';
  $('notes').value = contact?.notes || '';
  $('favorite').checked = contact?.favorite || false;
  $('formError').textContent = '';
  $('methods').replaceChildren();
  if (contact) contact.methods.forEach((m) => addMethod(m.kind, m.value));
  else addMethod();
  $('editor').showModal();
}
$('newContact').onclick = () => openEditor();
$('emptyAdd').onclick = () => openEditor();
$('addMethod').onclick = () => addMethod();
for (const id of ['closeEditor', 'cancelEditor']) $(id).onclick = () => $('editor').close();
$('contactForm').onsubmit = async (event) => {
  event.preventDefault();
  const button = $('saveContact');
  button.disabled = true;
  const data = {
    name: $('name').value, company: $('company').value, notes: $('notes').value,
    favorite: $('favorite').checked,
    methods: [...$('methods').children].map((row) => ({
      kind: row.querySelector('select').value, value: row.querySelector('input').value
    }))
  };
  try {
    await api('/api/contacts' + (editingId === null ? '' : '/' + editingId),
      editingId === null ? 'POST' : 'PUT', data);
    $('editor').close();
    await refresh();
    message('Contact saved.');
  } catch (error) { $('formError').textContent = error.message; }
  finally { button.disabled = false; }
};
function switchTab(favorite) {
  favoritesOnly = favorite;
  $('allTab').classList.toggle('active', !favorite);
  $('favTab').classList.toggle('active', favorite);
  $('pageTitle').textContent = favorite ? 'Your favorites.' : 'All contacts.';
  render();
}
$('allTab').onclick = () => switchTab(false);
$('favTab').onclick = () => switchTab(true);
$('search').oninput = render;
$('importButton').onclick = () => {
  if (confirm('Import adds new contacts and keeps existing ones. Reimporting the same file adds duplicates. Continue?')) $('importFile').click();
};
$('importFile').onchange = async () => {
  const file = $('importFile').files[0];
  if (!file) return;
  await action($('importButton'), async () => {
    const body = new FormData();
    body.append('file', file);
    const response = await fetch('/api/import', { method: 'POST', body });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Import failed.');
    await refresh();
    message(data.imported + ' contacts imported successfully.');
  });
  $('importFile').value = '';
};
refresh().catch((error) => message('Cannot load contacts: ' + error.message, true));
