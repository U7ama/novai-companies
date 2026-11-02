# Novai B2B Sales & Marketing CRM — Companies Module (`novai-companies`)

A production-ready, strictly typed, maintainable B2B Sales & Marketing CRM **Companies Management Web Application** built for **Novai**.

Built on **Next.js 16 App Router**, **React 19**, **TypeScript Strict Mode**, **Tailwind CSS v4**, **shadcn/ui** (Base UI primitives), **TanStack Query v5**, and **nuqs**.

---

## Quickstart & Verification

### Prerequisites
- **Node.js**: `v20.x` or higher (Node 22 recommended)
- **Package Manager**: `pnpm` `v10.x` or higher

### Installation & Local Development
```bash
# Install dependencies
pnpm install

# Start development server on http://localhost:3000
pnpm dev
```
Navigate to [http://localhost:3000](http://localhost:3000). The application automatically redirects authenticated requests to `/companies` (and unauthenticated sessions to `/sign-in`).

### Automated Quality Checks
All four automated quality checks pass with zero errors and zero warnings:

```bash
# 1. Linting (OxLint - fast Rust-based linter)
pnpm lint

# 2. TypeScript Compilation (Strict typecheck, noEmit)
pnpm typecheck

# 3. Automated Unit & Component Tests (Vitest + React Testing Library)
pnpm test

# 4. Production Build (Next.js 16 optimized build)
pnpm build
```

---

## Core System Architecture & Features

### 1. Surgical Starter Cleanup (Zero Dead Code)
Starting from `Kiranism/next-shadcn-dashboard-starter`, all non-required dependencies, demo pages, and integrations were completely excised:
- **Removed**: Clerk auth (`@clerk/nextjs`), Sentry monitoring (`@sentry/nextjs`), Recharts, kbar, AI chat (`ai`), Kanban (`dnd-kit`), notifications, products, users, overview, and legacy demo routes.
- **Retained**: Next.js 16, React 19, Tailwind CSS v4, `@tanstack/react-query`, `nuqs`, `zod`, `@tabler/icons-react` (via `src/components/icons.tsx`), and shadcn/ui primitives (`table`, `sheet`, `button`, `input`, `native-select`, `badge`, `skeleton`, `alert`).
- **Result**: Fast builds, clean dependency graphs, and a production bundle focused strictly on the Novai CRM Companies feature.

### 2. URL State Synchronization via `nuqs`
All table controls synchronize bi-directionally with the browser URL:
- `q`: Search query string (company name and domain).
- `status`: Lifecycle filter (`all`, `new`, `researching`, `contacted`, `qualified`, `rejected`).
- `sort`: Column sort order (`name`, `-name`, `created_at`, `-created_at`).
- `page`: Active pagination page index (20 companies per page, 1-indexed).
- `companyId`: Opens the slide-over Sheet drawer in Edit mode for the specified ID.
- `create`: Opens the slide-over Sheet drawer in Create mode when set to `true`.

Updates to search, status, or sort reset the active page index to `1` atomically via `useQueryStates`. Filters are bookmarkable, shareable between teammates, and preserve browser Back/Forward navigation.

### 3. TanStack Query v5 Data Layer
- **Normalized Query Keys**: Centralized in `companiesKeys` (`['companies', 'list', params]` and `['companies', 'detail', id]`).
- **Flicker-Free Transitions**: `listCompaniesOptions` utilizes `placeholderData: keepPreviousData`. When typing in search or changing page/status filters, the table remains mounted with previous results while the background network query fetches new data, eliminating jarring layout shifts.
- **Cache Invalidation**: Successful creations and updates selectively invalidate `companiesKeys.lists()`, ensuring table data reflects recent mutations immediately.

### 4. Optimistic Concurrency Control (409 Conflict UX)
In a collaborative CRM, multiple account executives and SDRs frequently review or edit the same account concurrently. Novai enforces optimistic concurrency:
- Every company record carries a monotonic integer `version` field.
- Mutations (`PATCH /api/v1/companies/[id]`) must provide `if_version: <last_seen_version>`.
- If the record has changed on the server, the API rejects the write with `409 Conflict`.
- **Zero Draft Loss UX**: The drawer displays an inline alert banner (`role="alert"`) informing the user that a colleague modified the record.
- **"Reload Latest Version"**: Clicking this button updates the concurrency baseline `if_version` to match the latest server version *without wiping out the user's typed form modifications*. The user can review their changes against the latest state and retry saving immediately.
- **"Simulate Concurrent Edit" Helper**: A dedicated testing button inside the edit drawer fires `POST /api/v1/companies/[id]/bump-version` behind the scenes, allowing engineers to verify the 409 conflict handling flow interactively without opening multiple browser sessions.

### 5. Field Validation & 422 Error Handling
- **Client-Side Validation**: Zod schema checks (`name` non-empty, optional valid `domain`, status enum).
- **Server-Side Validation**: The API returns `422 Unprocessable Entity` with an RFC-compliant structured errors dictionary `{ errors: { field: "Message" } }`.
- **Inline Error Mapping**: The form maps backend errors directly underneath the corresponding input fields (`aria-invalid="true"`, `aria-describedby`), providing instant visual feedback.

### 6. Bilingual Localization (`NL` / `EN`)
- **First-Class Dutch & English**: Novai operates in the Benelux B2B market. The application provides a native bilingual experience accessible via the language toggle in the header.
- **Type-Safe Translations**: Stored in `src/features/i18n/translations.ts`, ensuring compile-time completeness for all UI strings across both languages.
- **Locale-Aware Formatting**: Timestamps are formatted using standard `Intl.DateTimeFormat` with Dutch conventions (`d MMM yyyy, HH:mm` in `nl-NL`) and English conventions (`MMM d, yyyy, h:mm a` in `en-US`).

### 7. Authentication & Multi-Tenancy Boundary
- **Bearer Token Auth**: The app expects an `Authorization: Bearer <token>` header on every API request. Tokens are managed through `src/features/auth/auth-store.ts`.
- **Session Protection**: `AuthGuard` checks token presence. Missing or invalid credentials redirect to `/sign-in`.
- **Automatic 401 Interceptor**: If the backend responds with `401 Unauthorized`, the client clears stored credentials and redirects to `/sign-in` immediately.
- **Fast Sign-In Helper**: The sign-in page includes a 1-click button to sign in with a pre-configured demo bearer token.

---

## Project Structure

```
novai-companies/
├── src/
│   ├── app/
│   │   ├── (auth)/sign-in/          # Fake Bearer sign-in page
│   │   ├── api/v1/companies/        # Mock REST API route handlers
│   │   │   ├── [id]/
│   │   │   │   ├── bump-version/    # Testing helper: simulate concurrent edit
│   │   │   │   └── route.ts         # GET & PATCH single company (409 & 422 handling)
│   │   │   ├── route.ts             # GET list (pagination/search/sort) & POST company
│   │   │   └── store.ts             # In-memory store seeded with 40 B2B companies
│   │   ├── companies/page.tsx       # Primary CRM Companies route
│   │   └── layout.tsx               # Root layout with QueryClientProvider & LanguageProvider
│   ├── components/
│   │   ├── layout/                  # App header, sidebar, user nav, language switcher
│   │   └── ui/                      # shadcn / Base UI primitives (table, sheet, button, etc.)
│   └── features/
│       ├── auth/                    # Bearer token store, auth guard, sign-in form
│       ├── i18n/                    # NL/EN context, translations, locale date formatting
│       └── companies/               # Companies domain module
│           ├── __tests__/           # Vitest unit & component tests
│           ├── api/                 # Typed API client, query options, query keys
│           ├── components/          # CompaniesView, Table, Toolbar, Drawer, Pagination
│           └── types/               # TypeScript interfaces & Zod validation schemas
├── ARCHITECTURE.md                  # Detailed architectural design answers (9 core questions)
└── README.md
```

---

## Architectural Decisions & Tradeoffs

### What We Did and Why
1. **Direct `<Table>` Primitives over Heavy Table Wrappers**: Instead of importing large, generic TanStack Table abstraction packages that add unnecessary layers for a single-table CRM module, we built a lean, accessible, purpose-built table directly with standard shadcn `<Table>` components and `nuqs`. This cut code volume significantly while providing complete control over keyboard focus, sorting indicators, and optimistic pagination.
2. **Keyed Form Component for Drawer State**: Rather than resetting form state via `useEffect` (which triggers React 19 / OxLint `set-state-in-effect` warnings and potential tear-down bugs), the `CompanyDrawer` renders a keyed `<CompanyForm key={isCreate ? 'create' : company.id} />`. Form state initializes cleanly from props upon mounting and isolates draft changes naturally.
3. **`useSyncExternalStore` for Client-Side Global State**: Both the authentication store (`auth-store.ts`) and language preferences (`i18n-context.tsx`) synchronize with `localStorage` via React's official `useSyncExternalStore` hook, eliminating hydration mismatches and avoiding extra state management dependencies like Zustand or Redux.

### What Would Be Done Differently With More Time
1. **Automated OpenAPI Client Code Generation**: In this repository, the API client is typed using handcrafted TypeScript types matching the backend schema. In production with a FastAPI backend, we would configure `openapi-typescript` and `openapi-fetch` to automatically generate TypeScript request/response contracts and validation schemas directly from `http://backend:8000/openapi.json` during the build step.
2. **Server-Side Hydration Boundaries (RSC Prefetching)**: The initial page load currently performs client-side data fetching. With more time, we would prefetch the first page of companies inside `src/app/companies/page.tsx` on the Next.js server using `dehydrate(queryClient)` and wrap the view in `<HydrationBoundary>`, providing instant first-paint HTML for SEO and initial load performance.
3. **Secure HttpOnly Cookie Authentication**: Instead of storing the Bearer token in client `localStorage`, a production deployment would use encrypted `HttpOnly`, `SameSite=Lax` cookies with a Next.js Edge Middleware proxy to forward the `Authorization: Bearer <token>` header to the FastAPI backend, mitigating XSS risks.
4. **Playwright End-to-End Test Suite**: Add browser-level E2E tests simulating multi-tab concurrent editing, verifying that when Tab A saves changes, Tab B receives the 409 Conflict banner, successfully reloads the version, and preserves unsaved user input.

### Intentionally Omitted Features
- **Bulk Selection / Batch Operations**: Multi-row checkboxes and bulk status updates were omitted to keep the table lightweight and focused on individual company pipeline management.
- **Custom Column Reordering / Visibility**: Left out to prioritize a clean, standardized sales workflow layout.
- **CSV / Excel Export**: Can be added as a streaming endpoint on the FastAPI backend rather than doing heavy client-side serialization.
- **Complex Granular RBAC**: All authenticated users currently have edit permissions; role-based field restrictions (e.g. read-only for SDRs, edit for Account Executives) would be enforced via backend permissions scopes.

---

## In-Memory Seed Data
The embedded store (`src/app/api/v1/companies/store.ts`) seeds 40 realistic Dutch and international B2B tech and industrial companies:
- Includes major Dutch enterprises (ASML, Adyen, Mollie, MessageBird, Picnic, Sendcloud, Bunq, Exact, Backbase, etc.) alongside global software and cloud platforms.
- Realistic lifecycle statuses distributed across `new`, `researching`, `contacted`, `qualified`, and `rejected`.
- Realistic optional domain handling (e.g., steer-co holding entities or stealth ventures with `domain: null`).
- Monotonic version integers starting at `1` with valid ISO 8601 timestamps.
- Mutated state persists in-memory for the duration of the server process. Restarting `pnpm dev` resets the store to its initial 40 seeded records.
