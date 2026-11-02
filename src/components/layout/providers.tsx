'use client';

import type { ReactNode } from 'react';
import QueryProvider from '@/components/layout/query-provider';
import { LanguageProvider } from '@/features/i18n/i18n-context';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <QueryProvider>{children}</QueryProvider>
    </LanguageProvider>
  );
}
