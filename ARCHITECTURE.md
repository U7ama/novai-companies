# How the feature works

## Page and URL state

The page and layout under `src/app/companies` are Server Components. `CompaniesView` is the client entry point and manages the table and drawer. All API data loads through TanStack Query; there is no server prefetch in this build.

nuqs reads `q`, `status`, `sort`, `page`, `companyId`, and `create` from the URL. Related changes happen together, such as setting a filter and resetting the page. Normal changes push a history entry. Invalid status and sort values fall back to defaults, and a page past the end is corrected after the response arrives.

List keys contain the parameters sent to the API, including limit and offset. Detail keys use the company ID. The list uses `keepPreviousData` while a new request is running. The drawer has a separate query, so a detail failure doesn't replace the table.

## API and store

The Route Handlers are under `src/app/api/v1/companies`. They share a bearer-header check and read the store in `src/lib/server/companies-store.ts`. It starts with 40 records and stays on `globalThis` until the process exits. Separate processes do not share local changes. When `COMPANIES_TABLE` is configured for AWS, `companies-repository.ts` instead reads a shared DynamoDB snapshot. Conditional writes on a snapshot revision recheck the company version after a competing write, so the 409 flow also works across Lambda instances.

Zod schemas in `src/features/companies/validation.ts` are used by both the form and the API. An update must include a positive integer `if_version`. After parsing the body, the handler checks the current version and applies the write without another asynchronous step between them. That handles competing writes within this process; a database would need an atomic conditional update.

The client in `src/features/companies/api/client.ts` adds the token and turns failed responses into `ApiError`, including field errors from a 422. It doesn't generate types from OpenAPI or translate FastAPI error responses.

## Editing and conflicts

The form owns its draft fields and the version used for saving. The query cache holds the server's record. Keeping those separate prevents a background refetch from wiping out an edit.

A 409 shows a warning. Reloading fetches the latest record into the cache and changes only the form's version. Adopting server values changes both the fields and version. If a reload fails, the form stays mounted and offers retry. Successful mutations update the detail cache, invalidate lists, and close the drawer.

## Auth, language, and accessibility

The auth store keeps the demo token and reads storage changes so another tab signing out can be noticed. The client handles 401 responses in one place. This is mock auth; the handlers don't validate a JWT or enforce organization permissions.

The language provider reads the saved EN/NL preference. Labels come from typed dictionaries, dates use `Intl.DateTimeFormat`, and the document language follows the selection. Both dictionaries are included in the client bundle.

The table supports keyboard activation without replacing its native row semantics. Base UI handles the drawer's focus trap, Escape key, and focus return. Inputs have labels and field errors are announced. Toasts have a close button on the right and support swipe dismissal.

## Checks

Route tests use the real handlers with a reset store. Component tests cover filtering, URL options, concurrency recovery, failed refetches, validation, and keyboard focus. Client and auth tests cover headers, errors, stored credentials, and the sign-in redirect.

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before submitting. There is no automated browser suite yet.
