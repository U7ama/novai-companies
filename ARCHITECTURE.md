# Novai CRM — Companies Module: Architectural Design Document

This document provides detailed engineering answers to the core architectural design decisions implemented in the **Novai CRM Companies Module** (`novai-companies`).

---

## 1. Data Fetching & Caching Strategy

### Query Configuration & Options
The data layer is built on **TanStack Query v5**. The central `QueryClient` is configured with conservative, production-safe defaults:
- `staleTime: 60 * 1000` (1 minute): Server data remains fresh for 60 seconds. Navigating between views or toggling drawers does not trigger redundant network refetches if the data was retrieved recently.
- `gcTime: 5 * 60 * 1000` (5 minutes): Inactive queries remain in memory for 5 minutes before garbage collection.
- `refetchOnWindowFocus: true`: Re-syncs latest company states when an account executive returns to the browser tab.
- `retry: 1` (queries) / `retry: 0` (mutations): Queries retry once on transient network errors; mutations never retry automatically to prevent duplicate writes.

### Query Key Factory (`companiesKeys`)
We enforce a strict, hierarchical query key structure defined in `src/features/companies/api/queries.ts`:
```ts
export const companiesKeys = {
  all: ['companies'] as const,
  lists: () => [...companiesKeys.all, 'list'] as const,
  list: (params: ListCompaniesParams) => [...companiesKeys.lists(), params] as const,
  details: () => [...companiesKeys.all, 'detail'] as const,
  detail: (id: string) => [...companiesKeys.details(), id] as const
};
```
This enables exact targeting (`queryClient.invalidateQueries({ queryKey: companiesKeys.detail(id) })`) as well as broad prefix-based targeting (`queryClient.invalidateQueries({ queryKey: companiesKeys.lists() })`).

### Cache Invalidation vs. Optimistic Updates
For table mutations (creating a new company or updating an existing company), we deliberately use **invalidation-based refetching** rather than local optimistic cache patching:
- **Server-Generated Fields**: The server is the authority for computing updated `version` integers, `updated_at` ISO timestamps, and tenant assignments.
- **Sorting & Filtering Dependencies**: Adding or editing a company alters ordering, pagination offsets, and filtering matches across the table. Attempting to optimistically insert or reorder rows client-side introduces sorting inconsistencies.
- **Concurrency Verification**: Re-fetching guarantees that the client's local cache reflects the server's canonical state immediately after mutation.

### Preventing Stale Data Bugs via `keepPreviousData`
When users change filters or navigate pages, `listCompaniesOptions` specifies `placeholderData: keepPreviousData`. Instead of tearing down the table and displaying an empty skeleton, the table stays mounted with existing rows while the background network request resolves. The table toolbar displays an unobtrusive spinner (`isFetching && !isLoading`), guaranteeing seamless UX without layout shifts.

---

## 2. State Management Architecture

State is partitioned across three distinct tiers with clear ownership boundaries:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. URL State (nuqs)                                         │
│    - q, status, sort, page, companyId, create               │
│    - Bookmarkable, shareable, browser history aware         │
├─────────────────────────────────────────────────────────────┤
│ 2. Server Cache (TanStack Query v5)                         │
│    - Remote records, pagination metadata, total counts      │
│    - Invalidation, deduplication, background re-fetching    │
├─────────────────────────────────────────────────────────────┤
│ 3. Local Transient State (React useState / Form State)      │
│    - User-typed draft values in create/edit drawer          │
│    - Inline validation errors (422), conflict banners (409) │
└─────────────────────────────────────────────────────────────┘
```

### Why Redux / Zustand is Unnecessary
Modern web applications frequently suffer from bloated global stores storing duplicated server responses. In this module:
- All navigation and view parameters belong in the URL (`nuqs`).
- All asynchronous server data belongs in the query cache (`@tanstack/react-query`).
- Authentication token and language preference are synchronized with `localStorage` via React 19's native `useSyncExternalStore` (`auth-store.ts` and `i18n-context.tsx`).
- There is zero need for an intermediary global state library like Redux or Zustand, drastically reducing bundle size and eliminating manual synchronization boilerplate.

---

## 3. Form Architecture & Concurrency Control

### Concurrency Model (409 Conflict Handling)
Collaborative CRM workflows often lead to race conditions where two team members edit an account simultaneously. To prevent silent overwrites ("last write wins"):
1. The company model includes an integer `version` field incremented monotonically on every write.
2. The client sends `PATCH /api/v1/companies/[id]` with `{ if_version: currentCompany.version, ...updates }`.
3. If the record was modified by another user in the interim, the API aborts the transaction with `HTTP 409 Conflict`:
   ```json
   {
     "message": "Conflict: This record was modified by another user.",
     "current_version": 4
   }
   ```
4. **Draft Preservation UX**: Rather than resetting the form or closing the drawer, the drawer displays an inline warning banner with `role="alert"`. The user's typed name, domain, and status remain completely untouched in state.
5. **"Reload Latest Version"**: Clicking this action queries the latest server version and updates the form's `if_version` baseline to match the latest server version. The user can review their work against the updated company state and re-save immediately without re-typing their changes.
6. **"Simulate Concurrent Edit" Helper**: For development and QA verification, the edit drawer includes a testing button that issues `POST /api/v1/companies/[id]/bump-version`. This increments the server-side version behind the scenes, allowing engineers to verify the 409 conflict handling flow interactively without opening multiple browser sessions.

### Validation Strategy: 422 Unprocessable Entity
- **Client-Side Validation**: Zod schema checks (`name` required, `domain` valid hostname or null, `status` valid enum) execute on submit to provide instant feedback.
- **Server-Side Validation**: In production, the FastAPI backend validates request bodies using Pydantic schemas. If validation fails, the API responds with `HTTP 422 Unprocessable Entity` containing field-level error messages:
  ```json
  {
    "message": "Validation failed",
    "errors": {
      "name": "Company name is required",
      "domain": "Invalid domain format"
    }
  }
  ```
- The client extracts `error.errors` and maps them directly to the corresponding form controls using accessible ARIA attributes (`aria-invalid="true"`, `aria-describedby="{field}-error"`).

---

## 4. Bilingual Localization (`NL` / `EN`)

### Architecture
Localization is implemented through a type-safe React Context (`LanguageProvider` in `src/features/i18n/i18n-context.tsx`) backed by a structured dictionary (`translations.ts`).
- **Locale Persistence**: Stored in `localStorage` under key `novai_crm_lang` (`en` or `nl`).
- **Hydration Safety**: Subscribed via `useSyncExternalStore` with an initial fallback to `'en'`, ensuring complete consistency between server-rendered markup and client hydration.
- **Type Safety**: The dictionary is typed against a strict `TranslationDictionary` interface. Missing translation keys in Dutch or English result in immediate TypeScript compilation errors.

### Locale-Aware Date Formatting
Dates must respect regional conventions:
- **Dutch (`nl-NL`)**: Day preceding month, 24-hour clock (`d MMM yyyy, HH:mm` — e.g. `15 jan 2024, 09:30`).
- **English (`en-US`)**: Month preceding day, 12-hour AM/PM clock (`MMM d, yyyy, h:mm a` — e.g. `Jan 15, 2024, 9:30 AM`).

Formatting is executed via native `Intl.DateTimeFormat`:
```ts
export function formatDate(dateString: string, locale: Locale): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: locale !== 'nl'
  }).format(date);
}
```

### Why Not a Heavyweight i18n Framework?
Libraries such as `next-intl` or `react-i18next` introduce routing middleware complexities, asynchronous translation bundle fetching, and additional runtime overhead. For a focused CRM enterprise module with bilingual Dutch/English requirements, a centralized type-safe dictionary with React Context provides sub-millisecond switching, zero network latency, and 100% compile-time verification.

---

## 5. Authentication & Multi-Tenancy

### Token Handling
Authentication is modeled after enterprise OAuth 2.0 / OIDC identity providers:
- Every outbound request in `src/features/companies/api/client.ts` attaches the header:
  ```http
  Authorization: Bearer <token>
  ```
- Tokens are retrieved via `getAuthToken()` from `src/features/auth/auth-store.ts`.

### Session Protection & 401 Interception
- **Route Guarding**: `AuthGuard` inspects authentication status on client render. If unauthenticated, it redirects the browser to `/sign-in` with a `from` search parameter preserving the requested URL.
- **401 Interception**: When any API call returns `HTTP 401 Unauthorized`:
  ```ts
  if (response.status === 401) {
    onUnauthorized();
    throw new ApiError(401, 'Unauthorized');
  }
  ```
  `onUnauthorized()` immediately removes the stale token from storage and triggers a client redirect to `/sign-in`.

### Multi-Tenancy & Tenant Isolation
In Novai's production backend:
- The backend extracts `organization_id` directly from the validated Bearer JWT claims.
- All database queries automatically filter by `organization_id = token.org_id`.
- The frontend does not pass `organization_id` in query parameters or mutation bodies; tenant isolation is strictly enforced server-side.

---

## 6. Component Architecture & Reusability

### Component Hierarchy
The UI adheres strictly to container/presentation separation:
```
src/app/companies/page.tsx (Page Entry / Route Container)
  └── AuthGuard
        └── CompaniesView (Feature Container - URL state & TanStack Query orchestration)
              ├── Heading (Page Title & Subtitle)
              ├── CompaniesToolbar (Search input, Status NativeSelect, Create Button)
              ├── CompaniesTable (Sortable headers, rows, badges, empty/error/skeleton states)
              ├── CompaniesPagination (Page counts, Prev/Next buttons)
              └── CompanyDrawer (Accessible Sheet Container)
                    └── CompanyForm (Keyed Form: isolated draft state & validation)
```

### Keyed Form Pattern in Drawer
A common pitfall with slide-over drawers is mutating internal form state when the active item ID changes. Using `useEffect` to reset state introduces React 19 / OxLint warnings and can trigger render glitches.
Instead, we extract the inner form into `<CompanyForm key={isCreate ? 'create' : company.id} />`:
- React automatically remounts the component when switching companies or switching between create and edit modes.
- Initial state is derived cleanly once during mount from component props.
- Unsaved draft state is fully isolated to that specific company instance.

---

## 7. Performance & Bundle Size Optimization

1. **Surgical Starter Cleanup**: Stripping heavy demo modules (Recharts, kbar, Clerk, Sentry, AI chat, Kanban) cut the bundle size dramatically and eliminated over 40 redundant packages from `node_modules`.
2. **Tailwind CSS v4 Engine**: Tailwind v4 uses a high-performance CSS-native engine (`@import "tailwindcss";`) with automatic property detection and zero JavaScript configuration overhead.
3. **Optimized Icon Imports**: Tabler icons are encapsulated in `src/components/icons.tsx`, ensuring proper bundler tree-shaking rather than pulling the entire `@tabler/icons-react` package.
4. **Table Re-rendering Optimization**:
   - `CompaniesTable` uses semantic native HTML table elements (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>`) rather than heavy nested `div` virtualizers.
   - Memoized sorting callbacks avoid unnecessary render cascades.
   - Atomic URL state batching with `useQueryStates` ensures that modifying search, status, and page simultaneously results in a single URL update and a single network fetch.

---

## 8. Testing Strategy

Automated testing is configured using **Vitest** + **React Testing Library** with `@testing-library/jest-dom` and `jsdom`.

### 1. API Client & Query Key Unit Tests (`companies-client.test.ts`)
- Verifies that `companiesKeys` generates correct hierarchical keys for lists and single-record queries.
- Verifies query parameter serialization in `companiesApi.list` (handling optional search, status filtering, offset, and sort).
- Verifies `Authorization: Bearer <token>` attachment on requests.
- Verifies error mapping (`ApiError` with status codes and structured field validation errors).
- Verifies 401 unauthorized handling and token cleanup.

### 2. Component & Integration Tests (`companies-view.test.tsx`)
- **Testing URL State with `nuqs`**: Configured with `<NuqsTestingAdapter hasMemory>` so that URL updates mutate virtual memory identically to real browser navigation.
- **Search & Filtering Flow**: Simulates typing into search, verifies that the table stays mounted and renders the filtered subset. Simulates changing the status dropdown and verifies filtered results.
- **Optimistic Concurrency 409 Flow**:
  1. Opens drawer for an existing company (`version: 1`).
  2. Modifies company name in the input.
  3. Simulates a concurrent backend edit (bumping server version to `2`).
  4. Clicks Save Changes: verifies that the server responds with 409 Conflict.
  5. Asserts that the conflict alert banner (`role="alert"`) appears.
  6. **Critical Check**: Asserts that the user's typed name is preserved intact without loss.
  7. Clicks "Reload latest version", dismisses banner, and saves successfully with updated version.

---

## 9. FastAPI Backend Integration & OpenAPI Codegen

In Novai's production architecture, the frontend interfaces with a Python/FastAPI service.

### Recommended Codegen Pipeline
We recommend integrating **`openapi-typescript`** with **`openapi-fetch`**:
```bash
# Generate strictly typed schema types from FastAPI OpenAPI endpoint
npx openapi-typescript http://localhost:8000/openapi.json -o src/features/companies/api/schema.d.ts
```

### Why `openapi-fetch`?
- **Ultra-lightweight (< 6 KB)**: Unlike heavy legacy generators like `openapi-generator-cli`, `openapi-fetch` uses native fetch with pure TypeScript type inference.
- **Strict Endpoint Types**: Routes, query parameters, request bodies, and responses are checked against FastAPI's generated types at compile time.
- **Direct Match with Pydantic Models**: FastAPI Pydantic schemas (e.g. `CompanyRead`, `CompanyCreate`, `CompanyUpdate`, `HTTPValidationError`) translate 1:1 into TypeScript interfaces.

### FastAPI Error Payload Contract
FastAPI generates standardized error responses matching RFC 7807:
```json
// HTTP 422 Unprocessable Entity
{
  "detail": [
    {
      "loc": ["body", "domain"],
      "msg": "Invalid domain format",
      "type": "value_error"
    }
  ]
}
```
The client adapter in `src/features/companies/api/client.ts` normalizes `detail` arrays into a flat dictionary `{ domain: "Invalid domain format" }`, feeding directly into the form's inline error alerts.
