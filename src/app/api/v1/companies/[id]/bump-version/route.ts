import { mutateCompaniesStore } from '@/lib/server/companies-repository';
import { checkAuth } from '@/lib/server/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { simulateNetworkDelay } from '@/lib/server/companies-store';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!checkAuth(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await simulateNetworkDelay();

  const { id } = await context.params;
  return mutateCompaniesStore<Response>((store) => {
    const company = store.find((record) => record.id === id);
    if (!company) {
      return {
        value: NextResponse.json({ message: 'Company not found' }, { status: 404 }),
        changed: false
      };
    }
    company.version += 1;
    company.updated_at = new Date().toISOString();
    return {
      value: NextResponse.json({
        message: 'Server version bumped',
        id: company.id,
        version: company.version
      }),
      changed: true
    };
  });
}
