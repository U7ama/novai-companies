'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { useLanguage } from '@/features/i18n/i18n-context';
import { formatDate } from '@/features/i18n/translations';
import type { Company, CompanyStatus } from '../types';

interface CompaniesTableProps {
  companies: Company[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  sort: string;
  onSortChange: (newSort: string) => void;
  onRowClick: (company: Company) => void;
  onCreateClick: () => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export function CompaniesTable({
  companies,
  isLoading,
  isFetching,
  isError,
  errorMessage,
  onRetry,
  sort,
  onSortChange,
  onRowClick,
  onCreateClick,
  hasActiveFilters,
  onClearFilters
}: CompaniesTableProps) {
  const { locale, t } = useLanguage();

  const handleSort = (field: 'name' | 'created_at') => {
    if (field === 'name') {
      onSortChange(sort === 'name' ? '-name' : 'name');
    } else {
      onSortChange(sort === '-created_at' ? 'created_at' : '-created_at');
    }
  };

  const getSortIcon = (field: 'name' | 'created_at') => {
    if (field === 'name') {
      if (sort === 'name') return <Icons.chevronUp className='ml-1 h-3.5 w-3.5' />;
      if (sort === '-name') return <Icons.chevronDown className='ml-1 h-3.5 w-3.5' />;
      return <Icons.chevronsUpDown className='ml-1 h-3.5 w-3.5 text-muted-foreground/60' />;
    }
    if (sort === 'created_at') return <Icons.chevronUp className='ml-1 h-3.5 w-3.5' />;
    if (sort === '-created_at') return <Icons.chevronDown className='ml-1 h-3.5 w-3.5' />;
    return <Icons.chevronsUpDown className='ml-1 h-3.5 w-3.5 text-muted-foreground/60' />;
  };

  const getAriaSort = (field: 'name' | 'created_at'): 'ascending' | 'descending' | 'none' => {
    if (field === 'name') {
      if (sort === 'name') return 'ascending';
      if (sort === '-name') return 'descending';
      return 'none';
    }
    if (sort === 'created_at') return 'ascending';
    if (sort === '-created_at') return 'descending';
    return 'none';
  };

  const renderStatusBadge = (status: CompanyStatus) => {
    switch (status) {
      case 'new':
        return <Badge variant='default'>{t.status.new}</Badge>;
      case 'researching':
        return <Badge variant='secondary'>{t.status.researching}</Badge>;
      case 'contacted':
        return <Badge variant='outline'>{t.status.contacted}</Badge>;
      case 'qualified':
        return (
          <Badge
            variant='outline'
            className='border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium'
          >
            {t.status.qualified}
          </Badge>
        );
      case 'rejected':
        return <Badge variant='destructive'>{t.status.rejected}</Badge>;
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  // Initial loading skeleton
  if (isLoading && companies.length === 0) {
    return (
      <div className='rounded-md border' role='status' aria-label={t.table.loading}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[35%]'>{t.table.name}</TableHead>
              <TableHead className='w-[25%]'>{t.table.domain}</TableHead>
              <TableHead className='w-[20%]'>{t.table.status}</TableHead>
              <TableHead className='w-[20%]'>{t.table.created}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(6)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className='h-5 w-40' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-5 w-28' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-5 w-20' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-5 w-24' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div
        role='alert'
        className='flex flex-col items-center justify-center p-8 rounded-lg border border-destructive/30 bg-destructive/5 text-center my-4'
      >
        <Icons.alertCircle className='h-10 w-10 text-destructive mb-3' />
        <h3 className='text-lg font-semibold text-foreground mb-1'>{t.table.errorTitle}</h3>
        <p className='text-sm text-muted-foreground mb-4 max-w-md'>
          {errorMessage || t.table.errorDescription}
        </p>
        <Button onClick={onRetry} variant='outline' size='sm'>
          <Icons.toastWarning className='mr-2 h-4 w-4' />
          {t.table.retry}
        </Button>
      </div>
    );
  }

  // Empty state
  if (companies.length === 0) {
    return (
      <div
        role='status'
        className='flex flex-col items-center justify-center p-12 rounded-lg border border-dashed text-center my-4'
      >
        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3'>
          <Icons.product className='h-6 w-6 text-muted-foreground' />
        </div>
        <h3 className='text-lg font-semibold text-foreground mb-1'>{t.table.emptyTitle}</h3>
        <p className='text-sm text-muted-foreground mb-4 max-w-md'>{t.table.emptyDescription}</p>
        <div className='flex items-center gap-2'>
          {hasActiveFilters && onClearFilters && (
            <Button onClick={onClearFilters} variant='outline' size='sm'>
              {t.table.clearFilters}
            </Button>
          )}
          <Button onClick={onCreateClick} size='sm'>
            <Icons.add className='mr-1.5 h-4 w-4' />
            {t.drawer.create}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='relative rounded-md border overflow-hidden'>
      {isFetching && (
        <div
          role='progressbar'
          aria-label={t.table.updating}
          className='absolute inset-x-0 top-0 h-0.5 bg-primary animate-pulse z-10'
        />
      )}

      <Table>
        <TableHeader>
          <TableRow className='bg-muted/30 hover:bg-muted/30'>
            <TableHead
              aria-sort={getAriaSort('name')}
              className='cursor-pointer select-none font-semibold hover:bg-muted/50 transition-colors w-[35%]'
              tabIndex={0}
              onClick={() => handleSort('name')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSort('name');
                }
              }}
            >
              <div className='flex items-center'>
                <span>{t.table.name}</span>
                {getSortIcon('name')}
              </div>
            </TableHead>

            <TableHead className='font-semibold w-[25%]'>{t.table.domain}</TableHead>

            <TableHead className='font-semibold w-[20%]'>{t.table.status}</TableHead>

            <TableHead
              aria-sort={getAriaSort('created_at')}
              className='cursor-pointer select-none font-semibold hover:bg-muted/50 transition-colors w-[20%]'
              tabIndex={0}
              onClick={() => handleSort('created_at')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSort('created_at');
                }
              }}
            >
              <div className='flex items-center'>
                <span>{t.table.created}</span>
                {getSortIcon('created_at')}
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {companies.map((company) => (
            <TableRow
              key={company.id}
              tabIndex={0}
              onClick={() => onRowClick(company)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onRowClick(company);
                }
              }}
              className='cursor-pointer hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none transition-colors'
            >
              <TableCell className='font-medium text-foreground py-3.5'>{company.name}</TableCell>

              <TableCell className='text-muted-foreground py-3.5'>
                {company.domain ? (
                  <span className='font-mono text-xs text-foreground/80'>{company.domain}</span>
                ) : (
                  <span className='text-muted-foreground/60 text-xs italic'>—</span>
                )}
              </TableCell>

              <TableCell className='py-3.5'>{renderStatusBadge(company.status)}</TableCell>

              <TableCell className='text-muted-foreground text-xs py-3.5'>
                {formatDate(company.created_at, locale)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
