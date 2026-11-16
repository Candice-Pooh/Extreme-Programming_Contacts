# Testing

Run from the project root with Python 3.11+ and requirements installed:

```text
python -m unittest discover -s tests -v
```

The backend suite contains 16 tests. It creates a new temporary database per test. It covers CRUD, all four method types, two phones on one contact, favorite persistence across application instances, case-insensitive method search, validation, not-found IDs, Unicode/leading-zero XLSX round trips, atomic failure, exact headers, formula rejection and literal export, malformed/legacy files, template importing, append duplicates, bad JSON, cross-origin writes, upload-size limits and foreign-key deletion cascade.

## Manual acceptance checklist

1. Start the app and add a contact with multiple phones and other types.
2. Edit, remove a method, save and reload.
3. Favorite, open Favorites, unfavorite and verify removal from the view.
4. Restart the server and confirm persisted records.
5. Search by name, email, company and phone.
6. Download the template, modify fictional data and import it.
7. Export and inspect the workbook in Excel/WPS.
8. Import a workbook with an invalid header; confirm an error and no new rows.
9. Submit an import with a valid row followed by an invalid row; confirm no partial import.
10. Verify mobile-width layout and keyboard operation of the editor.
11. Verify deletion prompts and cancellation.
12. If deployed, repeat the workflow from an external network.

The included preparation test log reports tests run during generation. It does not prove that tests ran on a student's computer, that the project was deployed, or that a teammate contributed. Rerun and capture your own evidence after modifications.

Deployment configuration files are provided for Ubuntu but have not been installed or tested on your cloud server. No claim is made that live public access exists.

## Preparation environment results

The 16 backend tests passed on Python 3.12 with the pinned requirements.
JavaScript syntax was checked with Node. A browser end-to-end test was attempted
but Chromium could not start because the environment denied its process-singleton
socket. Browser interaction and visual appearance remain unverified in this
environment. Complete the manual acceptance checklist on your computer.
