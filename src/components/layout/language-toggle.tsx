'use client';

import { useLanguage } from '@/features/i18n/i18n-context';
import { Button } from '@/components/ui/button';

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      role='group'
      aria-label='Language toggle'
      className='flex items-center rounded-md border p-0.5 bg-muted/40'
    >
      <Button
        variant={locale === 'en' ? 'secondary' : 'ghost'}
        size='sm'
        className='h-7 px-2.5 text-xs font-semibold'
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
      >
        EN
      </Button>
      <Button
        variant={locale === 'nl' ? 'secondary' : 'ghost'}
        size='sm'
        className='h-7 px-2.5 text-xs font-semibold'
        onClick={() => setLocale('nl')}
        aria-pressed={locale === 'nl'}
      >
        NL
      </Button>
    </div>
  );
}
