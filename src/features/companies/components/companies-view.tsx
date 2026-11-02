'use client';

import React from 'react';
import { useQueryState, parseAsString, parseAsInteger, parseAsBoolean } from 'nuqs';
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

  // URL state persistence via nuqs
  const [q, setQ] = useQueryState('q', parseAsString.withDefault('').withOptions({ shallow: true }));
  const [status, setStatus] = useQueryState('status', parseAsString.withDefault('all').withOptions({ shallow: true }));
  const [sort, setSort] = useQueryState('sort', parseAsString.withDefault('-created_at').withOptions({ shallow: true }));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1).withOptions({ shallow: true }));
  const [companyId, setCompanyId] = useQueryState('companyId', parseAsString.withDefault('').withOptions({ shallow: true }));
  const [create, setCreate] = useQueryState('create', parseAsBoolean.withDefault(false).withOptions({ shallow: true }));

  // Convert URL state to API query parameters
  const offset = (Math.max(1, page) - 1) * PAGE_SIZE;
  const statusParam = status === 'all' ? undefined : (status as CompanyStatus);

  const queryParams = {
    limit: PAGE_SIZE,
    offset,
    q: q || undefined,
    status: statusParam,
    sort: sort || undefined
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

  // Search input handler - resets to page 1
  const handleSearchChange = (value: string) => {
    void setQ(value || null);
    void setPage(1);
  };

  // Status filter handler - resets to page 1
  const handleStatusChange = (newStatus: string) => {
    void setStatus(newStatus === 'all' ? null : newStatus);
    void setPage(1);
  };

  // Sort handler - keeps current page or resets to 1
  const handleSortChange = (newSort: string) => {
    void setSort(newSort === '-created_at' ? null : newSort);
  };

  // Page change handler
  const handlePageChange = (newPage: number) => {
    void setPage(newPage === 1 ? null : newPage);
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
        search={q}
        onSearchChange={handleSearchChange}
        status={status}
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
        sort={sort}
        onSortChange={handleSortChange}
        onRowClick={handleRowClick}
        onCreateClick={handleCreateClick}
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

      <CompanyDrawer
        companyId={companyId || null}
        isCreate={create}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
