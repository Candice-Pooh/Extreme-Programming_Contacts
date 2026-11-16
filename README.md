# NovaContacts

A shared, English-language address book for the Extreme Programming assignment (FZU–MU).

## Start on Windows

Install Python 3.11 or later. Extract this folder to `C:\Projects\NovaContacts`, then run:

```powershell
cd C:\Projects\NovaContacts
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

Open http://127.0.0.1:5000. Keep the terminal open. No separate frontend server is needed.
Alternatively double-click `start_windows.bat`. On macOS/Linux use `python3 -m venv .venv`, then `.venv/bin/python -m pip install -r requirements.txt` and `.venv/bin/python app.py`.

## Features

- Create, edit, delete and search contacts.
- Favorite/unfavorite contacts; dedicated favorites view.
- Multiple phone numbers, emails, social handles and addresses per contact.
- Real XLSX import/export; one contact per row and one information category per column.
- SQLite persistence, atomic imports, validation and responsive desktop/mobile interface.
- Downloadable Excel template containing one fictional example.

## Read these files

| File | Purpose |
|---|---|
| `START_HERE_ZH.md` | Complete Chinese step-by-step student guide |
| `docs/BLOG_TEMPLATE_EN.md` | English blog draft; complete the marked personal/evidence fields |
| `docs/CODE_STANDARD.md` | Frontend and backend code standards |
| `docs/API.md` | API specification and Excel format |
| `docs/TESTING.md` | Automated and manual tests |
| `docs/DEPLOY_UBUNTU_ZH.md` | Optional cloud deployment guide |
| `docs/SUBMISSION_CHECKLIST.md` | Rubric, screenshots, video, release and PR checklist |
| `docs/AI_ASSISTANCE.md` | Provenance and student review checklist |

## Repository structure

- `app.py`: application factory, validation, SQLite storage and API routes.
- `templates/index.html`, `static/`: English UI and browser interactions.
- `tests/test_app.py`: isolated automated regression tests.
- `deploy/`: systemd and Nginx configuration templates.
- `instance/contacts.db`: generated at first start; excluded from Git.

## Verify

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Tests use temporary databases and do not delete the application's contacts.

## Important assignment status

This is an independently generated implementation, not a fork of an identified course repository. The supplied assignment page does not give its URL. Obtain the official repository before following the fork/PR instructions. Do not claim an upstream PR exists until it is actually submitted.

The project does not include fabricated Git history, contributor statistics, student PSP times, cloud addresses or a personal recording. Follow the guide to create these from real work. Cloud deployment is optional (+15 points), not already completed.

## Demonstration scope

This version is a shared public course demo, with no accounts or access control. Every visitor can modify all records. Use fictional contacts only. It is not a private production address book. Import appends records, so repeat imports add duplicates. Excel transfer preserves values, favorites and per-type method order; internal IDs are regenerated. The app supports `.xlsx`, not legacy `.xls`.

## References

- Assignment: https://bbs.csdn.net/topics/620593436
- Flask deployment: https://flask.palletsprojects.com/en/stable/deploying/gunicorn/
- openpyxl tutorial: https://openpyxl.readthedocs.io/en/stable/tutorial.html
