'use strict';

const $ = (id) => document.getElementById(id);
let contacts = [];
let favoritesOnly = false;
let editingId = null;
let messageTimer = null;

function element(tag, className = '', text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function message(text, error = false) {
  const target = $('message');
  target.textContent = text;
  target.classList.toggle('error', error);
  target.classList.add('visible');
  if (messageTimer) window.clearTimeout(messageTimer);
  messageTimer = window.setTimeout(() => {
    target.classList.remove('visible');
    target.textContent = '';
  }, 4200);
}

async function api(path, method = 'GET', body) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const response = await fetch(path, options);
  if (response.status === 204) return null;

  let data;
  try {
    data = await response.json();
  } catch (_error) {
    throw new Error('The server returned an unreadable response.');
  }
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

async function refresh() {
  const data = await api('/api/contacts');
  contacts = Array.isArray(data.contacts) ? data.contacts : [];
  render();
}

function getInitials(name) {
  return name.trim().split(/\s+/).map((part) => Array.from(part)[0] || '').slice(0, 2).join('').toUpperCase();
}

function getMethodIcon(kind) {
  return ({ phone: '☎', email: '✉', social: '@', address: '⌖' })[kind] || '•';
}

function getMethodLabel(kind) {
  return ({ phone: 'PHONE', email: 'EMAIL', social: 'SOCIAL', address: 'ADDRESS' })[kind] || String(kind).toUpperCase();
}

function createMethodValue(method) {
  if (method.kind === 'phone') {
    const link = element('a', 'detail-value detail-link', method.value);
    const dialValue = method.value.replace(/[^\d+*#,;]/g, '');
    link.href = 'tel:' + dialValue;
    link.setAttribute('aria-label', 'Call ' + method.value);
    return link;
  }
  if (method.kind === 'email') {
    const link = element('a', 'detail-value detail-link', method.value);
    link.href = 'mailto:' + method.value.trim();
    link.setAttribute('aria-label', 'Email ' + method.value);
    return link;
  }
  return element('span', 'detail-value', method.value);
}

async function copyText(value) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const temporary = element('textarea', 'clipboard-fallback');
  temporary.value = value;
  temporary.setAttribute('readonly', '');
  document.body.append(temporary);
  temporary.select();
  const copied = document.execCommand('copy');
  temporary.remove();
  if (!copied) throw new Error('Clipboard access is unavailable in this browser.');
}

function createContactCard(contact) {
  const card = element('article', 'card');
  const head = element('div', 'card-head');
  const avatar = element('div', 'avatar', getInitials(contact.name));
  avatar.setAttribute('aria-hidden', 'true');

  const person = element('div', 'person');
  person.append(
    element('h2', '', contact.name),
    element('p', '', contact.company || 'Independent connection')
  );

  const star = element('button', 'star' + (contact.favorite ? ' selected' : ''), contact.favorite ? '★' : '☆');
  star.type = 'button';
  star.setAttribute('aria-label', (contact.favorite ? 'Remove ' : 'Add ') + contact.name + (contact.favorite ? ' from favorites' : ' to favorites'));
  star.setAttribute('aria-pressed', String(contact.favorite));
  star.title = contact.favorite ? 'Remove from favorites' : 'Add to favorites';
  star.onclick = () => action(star, async () => {
    await api('/api/contacts/' + contact.id + '/favorite', 'PATCH', { favorite: !contact.favorite });
    await refresh();
    message(contact.favorite ? 'Removed from favorites.' : 'Added to favorites.');
  });

  head.append(avatar, person, star);
  card.append(head);

  if (contact.methods && contact.methods.length) {
    for (const method of contact.methods) {
      const row = element('div', 'detail');
      const icon = element('span', 'method-icon', getMethodIcon(method.kind));
      icon.setAttribute('aria-hidden', 'true');
      const kind = element('span', 'kind', getMethodLabel(method.kind));
      const value = createMethodValue(method);
      const copy = element('button', 'copy-method', 'Copy');
      copy.type = 'button';
      copy.setAttribute('aria-label', 'Copy ' + method.kind + ' for ' + contact.name);
      copy.onclick = () => action(copy, async () => {
        await copyText(method.value);
        message(getMethodLabel(method.kind) + ' copied.');
      });
      row.append(icon, kind, value, copy);
      card.append(row);
    }
  } else {
    card.append(element('p', 'hint no-methods', 'No contact methods yet.'));
  }

  if (contact.notes) card.append(element('p', 'notes', contact.notes));

  const actions = element('div', 'card-actions');
  const edit = element('button', 'edit-action', 'Edit contact');
  edit.type = 'button';
  edit.onclick = () => openEditor(contact);

  const remove = element('button', 'delete', 'Delete');
  remove.type = 'button';
  remove.onclick = () => {
    if (window.confirm('Delete ' + contact.name + '? This cannot be undone.')) {
      action(remove, async () => {
        await api('/api/contacts/' + contact.id, 'DELETE');
        await refresh();
        message('Contact deleted.');
      });
    }
  };
  actions.append(edit, remove);
  card.append(actions);
  return card;
}

function render() {
  const query = $('search').value.trim().toLocaleLowerCase();
  const shown = contacts.filter((contact) => {
    const matchesFavorite = !favoritesOnly || contact.favorite;
    const searchable = [contact.name, contact.company, contact.notes, ...(contact.methods || []).map((method) => method.value)]
      .join(' ').toLocaleLowerCase();
    return matchesFavorite && searchable.includes(query);
  });

  $('allCount').textContent = contacts.length;
  $('favCount').textContent = contacts.filter((contact) => contact.favorite).length;
  $('resultCount').textContent = shown.length + (shown.length === 1 ? ' CONNECTION' : ' CONNECTIONS');
  $('sectionHint').textContent = favoritesOnly ? 'People you marked as important' : 'Organized for you';
  $('clearSearch').hidden = !query;
  $('contacts').replaceChildren(...shown.map(createContactCard));
  $('empty').hidden = shown.length > 0;

  if (shown.length === 0) {
    const hasContacts = contacts.length > 0;
    $('emptyTitle').textContent = query
      ? 'No matching connections.'
      : favoritesOnly && hasContacts
        ? 'No favorites yet.'
        : 'Your next connection starts here.';
    $('emptyDescription').textContent = query
      ? 'Try another name, company, or contact detail.'
      : favoritesOnly && hasContacts
        ? 'Mark a contact with the star to keep them close.'
        : 'Add your first contact, or download and import the Excel template.';
    $('emptyAdd').hidden = query.length > 0;
    $('emptyClearSearch').hidden = query.length === 0;
  }
}

async function action(button, task) {
  button.disabled = true;
  try {
    await task();
  } catch (error) {
    message(error.message || 'Something went wrong.', true);
  } finally {
    button.disabled = false;
  }
}

function addMethod(kind = 'phone', value = '') {
  if ($('methods').children.length >= 40) {
    $('formError').textContent = 'Maximum 40 contact methods.';
    return;
  }
  $('formError').textContent = '';
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
  input.type = 'text';
  input.value = value;
  input.required = true;
  input.maxLength = 300;
  input.setAttribute('aria-label', 'Method value');
  input.placeholder = 'Enter contact details';

  const remove = element('button', 'remove-method', '×');
  remove.type = 'button';
  remove.setAttribute('aria-label', 'Remove method');
  remove.title = 'Remove this contact method';
  remove.onclick = () => {
    row.remove();
    $('formError').textContent = '';
  };
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
  if (contact && contact.methods.length) {
    contact.methods.forEach((method) => addMethod(method.kind, method.value));
  } else {
    addMethod();
  }
  $('editor').showModal();
  $('name').focus();
}

function closeEditor() {
  $('editor').close();
  editingId = null;
}

$('newContact').onclick = () => openEditor();
$('emptyAdd').onclick = () => openEditor();
$('addMethod').onclick = () => addMethod();
for (const id of ['closeEditor', 'cancelEditor']) $(id).onclick = closeEditor;
$('editor').addEventListener('click', (event) => {
  if (event.target === $('editor')) closeEditor();
});
$('contactForm').onsubmit = async (event) => {
  event.preventDefault();
  const button = $('saveContact');
  button.disabled = true;
  $('formError').textContent = '';
  const data = {
    name: $('name').value.trim(),
    company: $('company').value.trim(),
    notes: $('notes').value.trim(),
    favorite: $('favorite').checked,
    methods: [...$('methods').children].map((row) => ({
      kind: row.querySelector('select').value,
      value: row.querySelector('input').value.trim()
    }))
  };
  const wasEditing = editingId !== null;
  try {
    await api('/api/contacts' + (editingId === null ? '' : '/' + editingId),
      editingId === null ? 'POST' : 'PUT', data);
    closeEditor();
    await refresh();
    message(wasEditing ? 'Contact updated.' : 'Contact saved.');
  } catch (error) {
    $('formError').textContent = error.message || 'Unable to save contact.';
  } finally {
    button.disabled = false;
  }
};

function switchTab(favorite) {
  favoritesOnly = favorite;
  $('allTab').classList.toggle('active', !favorite);
  $('favTab').classList.toggle('active', favorite);
  $('allTab').removeAttribute('aria-current');
  $('favTab').removeAttribute('aria-current');
  (favorite ? $('favTab') : $('allTab')).setAttribute('aria-current', 'page');
  $('pageTitle').textContent = favorite ? 'Your favorites.' : 'All contacts.';
  render();
}

$('allTab').onclick = () => switchTab(false);
$('favTab').onclick = () => switchTab(true);
$('search').oninput = render;
$('clearSearch').onclick = () => {
  $('search').value = '';
  render();
  $('search').focus();
};
$('emptyClearSearch').onclick = () => {
  $('search').value = '';
  render();
  $('search').focus();
};

$('importButton').onclick = () => {
  if (window.confirm('Import adds new contacts and keeps existing ones. Reimporting the same file adds duplicates. Continue?')) {
    $('importFile').click();
  }
};
$('importFile').onchange = async () => {
  const file = $('importFile').files[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    message('Please choose an .xlsx file.', true);
    $('importFile').value = '';
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    message('The file must be 2 MB or smaller.', true);
    $('importFile').value = '';
    return;
  }
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
