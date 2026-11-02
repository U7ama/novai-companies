'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Icons } from '@/components/icons';
import { useLanguage } from '@/features/i18n/i18n-context';
import type { CompanyStatus } from '../types';

interface CompaniesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  onCreateClick: () => void;
  isFetching?: boolean;
}

const STATUS_KEYS: CompanyStatus[] = [
  'new',
  'researching',
  'contacted',
  'qualified',
  'rejected'
];

export function CompaniesToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onCreateClick,
  isFetching
}: CompaniesToolbarProps) {
  const { t } = useLanguage();

  return (
    <div className='flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4'>
      <div className='flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3'>
        <div className='relative flex-1 min-w-[200px]'>
          <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
          <Input
            type='search'
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className='pl-9 h-9'
            aria-label={t.searchPlaceholder}
          />
          {isFetching && (
            <div className='absolute right-3 top-1/2 -translate-y-1/2'>
              <Icons.spinner className='h-3.5 w-3.5 animate-spin text-muted-foreground' />
            </div>
          )}
        </div>

        <div className='w-full sm:w-44 shrink-0'>
          <NativeSelect
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className='w-full h-9'
            aria-label={t.table.status}
          >
            <NativeSelectOption value='all'>{t.allStatuses}</NativeSelectOption>
            {STATUS_KEYS.map((key) => (
              <NativeSelectOption key={key} value={key}>
                {t.status[key]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className='flex items-center gap-2 shrink-0'>
        <Button onClick={onCreateClick} size='sm' className='h-9 font-medium whitespace-nowrap'>
          <Icons.add className='mr-1.5 h-4 w-4' />
          {t.drawer.create}
        </Button>
      </div>
    </div>
  );
}
