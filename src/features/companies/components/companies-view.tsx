'use client';

import React, { useEffect } from 'react';
import {
  useQueryStates,
  parseAsString,
  parseAsInteger,
  parseAsBoolean,
  parseAsStringEnum
} from 'nuqs';
import { useQuery } from '@tanstack/react-query';
import { Heading } from '@/components/ui/heading';
import { useLanguage } from '@/features/i18n/i18n-context';
import { listCompaniesOptions } from '../api/queries';
import { CompaniesToolbar } from './companies-toolbar';
import { CompaniesTable } from './companies-table';
import { CompaniesPagination } from './companies-pagination';
import { CompanyDrawer } from './company-drawer';
import { COMPANY_STATUSES, COMPANY_SORTS } from '../validation';
import type { Company } from '../types';

const PAGE_SIZE = 20;

export function CompaniesView() {
  const { t } = useLanguage();

  // URL state persistence via nuqs useQueryStates (atomic updates)
  const [params, setParams] = useQueryStates(
    {
      q: parseAsString.withDefault(''),
      status: parseAsStringEnum(['all', ...COMPANY_STATUSES]).withDefault('all'),
      sort: parseAsStringEnum([...COMPANY_SORTS]).withDefault('-created_at'),
      page: parseAsInteger.withDefault(1),
      companyId: parseAsString.withDefault(''),
      create: parseAsBoolean.withDefault(false)
    },
    { shallow: true, history: 'push' }
  );

  const { companyId, create } = params;

  // Convert URL state to API query parameters
  const page = Math.max(1, params.page);
  const offset = (page - 1) * PAGE_SIZE;
  const statusParam = params.status === 'all' ? undefined : params.status;

  const queryParams = {
    limit: PAGE_SIZE,
    offset,
    q: params.q || undefined,
    status: statusParam,
    sort: params.sort || undefined
  };

  const { data, isLoading, isFetching, isPlaceholderData, isError, error, refetch } = useQuery(
    listCompaniesOptions(queryParams)
  );

  const companies = data?.items ?? [];
  const total = data?.total ?? 0;

  useEffect(() => {
    if (isFetching || isPlaceholderData || !data) return;
    const lastPage = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
    const normalizedPage = Math.min(page, lastPage);
    if (params.page !== normalizedPage) {
      void setParams({ page: normalizedPage }, { history: 'replace' });
    }
  }, [data, isFetching, isPlaceholderData, page, params.page, setParams]);

  // Search input handler - resets to page 1 atomically
  const handleSearchChange = (value: string) => {
    void setParams({ q: value || null, page: 1 });
  };

  // Status filter handler - resets to page 1 atomically
  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'all' || COMPANY_STATUSES.some((value) => value === newStatus)) {
      void setParams({
        status: newStatus === 'all' ? null : (newStatus as typeof params.status),
        page: 1
      });
    }
  };

  // Sort handler
  const handleSortChange = (newSort: string) => {
    if (COMPANY_SORTS.some((value) => value === newSort)) {
      void setParams({ sort: newSort as typeof params.sort, page: 1 });
    }
  };

  // Page change handler
  const handlePageChange = (newPage: number) => {
    void setParams({ page: newPage === 1 ? null : newPage });
  };

  // Row click -> opens drawer in edit mode
  const handleRowClick = (company: Company) => {
    void setParams({ create: null, companyId: company.id });
  };

  // Create button -> opens drawer in create mode
  const handleCreateClick = () => {
    void setParams({ companyId: null, create: true });
  };

  // Close drawer
  const handleCloseDrawer = () => {
    void setParams({ companyId: null, create: null });
  };

  return (
    <div className='flex flex-col flex-1 gap-4'>
      <div className='flex items-start justify-between'>
        <Heading title={t.companies} description={t.companiesSubtitle} />
      </div>

      <CompaniesToolbar
        search={params.q}
        onSearchChange={handleSearchChange}
        status={params.status}
        onStatusChange={handleStatusChange}
        onCreateClick={handleCreateClick}
        isFetching={isFetching && !isLoading}
      />

      <CompaniesTable
        companies={companies}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
        sort={params.sort}
        onSortChange={handleSortChange}
        onRowClick={handleRowClick}
        onCreateClick={handleCreateClick}
        hasActiveFilters={Boolean(params.q || (params.status && params.status !== 'all'))}
        onClearFilters={() => void setParams({ q: null, status: null, page: 1 })}
      />

      {total > 0 && (
        <CompaniesPagination
          total={total}
          limit={PAGE_SIZE}
          offset={offset}
          page={page}
          onPageChange={handlePageChange}
          disabled={isFetching}
        />
      )}

      <CompanyDrawer companyId={companyId || null} isCreate={create} onClose={handleCloseDrawer} />
    </div>
  );
}
