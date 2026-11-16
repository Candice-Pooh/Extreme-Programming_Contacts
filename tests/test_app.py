import io
import tempfile
import unittest
from pathlib import Path

from openpyxl import load_workbook

from app import create_app, workbook_bytes, validate


class AddressBookTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = str(Path(self.tmp.name) / 'test.db')
        self.app = create_app({'TESTING': True, 'DATABASE': self.path})
        self.client = self.app.test_client()
        self.contact = dict(name='Lin Example', company='Studio', notes='Test',
            favorite=False, methods=[{'kind': 'phone', 'value': '00123'},
                {'kind': 'phone', 'value': '+86 13900000000'},
                {'kind': 'email', 'value': 'lin@example.com'},
                {'kind': 'social', 'value': '@lin'},
                {'kind': 'address', 'value': 'Apt 1, Example Road'}])

    def tearDown(self):
        self.tmp.cleanup()

    def add(self, contact=None):
        return self.client.post('/api/contacts', json=contact or self.contact)

    def items(self):
        return self.client.get('/api/contacts').json['contacts']

    def upload(self, stream, name='test.xlsx'):
        stream.seek(0)
        return self.client.post('/api/import', data={'file': (stream, name)})

    def test_page_and_health(self):
        with self.client.get('/') as response:
            self.assertEqual(response.status_code, 200)
        self.assertTrue(self.client.get('/api/health').json['ok'])

    def test_crud_and_multiple_methods(self):
        result = self.add()
        self.assertEqual(result.status_code, 201)
        item = result.json
        self.assertEqual(item['methods'], self.contact['methods'])
        self.contact['name'] = 'Updated'
        self.contact['methods'] = [{'kind': 'email', 'value': 'new@example.com'}]
        result = self.client.put('/api/contacts/' + str(item['id']), json=self.contact)
        self.assertEqual(result.json['name'], 'Updated')
        self.assertEqual(len(result.json['methods']), 1)
        self.assertEqual(self.client.delete('/api/contacts/' + str(item['id'])).status_code, 204)
        self.assertEqual(self.items(), [])

    def test_favorite_persists_across_app_restart(self):
        item = self.add().json
        result = self.client.patch(f"/api/contacts/{item['id']}/favorite", json={'favorite': True})
        self.assertTrue(result.json['favorite'])
        other = create_app({'TESTING': True, 'DATABASE': self.path}).test_client()
        self.assertTrue(other.get('/api/contacts?favorite=1').json['contacts'][0]['favorite'])

    def test_search_details_and_case(self):
        self.add()
        self.assertEqual(len(self.client.get('/api/contacts?q=LIN@EXAMPLE').json['contacts']), 1)
        self.assertEqual(len(self.client.get('/api/contacts?q=unknown').json['contacts']), 0)

    def test_validation(self):
        for field, value in [('name', ''), ('name', 42), ('favorite', 'yes'),
                             ('methods', [{'kind': 'bad', 'value': 'x'}]),
                             ('methods', [{'kind': 'phone', 'value': ''}]),
                             ('notes', 'a' * 1001)]:
            data = dict(self.contact)
            data[field] = value
            self.assertEqual(self.add(data).status_code, 400, field)
        self.assertEqual(self.items(), [])

    def test_not_found(self):
        self.assertEqual(self.client.delete('/api/contacts/999').status_code, 404)
        self.assertEqual(self.client.put('/api/contacts/999', json=self.contact).status_code, 404)

    def test_xlsx_round_trip(self):
        self.contact['favorite'] = True
        self.contact['name'] = '陈 Example'
        self.add()
        exported = self.client.get('/api/export')
        item = self.items()[0]
        self.client.delete(f"/api/contacts/{item['id']}")
        self.assertEqual(self.upload(io.BytesIO(exported.data)).json['imported'], 1)
        exported.close()
        restored = self.items()[0]
        for key in self.contact:
            self.assertEqual(restored[key], self.contact[key])

    def test_import_atomicity(self):
        valid = validate(self.contact)
        invalid = dict(valid, name='')
        result = self.upload(workbook_bytes([valid, invalid]))
        self.assertEqual(result.status_code, 400)
        self.assertEqual(self.items(), [])

    def test_invalid_headers(self):
        stream = workbook_bytes([validate(self.contact)])
        wb = load_workbook(stream)
        wb.active['A1'] = 'wrong'
        output = io.BytesIO()
        wb.save(output)
        wb.close()
        self.assertEqual(self.upload(output).status_code, 400)

    def test_formula_rejected_and_export_literal(self):
        self.contact['name'] = '=1+1'
        self.add()
        response = self.client.get('/api/export')
        exported = io.BytesIO(response.data)
        response.close()
        wb = load_workbook(exported)
        self.assertEqual(wb.active['A2'].data_type, 's')
        wb.active['A2'] = '=1+1'
        output = io.BytesIO()
        wb.save(output)
        wb.close()
        self.assertEqual(self.upload(output).status_code, 400)

    def test_bad_file(self):
        self.assertEqual(self.upload(io.BytesIO(b'not excel')).status_code, 400)
        self.assertEqual(self.upload(io.BytesIO(b'not excel'), 'test.xls').status_code, 400)

    def test_template(self):
        response = self.client.get('/api/template')
        stream = io.BytesIO(response.data)
        response.close()
        self.assertEqual(self.upload(stream).json['imported'], 1)
        self.assertEqual(len(self.items()[0]['methods']), 5)

    def test_duplicate_policy_append(self):
        self.upload(workbook_bytes([validate(self.contact)]))
        self.upload(workbook_bytes([validate(self.contact)]))
        self.assertEqual(len(self.items()), 2)

    def test_bad_json_and_origin(self):
        self.assertEqual(self.client.post('/api/contacts', data='bad', content_type='application/json').status_code, 400)
        self.assertEqual(self.client.post('/api/contacts', json=self.contact,
            headers={'Origin': 'https://other.example'}).status_code, 403)

    def test_upload_limit(self):
        self.assertEqual(self.upload(io.BytesIO(b'x' * (2 * 1024 * 1024))).status_code, 413)

    def test_delete_cascade(self):
        item = self.add().json
        self.client.delete(f"/api/contacts/{item['id']}")

        import sqlite3
        connection = sqlite3.connect(self.path)
        try:
            count = connection.execute(
                'SELECT COUNT(*) FROM methods'
            ).fetchone()[0]
        finally:
            connection.close()

        self.assertEqual(count, 0)


if __name__ == '__main__':
    unittest.main()
