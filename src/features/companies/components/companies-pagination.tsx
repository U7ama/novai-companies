'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useLanguage } from '@/features/i18n/i18n-context';

interface CompaniesPaginationProps {
  total: number;
  limit: number;
  offset: number;
  page: number;
  onPageChange: (newPage: number) => void;
  disabled?: boolean;
}

export function CompaniesPagination({
  total,
  limit,
  offset,
  page,
  onPageChange,
  disabled
}: CompaniesPaginationProps) {
  const { t } = useLanguage();

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(offset + limit, total);

  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className='flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t'>
      <div className='text-sm text-muted-foreground'>
        {t.pagination.showing} <span className='font-medium text-foreground'>{start}</span>{' '}
        {t.pagination.to} <span className='font-medium text-foreground'>{end}</span>{' '}
        {t.pagination.of} <span className='font-medium text-foreground'>{total}</span>{' '}
        {t.companies.toLowerCase()}
      </div>

      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevious || disabled}
          aria-label={t.pagination.previous}
        >
          <Icons.chevronLeft className='h-4 w-4 mr-1' />
          {t.pagination.previous}
        </Button>
        <div className='text-sm font-medium px-2'>
          {page} / {totalPages}
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext || disabled}
          aria-label={t.pagination.next}
        >
          {t.pagination.next}
          <Icons.chevronRight className='h-4 w-4 ml-1' />
        </Button>
      </div>
    </div>
  );
}
