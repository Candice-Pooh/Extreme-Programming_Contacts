# NovaContacts — Extreme Programming Assignment

> Submission draft: replace every `[REPLACE: ...]` field with real information before publication. This draft documents the provided implementation; review it against your final code and course AI policy.

| Item | Content |
|---|---|
| Course for This Assignment | [Software Engineering (FZU–MU)](https://bbs.csdn.net/forums/2601_MU_SE_FZU) |
| Team Name | [REPLACE: team name or Independent Project — your name] |
| Student Name and ID | [REPLACE: your name and student ID] |
| Assignment Requirements | [Extreme Programming](https://bbs.csdn.net/topics/620593436) |
| Objectives of This Assignment | Implement favorites, multiple contact methods and Excel import/export; practice version control, testing and delivery. |
| Other References | [Flask](https://flask.palletsprojects.com/), [openpyxl](https://openpyxl.readthedocs.io/en/stable/tutorial.html) |

## Table of Contents

1. Project Links
2. Requirements and Architecture
3. Functional Implementation
4. Code Standards and Version Control
5. Testing and Demonstration
6. Division of Labor and Contribution
7. PSP
8. Difficulties and Reflection
9. Deployment
10. AI Assistance and Submission Review

## 1. Project Links

| Resource | URL |
|---|---|
| GitHub Repository | [REPLACE: real repository URL] |
| Code Standard | [REPLACE: GitHub URL of docs/CODE_STANDARD.md on your submitted branch] |
| Release | [REPLACE: real published release URL] |
| Pull Request | [REPLACE: real PR URL, or explain the instructor-approved alternative] |
| Public Address | [REPLACE: actual accessible URL, or Not deployed — optional task not completed] |
| Full Running Video | [REPLACE: accessible video URL] |

## 2. Requirements and Architecture

NovaContacts provides a browser-based shared demonstration address book. Its required functions are bookmarking contacts, storing multiple contact methods and transferring contacts through Excel. Creating, editing, deleting and searching records support the complete workflow. An English interface adapts to desktop and mobile widths.

The browser loads HTML, CSS and JavaScript from Flask. JavaScript calls same-origin JSON endpoints using fetch. Flask validates requests and uses parameterized SQLite queries. The contacts table stores a name, company, notes and favorite flag. The methods table stores zero or more typed contact values for each contact through a foreign key. openpyxl reads and writes XLSX workbooks.

This is a shared course demo, not a private multi-user address book. Every visitor can edit its records. Only fictional data is used for public demonstrations.

## 3. Functional Implementation

### 3.1 Bookmark Contacts — 25 points

Each card has a star button. The browser sends the desired favorite state through PATCH /api/contacts/{id}/favorite. The backend writes it to SQLite, so it survives page refresh and process restart. The Favorites view filters the contact list. Favorites also appear first in the all-contacts list.

![Favorites](../screenshots/03_favorites.png)

### 3.2 Multiple Contact Methods — 10 points

The editor offers repeatable rows with a type selector and a value input. The supported types are phone, email, social and address. A contact can have multiple entries of the same type. A one-to-many table avoids a fixed number of phone columns. Editing replaces the contact and its methods within one transaction. Values are strings, preserving leading zeros and international dialing prefixes.

![Multiple methods](../screenshots/02_methods.png)

### 3.3 Import and Export — 25 points

Each contact occupies one Excel row. Columns are name, company, notes, favorite, phones, emails, socials and addresses. Multiple values in one category use JSON arrays in that category's cell. This preserves commas in postal addresses and supports round-trip transfers.

The first worksheet is read and validated in full before writing. Invalid headers, invalid rows, formulas and oversized files produce readable errors. A failed import writes no contacts. Valid imports append records without modifying existing ones; repeated imports can create duplicates and the UI explains that policy.

Exports contain all contacts and force user strings to literal Excel text. Favorites and notes are included. Internal database IDs are not exported; imported contacts receive new IDs. Per-type order is preserved.

![Import feedback](../screenshots/04_import.png)

![Exported workbook](../screenshots/05_excel.png)

### 3.4 Page Style — 10 points

The interface uses a green-and-ivory palette, card-based contacts, sidebar filtering and a modal editor. The desktop grid adapts to a single-column mobile view. Form fields have accessible labels, and the page displays request errors without discarding the editor's input.

![Application overview](../screenshots/01_home.png)

## 4. Code Standards and Version Control

Python uses four-space indentation and descriptive snake_case names. JavaScript uses strict mode, const/let and async/await. SQL parameters and DOM textContent handle user values safely. The complete standards are linked above.

[REPLACE: explain how you actually forked the specified repository, chose branches, reviewed code and collaborated. The provided code is an independent implementation until adapted to the required upstream.]

| Contributor | Actual Commit Count |
|---|---:|
| [REPLACE: actual author] | [REPLACE: count from git shortlog] |

![Commit history](../screenshots/08_git_history.png)

[REPLACE: ensure at least three genuine commits are visible; add each actual contributor.]

## 5. Testing and Demonstration

The supplied automated suite uses temporary SQLite databases. It covers CRUD, multiple methods, favorite persistence across application instances, search, validation, missing IDs, Excel round trips, all-or-nothing imports, bad headers, formula handling, invalid files, templates, duplicate append behavior, invalid JSON/origin checks, upload limits and deletion cascading.

Command:

```text
python -m unittest discover -s tests -v
```

[REPLACE: your actual test date, Python version and result. The generated implementation passed 16 backend tests in its preparation environment; rerun them after your changes.]

![Local test results](../screenshots/07_tests.png)

![Import validation](../screenshots/06_validation.png)

[REPLACE: link your complete running video and describe the actual sequence demonstrated.]

## 6. Division of Labor and Contribution

[REPLACE: choose one truthful arrangement and remove the unused alternative.]

Independent project: [REPLACE: your name] performed [REPLACE: your actual coding, testing and documentation work]. Student contribution is 100%; AI assistance is disclosed separately below.

Collaborative project:

| Member | Actual Work | Contribution |
|---|---|---:|
| [REPLACE: member A] | [REPLACE: actual modules and evidence] | [REPLACE: percentage] |
| [REPLACE: member B] | [REPLACE: actual modules and evidence] | [REPLACE: percentage] |

For collaborative work, percentages must total 100. Both students publish their own blog and include their own PSP table.

## 7. PSP

All times below are minutes. Enter your real estimates and observed work times; do not treat sample values as measured evidence.

| PSP Stage | Planned Minutes | Actual Minutes |
|---|---:|---:|
| Planning and estimation | [REPLACE] | [REPLACE] |
| Requirements analysis | [REPLACE] | [REPLACE] |
| Design and module division | [REPLACE] | [REPLACE] |
| Code review and coding standard | [REPLACE] | [REPLACE] |
| Implementation | [REPLACE] | [REPLACE] |
| Testing and debugging | [REPLACE] | [REPLACE] |
| Documentation and deployment | [REPLACE] | [REPLACE] |
| Review and reflection | [REPLACE] | [REPLACE] |
| Total | [REPLACE] | [REPLACE] |

## 8. Difficulties and Reflection

Two design problems in the supplied implementation are representing repeated contact methods without losing data and preventing partial Excel imports. JSON arrays per information category solve delimiter ambiguity, while complete validation followed by one transaction prevents partially imported files. The regression tests exercise these behaviors.

[REPLACE: describe difficulties you personally encountered, how you diagnosed them, the concrete fixes, and what you learned. For teams, include real cooperation difficulties and their resolution; do not invent a conflict.]

## 9. Deployment

[REPLACE: select the actual outcome.]

If deployed: record the cloud provider, public address, deployment steps and external-device verification. The provided deployment plan uses Nginx on port 8088, Gunicorn on loopback port 5050 and persistent SQLite storage under /var/lib/novacontacts. It leaves an existing port-80 website in place.

If not deployed: state that local testing was completed and the optional cloud-deployment task was not completed. A localhost address is not a public deployment.

[REPLACE: add an actual public-browser screenshot if applicable.]

## 10. AI Assistance and Submission Review

[REPLACE: accurately disclose AI assistance according to course rules, describing generated code, your own modifications and how you verified the result.]

Before submission, confirm that repository links, code standards, screenshots, a complete video, commit statistics, PSP, release and PR information are present and accessible. Publish early enough for blog review before November 17, 2026, 23:59.
