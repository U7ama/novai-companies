import type { NextRequest } from 'next/server';

export function checkAuth(request: NextRequest): boolean {
  return /^Bearer\s+\S+$/i.test(request.headers.get('authorization')?.trim() ?? '');
}
