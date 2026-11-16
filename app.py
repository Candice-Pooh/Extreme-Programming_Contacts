"""Shared course-demo address book. Use fictional data only."""
import io
import json
import os
import sqlite3
import zipfile
from pathlib import Path
from xml.etree.ElementTree import ParseError

from flask import Flask, g, jsonify, render_template, request, send_file
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill
from werkzeug.exceptions import HTTPException

KINDS = ('phone', 'email', 'social', 'address')
HEADERS = ('name', 'company', 'notes', 'favorite', 'phones', 'emails', 'socials', 'addresses')


def validate(data):
    if not isinstance(data, dict):
        raise ValueError('Contact must be an object.')
    item = {}
    for key, limit in [('name', 100), ('company', 100), ('notes', 1000)]:
        value = data.get(key, '')
        if not isinstance(value, str) or len(value.strip()) > limit:
            raise ValueError(f'{key} must be text of at most {limit} characters.')
        item[key] = value.strip()
    if not item['name']:
        raise ValueError('Name is required.')
    if type(data.get('favorite', False)) is not bool:
        raise ValueError('favorite must be true or false.')
    item['favorite'] = data.get('favorite', False)
    methods = data.get('methods', [])
    if not isinstance(methods, list) or len(methods) > 40:
        raise ValueError('Provide at most 40 contact methods.')
    item['methods'] = []
    for method in methods:
        if not isinstance(method, dict) or method.get('kind') not in KINDS:
            raise ValueError('Unknown contact method type.')
        value = method.get('value')
        if not isinstance(value, str) or not value.strip() or len(value) > 300:
            raise ValueError('Each contact method needs 1 to 300 characters.')
        item['methods'].append({'kind': method['kind'], 'value': value.strip()})
    return item


def workbook_bytes(contacts):
    wb = Workbook()
    ws = wb.active
    ws.title = 'Contacts'
    ws.append(HEADERS)
    for c in contacts:
        values = [c['name'], c['company'], c['notes'], int(c['favorite'])]
        values += [json.dumps([m['value'] for m in c['methods'] if m['kind'] == k],
                              ensure_ascii=False) for k in KINDS]
        ws.append(values)
        for cell in ws[ws.max_row]:
            if isinstance(cell.value, str):
                cell.data_type = 's'  # Store formula-like user strings as literal text.
    for cell in ws[1]:
        cell.font = Font(bold=True, color='FFFFFF')
        cell.fill = PatternFill('solid', fgColor='236B54')
    for col, width in zip('ABCDEFGH', [24, 24, 40, 12, 40, 40, 40, 40]):
        ws.column_dimensions[col].width = width
    ws.freeze_panes = 'A2'
    ws.auto_filter.ref = ws.dimensions
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return stream


def parse_workbook(content):
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as archive:
            if len(archive.infolist()) > 200 or sum(i.file_size for i in archive.infolist()) > 20 * 1024 * 1024:
                raise ValueError('Workbook is too large after decompression.')
        wb = load_workbook(io.BytesIO(content), read_only=True, data_only=False, keep_links=False)
    except (zipfile.BadZipFile, ParseError, KeyError, OSError) as exc:
        raise ValueError('Invalid XLSX workbook.') from exc
    try:
        rows = wb.active.iter_rows()
        if tuple(c.value for c in next(rows, ())) != HEADERS:
            raise ValueError('Headers must exactly match the downloaded template.')
        parsed = []
        for number, cells in enumerate(rows, 2):
            if number > 5001:
                raise ValueError('Maximum 5000 worksheet data rows per import.')
            if all(c.value is None for c in cells):
                continue
            if len(cells) != 8 or any(c.data_type == 'f' for c in cells):
                raise ValueError(f'Row {number}: formulas or extra columns are not allowed.')
            data = dict(zip(HEADERS, [c.value for c in cells]))
            if data['favorite'] not in (None, 0, 1, '0', '1', True, False):
                raise ValueError(f'Row {number}: favorite must be 0 or 1.')
            contact = {k: data[k] if data[k] is not None else '' for k in HEADERS[:3]}
            contact.update(favorite=data['favorite'] in (1, '1', True), methods=[])
            for col, kind in zip(HEADERS[4:], KINDS):
                try:
                    entries = json.loads(data[col]) if data[col] is not None else []
                except (ValueError, TypeError) as exc:
                    raise ValueError(f'Row {number}: {col} must be a JSON text array.') from exc
                if not isinstance(entries, list):
                    raise ValueError(f'Row {number}: {col} must be an array.')
                contact['methods'].extend({'kind': kind, 'value': v} for v in entries)
            try:
                parsed.append(validate(contact))
            except ValueError as exc:
                raise ValueError(f'Row {number}: {exc}') from exc
        if not parsed:
            raise ValueError('No contacts found. Add a data row first.')
        return parsed
    finally:
        wb.close()


def create_app(config=None):
    app = Flask(__name__)
    app.config.update(DATABASE=os.environ.get('CONTACTS_DB', str(Path(app.instance_path) / 'contacts.db')),
                      MAX_CONTENT_LENGTH=2 * 1024 * 1024)
    if config:
        app.config.update(config)
    Path(app.config['DATABASE']).parent.mkdir(parents=True, exist_ok=True)

    def db():
        if 'db' not in g:
            g.db = sqlite3.connect(app.config['DATABASE'], timeout=15)
            g.db.row_factory = sqlite3.Row
            g.db.execute('PRAGMA foreign_keys=ON')
        return g.db

    @app.teardown_appcontext
    def close_db(_error):
        connection = g.pop('db', None)
        if connection is not None:
            connection.close()

    with app.app_context():
        db().executescript("""
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
            company TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
            favorite INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS methods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
            kind TEXT NOT NULL, value TEXT NOT NULL);
        """)

    def get_contact(contact_id):
        row = db().execute('SELECT * FROM contacts WHERE id=?', (contact_id,)).fetchone()
        if row is None:
            return None
        item = dict(row)
        item['favorite'] = bool(item['favorite'])
        item['methods'] = [dict(r) for r in db().execute(
            'SELECT kind,value FROM methods WHERE contact_id=? ORDER BY id', (contact_id,))]
        return item

    def insert(item):
        cursor = db().execute('INSERT INTO contacts(name,company,notes,favorite) VALUES (?,?,?,?)',
                              (item['name'], item['company'], item['notes'], item['favorite']))
        contact_id = cursor.lastrowid
        db().executemany('INSERT INTO methods(contact_id,kind,value) VALUES (?,?,?)',
                         [(contact_id, m['kind'], m['value']) for m in item['methods']])
        return contact_id

    @app.before_request
    def same_origin():
        if request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            origin = request.headers.get('Origin')
            if origin and origin != request.host_url.rstrip('/'):
                return jsonify(error='Cross-origin writes are not allowed.'), 403

    @app.after_request
    def headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Content-Security-Policy'] = "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; base-uri 'self'; frame-ancestors 'none'"
        return response

    @app.errorhandler(ValueError)
    def invalid(error):
        return jsonify(error=str(error)), 400

    @app.errorhandler(HTTPException)
    def http_error(error):
        return jsonify(error=error.description), error.code

    @app.get('/')
    def index():
        return render_template('index.html')

    @app.get('/api/health')
    def health():
        return jsonify(ok=True, service='NovaContacts', version='1.0.0')

    @app.get('/api/contacts')
    def list_contacts():
        contacts = [get_contact(r['id']) for r in db().execute(
            'SELECT id FROM contacts ORDER BY favorite DESC,name COLLATE NOCASE,id').fetchall()]
        q = request.args.get('q', '').strip().casefold()
        if q:
            contacts = [c for c in contacts if q in ' '.join(
                [c['name'], c['company'], c['notes']] + [m['value'] for m in c['methods']]).casefold()]
        if request.args.get('favorite') == '1':
            contacts = [c for c in contacts if c['favorite']]
        return jsonify(contacts=contacts)

    @app.post('/api/contacts')
    def add():
        item = validate(request.get_json())
        with db():
            if db().execute('SELECT COUNT(*) FROM contacts').fetchone()[0] >= 5000:
                raise ValueError('Contact limit reached (5000).')
            contact_id = insert(item)
        return jsonify(get_contact(contact_id)), 201

    @app.put('/api/contacts/<int:contact_id>')
    def edit(contact_id):
        if get_contact(contact_id) is None:
            return jsonify(error='Contact not found.'), 404
        item = validate(request.get_json())
        with db():
            db().execute('UPDATE contacts SET name=?,company=?,notes=?,favorite=? WHERE id=?',
                         (item['name'], item['company'], item['notes'], item['favorite'], contact_id))
            db().execute('DELETE FROM methods WHERE contact_id=?', (contact_id,))
            db().executemany('INSERT INTO methods(contact_id,kind,value) VALUES (?,?,?)',
                             [(contact_id, m['kind'], m['value']) for m in item['methods']])
        return jsonify(get_contact(contact_id))

    @app.patch('/api/contacts/<int:contact_id>/favorite')
    def favorite(contact_id):
        data = request.get_json()
        if not isinstance(data, dict) or type(data.get('favorite')) is not bool:
            raise ValueError('favorite must be true or false.')
        with db():
            cursor = db().execute('UPDATE contacts SET favorite=? WHERE id=?', (data['favorite'], contact_id))
        if not cursor.rowcount:
            return jsonify(error='Contact not found.'), 404
        return jsonify(get_contact(contact_id))

    @app.delete('/api/contacts/<int:contact_id>')
    def delete(contact_id):
        with db():
            cursor = db().execute('DELETE FROM contacts WHERE id=?', (contact_id,))
        if not cursor.rowcount:
            return jsonify(error='Contact not found.'), 404
        return '', 204

    @app.get('/api/export')
    def export():
        contacts = [get_contact(r['id']) for r in db().execute('SELECT id FROM contacts ORDER BY id').fetchall()]
        return send_file(workbook_bytes(contacts), as_attachment=True, download_name='contacts.xlsx')

    @app.get('/api/template')
    def template():
        sample = validate(dict(name='Alex Chen', company='Example Studio', notes='Fictional example',
            favorite=True, methods=[{'kind': 'phone', 'value': '+86 13800000000'},
            {'kind': 'phone', 'value': '+86 13900000000'}, {'kind': 'email', 'value': 'alex@example.com'},
            {'kind': 'social', 'value': '@alex_demo'}, {'kind': 'address', 'value': '123 Example Street'}]))
        return send_file(workbook_bytes([sample]), as_attachment=True, download_name='contacts_template.xlsx')

    @app.post('/api/import')
    def import_contacts():
        upload = request.files.get('file')
        if not upload or not upload.filename.lower().endswith('.xlsx'):
            raise ValueError('Choose an .xlsx file. Legacy .xls files are not supported.')
        parsed = parse_workbook(upload.read())
        with db():
            count = db().execute('SELECT COUNT(*) FROM contacts').fetchone()[0]
            if count + len(parsed) > 5000:
                raise ValueError('Import would exceed the 5000-contact limit.')
            for item in parsed:
                insert(item)
        return jsonify(imported=len(parsed), message='All rows imported. Existing contacts were kept.')

    return app


if __name__ == '__main__':
    create_app().run(host='127.0.0.1', port=5000, debug=False)
