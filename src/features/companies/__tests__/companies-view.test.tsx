import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { LanguageProvider } from '@/features/i18n/i18n-context';
import { setAuthToken, clearAuthToken } from '@/features/auth/auth-store';
import { CompaniesView } from '../components/companies-view';
import type { Company } from '../types';

const MOCK_COMPANIES: Company[] = [
  {
    id: 'comp_01',
    name: 'ASML Holding N.V.',
    domain: 'asml.com',
    status: 'qualified',
    version: 1,
    created_at: '2024-01-15T08:30:00.000Z',
    updated_at: '2024-01-15T08:30:00.000Z'
  },
  {
    id: 'comp_02',
    name: 'Adyen N.V.',
    domain: 'adyen.com',
    status: 'qualified',
    version: 1,
    created_at: '2024-01-18T10:15:00.000Z',
    updated_at: '2024-01-18T10:15:00.000Z'
  },
  {
    id: 'comp_03',
    name: 'Sendcloud B.V.',
    domain: 'sendcloud.com',
    status: 'new',
    version: 1,
    created_at: '2024-02-10T13:00:00.000Z',
    updated_at: '2024-02-10T13:00:00.000Z'
  }
];

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0
      },
      mutations: {
        retry: false
      }
    }
  });
}

function renderWithProviders(ui: React.ReactElement, initialSearch = '') {
  const queryClient = createTestQueryClient();
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <NuqsTestingAdapter searchParams={initialSearch} hasMemory>
          <LanguageProvider>
            {ui}
          </LanguageProvider>
        </NuqsTestingAdapter>
      </QueryClientProvider>
    ),
    queryClient
  };
}

describe('CompaniesView component tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    setAuthToken('test-bearer-token');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearAuthToken();
    globalThis.fetch = originalFetch;
  });

  it('renders companies list and filters by search', async () => {
    const user = userEvent.setup();

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      const urlObj = new URL(url, 'http://localhost');
      const q = urlObj.searchParams.get('q')?.toLowerCase() ?? '';
      const status = urlObj.searchParams.get('status');

      let filtered = [...MOCK_COMPANIES];
      if (q) {
        filtered = filtered.filter(
          (c) => c.name.toLowerCase().includes(q) || (c.domain && c.domain.toLowerCase().includes(q))
        );
      }
      if (status && status !== 'all') {
        filtered = filtered.filter((c) => c.status === status);
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({
            items: filtered,
            total: filtered.length,
            limit: 20,
            offset: 0
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    renderWithProviders(<CompaniesView />);

    // Initially loads all mock companies
    expect(await screen.findByText('ASML Holding N.V.')).toBeInTheDocument();
    expect(screen.getByText('Adyen N.V.')).toBeInTheDocument();
    expect(screen.getByText('Sendcloud B.V.')).toBeInTheDocument();

    // Search for Sendcloud
    const searchInput = screen.getByPlaceholderText(/search by company name/i);
    await user.type(searchInput, 'Sendcloud');

    // Table stays mounted and filters to Sendcloud
    await waitFor(() => {
      expect(screen.getByText('Sendcloud B.V.')).toBeInTheDocument();
      expect(screen.queryByText('ASML Holding N.V.')).not.toBeInTheDocument();
    });
  });

  it('filters companies by status dropdown', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      const urlObj = new URL(url, 'http://localhost');
      const status = urlObj.searchParams.get('status');

      let filtered = [...MOCK_COMPANIES];
      if (status && status !== 'all') {
        filtered = filtered.filter((c) => c.status === status);
      }

      return Promise.resolve(
        new Response(
          JSON.stringify({
            items: filtered,
            total: filtered.length,
            limit: 20,
            offset: 0
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    });

    renderWithProviders(<CompaniesView />);

    // Initially all 3 are present
    expect(await screen.findByText('ASML Holding N.V.')).toBeInTheDocument();
    expect(screen.getByText('Sendcloud B.V.')).toBeInTheDocument();

    // Filter by qualified status
    const statusSelect = screen.getByLabelText(/status/i);
    fireEvent.change(statusSelect, { target: { value: 'qualified' } });

    // Filtered to qualified companies only
    await waitFor(() => {
      expect(screen.getByText('ASML Holding N.V.')).toBeInTheDocument();
      expect(screen.getByText('Adyen N.V.')).toBeInTheDocument();
      expect(screen.queryByText('Sendcloud B.V.')).not.toBeInTheDocument();
    });
  });

  it('handles 409 Conflict flow: preserves user draft, reloads version, and saves successfully', async () => {
    const user = userEvent.setup();

    let serverCompanyVersion = 1;

    globalThis.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';

      // List endpoint
      if (url.includes('/api/v1/companies?') || url.endsWith('/api/v1/companies')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              items: MOCK_COMPANIES,
              total: MOCK_COMPANIES.length,
              limit: 20,
              offset: 0
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }

      // Single company GET
      if (url.endsWith('/api/v1/companies/comp_01') && method === 'GET') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              ...MOCK_COMPANIES[0],
              version: serverCompanyVersion
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }

      // Single company PATCH
      if (url.endsWith('/api/v1/companies/comp_01') && method === 'PATCH') {
        const body = JSON.parse(init?.body as string);
        if (body.if_version !== serverCompanyVersion) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                message: 'Conflict: This record was modified by another user.',
                current_version: serverCompanyVersion
              }),
              { status: 409, headers: { 'Content-Type': 'application/json' } }
            )
          );
        }

        serverCompanyVersion += 1;
        return Promise.resolve(
          new Response(
            JSON.stringify({
              ...MOCK_COMPANIES[0],
              ...body,
              version: serverCompanyVersion
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }

      return Promise.resolve(new Response(JSON.stringify({}), { status: 404 }));
    });

    // Start with drawer opened on comp_01
    renderWithProviders(<CompaniesView />, '?companyId=comp_01');

    // Wait for drawer to open with company data
    expect(await screen.findByDisplayValue('ASML Holding N.V.')).toBeInTheDocument();
    expect(screen.getByText(/Current Version/i)).toBeInTheDocument();

    // Edit the name input
    const nameInput = screen.getByDisplayValue('ASML Holding N.V.');
    await user.clear(nameInput);
    await user.type(nameInput, 'ASML Global N.V.');
    expect(nameInput).toHaveValue('ASML Global N.V.');

    // Simulate concurrent modification in backend (bump server version to 2)
    serverCompanyVersion = 2;

    // Click Save Changes (form sends if_version: 1, will conflict!)
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Conflict banner should appear with role="alert"
    const conflictAlert = await screen.findByRole('alert');
    expect(conflictAlert).toBeInTheDocument();
    expect(screen.getByText(/Concurrent Modification Detected/i)).toBeInTheDocument();

    // CRITICAL: User's typed name MUST NOT be lost!
    expect(screen.getByDisplayValue('ASML Global N.V.')).toBeInTheDocument();

    // Click "Reload latest version" button
    const reloadButton = screen.getByRole('button', { name: /reload latest version/i });
    await user.click(reloadButton);

    // Conflict banner is dismissed
    await waitFor(() => {
      expect(screen.queryByText(/Concurrent Modification Detected/i)).not.toBeInTheDocument();
    });

    // User's typed draft is STILL intact
    expect(screen.getByDisplayValue('ASML Global N.V.')).toBeInTheDocument();

    // Now re-save with updated concurrency version!
    await user.click(saveButton);

    // Should succeed and drawer closes (dialog unmounts or closes)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
