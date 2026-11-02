'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from './auth-store';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('novai-auth-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('novai-auth-change', callback);
  };
}

function getSnapshot(): string | null {
  return getAuthToken();
}

function getServerSnapshot(): string | null {
  return null;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!token) {
      router.replace('/sign-in');
    }
  }, [token, router]);

  if (!token) {
    return (
      <div className='flex h-screen w-screen items-center justify-center bg-background'>
        <div className='h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
      </div>
    );
  }

  return <>{children}</>;
}
