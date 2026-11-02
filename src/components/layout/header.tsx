'use client';

import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Breadcrumbs } from '../breadcrumbs';
import { ThemeModeToggle } from '../themes/theme-mode-toggle';
import { LanguageToggle } from './language-toggle';
import { Button } from '../ui/button';
import { Icons } from '../icons';
import { clearAuthToken } from '@/features/auth/auth-store';
import { useLanguage } from '@/features/i18n/i18n-context';

function handleSignOut() {
  clearAuthToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/sign-in';
  }
}

export default function Header() {
  const { t } = useLanguage();

  return (
    <header className='bg-background/60 sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b backdrop-blur-md md:h-14'>
      <div className='flex items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4 data-vertical:self-center' />
        <Breadcrumbs />
      </div>

      <div id='header-actions' className='flex items-center gap-2 px-4'>
        <LanguageToggle />
        <ThemeModeToggle />
        <Button
          variant='ghost'
          size='sm'
          onClick={handleSignOut}
          className='text-xs text-muted-foreground hover:text-foreground'
          title={t.auth.signOut}
        >
          <Icons.logout className='mr-1.5 h-3.5 w-3.5' />
          <span className='hidden sm:inline'>{t.auth.signOut}</span>
        </Button>
      </div>
    </header>
  );
}
