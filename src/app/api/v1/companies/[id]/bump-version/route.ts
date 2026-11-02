import { NextRequest, NextResponse } from 'next/server';
import {
  getCompaniesStore,
  simulateNetworkDelay
} from '@/lib/server/companies-store';

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization') ?? request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.slice(7).trim();
  return token.length > 0;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await simulateNetworkDelay();

  const { id } = await context.params;
  const store = getCompaniesStore();
  const company = store.find((c) => c.id === id);

  if (!company) {
    return NextResponse.json({ message: 'Company not found' }, { status: 404 });
  }

  company.version += 1;
  company.updated_at = new Date().toISOString();

  return NextResponse.json(
    {
      message: 'Server version bumped',
      id: company.id,
      version: company.version
    },
    { status: 200 }
  );
}
