'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useLanguage } from '@/features/i18n/i18n-context';

export function useBreadcrumbs() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const breadcrumbs = useMemo(() => {
    if (pathname === '/companies' || pathname.startsWith('/companies/')) {
      return [{ title: t.companies, link: '/companies' }];
    }

    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path
      };
    });
  }, [pathname, t.companies]);

  return breadcrumbs;
}
