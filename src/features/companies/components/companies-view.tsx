'use client';

import React from 'react';
import { useQueryState, useQueryStates, parseAsString, parseAsInteger, parseAsBoolean } from 'nuqs';
import { useQuery } from '@tanstack/react-query';
import { Heading } from '@/components/ui/heading';
import { useLanguage } from '@/features/i18n/i18n-context';
import { listCompaniesOptions } from '../api/queries';
import { CompaniesToolbar } from './companies-toolbar';
import { CompaniesTable } from './companies-table';
import { CompaniesPagination } from './companies-pagination';
import { CompanyDrawer } from './company-drawer';
import type { Company, CompanyStatus } from '../types';

const PAGE_SIZE = 20;

export function CompaniesView() {
  const { t } = useLanguage();

  // URL state persistence via nuqs useQueryStates (atomic updates)
  const [params, setParams] = useQueryStates(
    {
      q: parseAsString.withDefault(''),
      status: parseAsString.withDefault('all'),
      sort: parseAsString.withDefault('-created_at'),
      page: parseAsInteger.withDefault(1)
    },
    { shallow: true }
  );

  // Drawer state
  const [companyId, setCompanyId] = useQueryState(
    'companyId',
    parseAsString.withDefault('').withOptions({ shallow: true })
  );
  const [create, setCreate] = useQueryState(
    'create',
    parseAsBoolean.withDefault(false).withOptions({ shallow: true })
  );

  // Convert URL state to API query parameters
  const offset = (Math.max(1, params.page) - 1) * PAGE_SIZE;
  const statusParam = params.status === 'all' ? undefined : (params.status as CompanyStatus);

  const queryParams = {
    limit: PAGE_SIZE,
    offset,
    q: params.q || undefined,
    status: statusParam,
    sort: params.sort || undefined
  };

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useQuery(listCompaniesOptions(queryParams));

  const companies = data?.items ?? [];
  const total = data?.total ?? 0;

  // Search input handler - resets to page 1 atomically
  const handleSearchChange = (value: string) => {
    void setParams({ q: value || null, page: 1 });
  };

  // Status filter handler - resets to page 1 atomically
  const handleStatusChange = (newStatus: string) => {
    void setParams({ status: newStatus === 'all' ? null : newStatus, page: 1 });
  };

  // Sort handler
  const handleSortChange = (newSort: string) => {
    void setParams({ sort: newSort === '-created_at' ? null : newSort });
  };

  // Page change handler
  const handlePageChange = (newPage: number) => {
    void setParams({ page: newPage === 1 ? null : newPage });
  };

  // Row click -> opens drawer in edit mode
  const handleRowClick = (company: Company) => {
    void setCreate(null);
    void setCompanyId(company.id);
  };

  // Create button -> opens drawer in create mode
  const handleCreateClick = () => {
    void setCompanyId(null);
    void setCreate(true);
  };

  // Close drawer
  const handleCloseDrawer = () => {
    void setCompanyId(null);
    void setCreate(null);
  };

  return (
    <div className='flex flex-col flex-1 gap-4'>
      <div className='flex items-start justify-between'>
        <Heading
          title={t.companies}
          description={t.companiesSubtitle}
        />
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
      />

      {total > 0 && (
        <CompaniesPagination
          total={total}
          limit={PAGE_SIZE}
          offset={offset}
          page={params.page}
          onPageChange={handlePageChange}
          disabled={isFetching}
        />
      )}

      <CompanyDrawer
        companyId={companyId || null}
        isCreate={create}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
