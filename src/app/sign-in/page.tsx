'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { setAuthToken } from '@/features/auth/auth-store';
import { useLanguage } from '@/features/i18n/i18n-context';
import { LanguageToggle } from '@/components/layout/language-toggle';
import { ThemeModeToggle } from '@/components/themes/theme-mode-toggle';

export default function SignInPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [token, setToken] = useState('novai-bearer-token-live');
  const [error, setError] = useState('');

  const performSignIn = (rawToken: string) => {
    const cleanToken = rawToken.trim();
    if (!cleanToken) {
      setError(t.auth.tokenRequired);
      return;
    }
    setError('');
    setAuthToken(cleanToken);
    if (typeof window !== 'undefined') {
      window.location.assign('/companies');
    } else {
      router.replace('/companies');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    performSignIn(token);
  };

  const handleQuickDemoSignIn = () => {
    const demoToken = 'novai-bearer-token-live';
    setToken(demoToken);
    performSignIn(demoToken);
  };

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30'>
      <div className='absolute top-4 right-4 flex items-center gap-2'>
        <LanguageToggle />
        <ThemeModeToggle />
      </div>

      <div className='w-full max-w-md'>
        <div className='mb-8 flex flex-col items-center text-center'>
          <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md'>
            <Icons.logo className='h-6 w-6' />
          </div>
          <h1 className='text-2xl font-bold tracking-tight'>Novai CRM</h1>
          <p className='text-sm text-muted-foreground'>B2B Companies Management</p>
        </div>

        <Card className='shadow-lg border-border/80'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-xl'>{t.auth.title}</CardTitle>
            <CardDescription>{t.auth.subtitle}</CardDescription>
          </CardHeader>

          <form action='javascript:void(0)' method='post' onSubmit={handleSubmit}>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='bearer-token'>{t.auth.tokenLabel}</Label>
                <Input
                  id='bearer-token'
                  type='text'
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={t.auth.tokenPlaceholder}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'token-error' : undefined}
                  autoFocus
                />
                {error && (
                  <p id='token-error' role='alert' className='text-xs font-medium text-destructive'>
                    {error}
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className='flex flex-col gap-2.5'>
              <Button type='submit' className='w-full'>
                <Icons.login className='mr-2 h-4 w-4' />
                {t.auth.signInButton}
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={handleQuickDemoSignIn}
                className='w-full font-medium'
              >
                <Icons.check className='mr-2 h-4 w-4' />
                {t.auth.quickFill} & {t.auth.signInButton}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
