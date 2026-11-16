# Code Standards

## Backend

Use Python 3.11+, four-space indentation and snake_case names. Keep input validation in one reusable function. Use parameterized SQL for all data values and transactions for multi-step writes. Close request-scoped connections. Return JSON error messages with appropriate HTTP status codes. Reject invalid inputs before persistence. Do not commit virtual environments, generated databases or credentials. Add behavior-based regression tests for changes to import/export and persistence.

## Frontend

Use semantic HTML, accessible labels and responsive CSS. Use const/let, strict mode and async/await. Place scripts and styles in separate files. Render user-controlled text with textContent, never innerHTML. Handle failed requests and disable action buttons while requests are running. Keep visible product text in English. Use descriptive function names and avoid frontend dependencies for simple interactions.

## Git and review

Use meaningful messages such as feat:, fix:, test: and docs:. Each author uses their own Git identity. Review changes with git diff and run the tests before pushing. Do not fabricate commits, cooperation records or timing data. Record AI assistance as required by course policy.
