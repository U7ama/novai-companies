# Next.js Developer Assessment — Part 1: Written Questions

### 1. In the App Router, when do you make a component a Server Component and when a Client Component? Give one example of each from a typical CRM screen (a filterable table with a detail drawer) and explain the boundary you would draw.

**Boundary & Rule of Thumb**: Default to Server Components for layout shells, static page scaffolding, and server-side authentication/metadata. Push the `"use client"` boundary as far down the component tree as possible, reserving Client Components strictly for interactive subtrees requiring browser APIs, state hooks (`useState`, `useQueryState`), event listeners, or client-side caching.

**CRM Example**:
- **Server Component**: The page layout and top-level route container (`/companies/page.tsx`), providing static header titles, structural layout wrappers, and initial metadata.
- **Client Component**: The interactive search toolbar, filter dropdowns, and detail drawer (`CompanyDrawer`), which bind to user keyboard input, toggle focus trapping, and maintain client-side draft edits.
- **Boundary**: Wrap the table and drawer inside an interactive client feature container (`CompaniesView`), while keeping page headers, navigation shells, and metadata at the Server Component boundary.

---

### 2. We fetch most data on the client with TanStack Query through a generated API client. When would you still fetch in a Server Component instead, and how would you hand that data to TanStack Query without fetching twice?

**When to Fetch on the Server**: For the initial page view (e.g. Page 1 of the CRM table with default filters) to eliminate client-side loading spinners, avoid layout shift, improve Largest Contentful Paint (LCP), and render populated HTML for SEO or fast first-paint.

**Handoff without Double-Fetching**:
1. Instantiate a request-scoped `QueryClient` on the server inside the Server Component.
2. Prefetch the query using `await queryClient.prefetchQuery(listCompaniesOptions(defaultParams))`.
3. Wrap the client child tree in `<HydrationBoundary state={dehydrate(queryClient)}>`.
4. On the client, `useQuery(listCompaniesOptions(params))` immediately hydrates the prefetched data from cache synchronously without firing a duplicate initial network request, provided `staleTime` is set greater than zero.

---

### 3. The API returns 409 Conflict when a record was changed by someone else between your read and your write. Describe how you would handle this in the UI, including what the user sees and what happens to the TanStack Query cache.

**UI & User Experience**:
- Never discard or blow away the user's typed changes.
- Display an inline warning banner (`role="alert"`) inside the drawer stating: *"This record was modified by another user while you were editing."*
- Provide an explicit **"Reload latest version"** action alongside the user's existing input. Clicking this action fetches the latest server version and updates the internal `if_version` baseline to match the latest server version without clearing the user's unsaved draft, allowing them to review discrepancies and re-submit.

**TanStack Query Cache**:
- Do **not** optimistically update or overwrite the cache on a failed 409 mutation.
- When the user clicks "Reload latest version" (or when 409 is received), invalidate or re-fetch `companiesKeys.detail(id)` to update the background query cache with the true server state while keeping the local form state intact.

---

### 4. A list screen has filters, sorting and pagination. Where does that state live, how does it survive a page refresh and the browser back button, and how do you keep it in sync with the query key?

**Where State Lives**: All filter, sorting, and pagination parameters live in the **URL search parameters** (managed via `nuqs` with shallow routing).

**Surviving Refresh & Back Button**: Because state is serialized directly into the URL (`?q=asml&status=qualified&sort=-created_at&page=2`), page refreshes, direct bookmarks, and browser forward/back history naturally restore the exact view state from the query string.

**Sync with Query Key**: The query key factory mirrors the URL parameters directly: `companiesKeys.list({ q, status, sort, page })`. Whenever `useQueryStates` updates URL parameters, React re-renders, generating a new deterministic query key tuple that TanStack Query immediately consumes to fetch or retrieve cached results.

---

### 5. How do you attach the user's access token to requests from a typed client that is shared between many components, and how do you handle the token expiring mid-session? Where must the token never end up?

**Attaching the Token**: Through a centralized HTTP request interceptor or client wrapper (e.g. `request()` helper in `api/client.ts`), reading the token from a secure auth store and setting `headers.set('Authorization', \`Bearer \${token}\`)` on every outbound request.

**Handling Mid-Session Expiration**:
- Intercept HTTP `401 Unauthorized` responses in the client wrapper.
- Attempt a silent refresh token exchange if supported by the identity provider; if refresh fails or is unsupported, clear local authentication state and redirect the user to `/sign-in?from=\${encodeURIComponent(currentPath)}`.

**Where the Token Must NEVER End Up**:
- Never in URL search parameters or hash fragments (leaked via server logs and `Referer` headers).
- Never in public source control, application telemetry, or client error logging payloads (e.g. Sentry error breadcrumbs).
- Never in client-rendered HTML attributes or unencrypted storage exposed to third-party scripts (HttpOnly, SameSite cookies are the preferred production standard over raw `localStorage`).

---

### 6. Explain how you would structure loading, error and empty states for a page that has a table and a side drawer, using the App Router's file conventions and React Suspense. What should and should not be wrapped in a boundary?

**File Conventions vs. Suspense Boundaries**:
- Use App Router's `loading.tsx` only for the coarse, top-level route transition.
- Wrap the table body in an isolated `<Suspense fallback={<TableSkeleton />}>` or handle loading inside the table component using `isFetching && keepPreviousData`, so that applying filters does not tear down the table header or search toolbar.
- Wrap the table area in a React `ErrorBoundary` with a retry callback so that a table query failure shows an inline error state rather than crashing the global dashboard layout.
- The **side drawer must be isolated in its own Suspense / Error boundary** separate from the table. A failure loading company details in the drawer should display an error within the drawer and must **never** take down the underlying table or navigation shell.

---

### 7. The interface is in Dutch and English. How would you organise translations in the App Router so that server-rendered text, client components and dates/numbers all respect the selected language, without shipping both languages to the client?

**Organization Strategy**:
- **Route-Based Locale Structure**: Use an App Router dynamic segment `[locale]` (e.g. `/nl/companies` vs `/en/companies`) or a server cookie/header detected in middleware.
- **Dynamic Imports**: Load only the active locale dictionary asynchronously on the server (`import(\`@/messages/\${locale}.json\`)`) and pass only that language's strings to client components through a lightweight Context provider, avoiding shipping the unused language bundle over the wire.
- **Dates & Numbers**: Format all timestamps and currencies using standard `Intl.DateTimeFormat(locale, ...)` and `Intl.NumberFormat(locale, ...)`, ensuring date conventions (e.g. `15 jan 2024, 09:30` in Dutch vs `Jan 15, 2024, 9:30 AM` in English) respect the active locale automatically.

---

### 8. What do you measure before calling a Next.js page "slow", and name two App Router features you would reach for to improve a slow data-heavy page.

**What to Measure (Core Web Vitals & Metrics)**:
1. **TTFB (Time to First Byte)**: Server response and database latency before streaming begins.
2. **LCP (Largest Contentful Paint)**: Time until the main data table or primary content is visually rendered (< 2.5s is good).
3. **INP (Interaction to Next Paint)**: UI responsiveness when clicking filters, sorting, or opening drawers (< 200ms).
4. **Hydration / Total Blocking Time (TBT)**: Client CPU execution delay before interactive handlers respond.

**Two App Router Features to Improve a Slow Data-Heavy Page**:
1. **React Server Components with Streaming (`Suspense`)**: Stream static layout chrome and table skeletons instantly while the server awaits slow database queries in parallel, unblocking TTFB.
2. **Partial Prerendering (PPR) / Incremental Static Regeneration (ISR) with Cache Tags**: Serve static layout shells from edge CDN cache while dynamically injecting tenant data with fine-grained `unstable_cache` or `fetch` tag revalidation.

---

### 9. Describe your testing approach for a feature like the one in Part 2: what you unit test, what you test with a component test, what you leave to an end-to-end test, and why.

**Unit Tests**:
- **Scope**: Pure logic, utilities, API client parameter serialization, query key factory (`companiesKeys`), and date formatting functions.
- **Why**: Executes in milliseconds with zero DOM overhead; catches schema regressions, URL string formatting bugs, and edge cases (e.g., date formatting in `nl-NL` vs `en-US`).

**Component Tests (Vitest + React Testing Library)**:
- **Scope**: Integration between UI components, URL state (`nuqs`), and React Query. Specifically: table rendering, typing into search, filtering by status dropdown, and the multi-step 409 Conflict flow (drawer opens, modifies draft, encounters 409 conflict, preserves typed draft, reloads version, and saves).
- **Why**: Fast, deterministic in-memory execution using jsdom without spawning full browsers, verifying user workflows and accessible DOM semantics (`role="alert"`, `aria-invalid`).

**End-to-End Tests (Playwright / Cypress)**:
- **Scope**: True multi-tab concurrent editing (Tab A modifies a record, Tab B submits and triggers actual backend 409), full browser authentication redirects via identity provider cookies, and cross-browser visual rendering.
- **Why**: Slower and more resource-intensive, but proves end-to-end network protocol integrity and real browser cookie/session handling.
