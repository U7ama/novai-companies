'use client';
import React from 'react';
import { ActiveThemeProvider } from '@/components/themes/active-theme';
import QueryProvider from '@/components/layout/query-provider';
import { LanguageProvider } from '@/features/i18n/i18n-context';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <QueryProvider>{children}</QueryProvider>
      </ActiveThemeProvider>
    </LanguageProvider>
  );
}
