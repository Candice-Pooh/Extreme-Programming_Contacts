# API and Excel Specification

The browser and API use the same origin. No separate frontend server or CORS configuration is required.

| Method | Path | Input | Success |
|---|---|---|---|
| GET | /api/health | None | 200, service status |
| GET | /api/contacts | Optional q, favorite=1 | 200, {contacts: [...]} |
| POST | /api/contacts | Contact JSON | 201, created contact |
| PUT | /api/contacts/{id} | Complete Contact JSON | 200, updated contact |
| PATCH | /api/contacts/{id}/favorite | {"favorite": true} | 200, updated contact |
| DELETE | /api/contacts/{id} | None | 204 |
| GET | /api/template | None | 200, XLSX example |
| GET | /api/export | None | 200, all contacts as XLSX |
| POST | /api/import | multipart/form-data, field file | 200, imported count |

Example contact:

```json
{"name":"Alex Chen","company":"Example Studio","notes":"Fictional demo","favorite":true,"methods":[{"kind":"phone","value":"00123"},{"kind":"phone","value":"+86 13900000000"},{"kind":"email","value":"alex@example.com"}]}
```

IDs are assigned by the server. PUT replaces the complete contact and its methods. Unknown IDs return 404. Invalid data returns 400, invalid JSON media type 415 and oversized uploads 413. Error responses have an error string. Server failures may return HTTP 500.

Name: required, 1–100 characters after trim; company: up to 100; notes: up to 1000. favorite: JSON boolean. Up to 40 methods per contact; allowed kinds phone/email/social/address; each value 1–300 characters. Values are stored as text rather than coerced to numbers. This implementation validates structure and length, not deliverability or regional phone syntax.

## Excel format

First-sheet headers must exactly equal the following sequence:

| Column | Header | Content |
|---|---|---|
| A | name | Required text |
| B | company | Optional text |
| C | notes | Optional text |
| D | favorite | 0 or 1; blank means false |
| E | phones | JSON string array, e.g. ["00123", "+86 13900000000"] |
| F | emails | JSON string array |
| G | socials | JSON string array |
| H | addresses | JSON string array |

One contact occupies one row. All values of one information category are held in its column as a JSON array. Empty categories can use [] or a blank cell. This avoids delimiter ambiguity in postal addresses and supports multiple values without losing information. Only the first worksheet is imported. Only .xlsx is supported. Blank data rows are ignored; a file without contacts is rejected. There must not be additional columns. Formulas are rejected.

The whole file is validated before one SQLite transaction inserts the records. Any validation failure means zero rows imported. Import appends; existing contacts are never overwritten or deduplicated. Export contains all records, including favorites and notes, regardless of UI filtering. Internal IDs are omitted and regenerated on import. Method ordering is preserved within each kind, not across different kinds.

Limits: 2 MiB HTTP upload, 20 MiB total uncompressed ZIP entries, 200 archive entries, 5000 data rows per worksheet and 5000 total contacts. XML processing uses defusedxml when installed via requirements.txt.

## Data design

contacts(id PRIMARY KEY, name, company, notes, favorite) has a one-to-many relationship with methods(id PRIMARY KEY, contact_id FOREIGN KEY ON DELETE CASCADE, kind, value). SQLite persists the data. A contact deletion cascades to its methods. SQL values are parameterized. The application factory supports an isolated DATABASE path in tests and CONTACTS_DB in deployment.
