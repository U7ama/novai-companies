import { NextRequest, NextResponse } from 'next/server';
import {
  getCompaniesStore,
  simulateNetworkDelay
} from '@/lib/server/companies-store';
import type { Company, CompanyStatus } from '@/features/companies/types';

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization') ?? request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.slice(7).trim();
  return token.length > 0;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await simulateNetworkDelay();

  const { searchParams } = new URL(request.url);
  const limit = Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20);
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10) || 0);
  const q = searchParams.get('q')?.trim().toLowerCase() ?? '';
  const status = searchParams.get('status')?.trim() as CompanyStatus | undefined;
  const sort = searchParams.get('sort')?.trim() ?? '-created_at';

  let items = [...getCompaniesStore()];

  // Search filter (name and domain)
  if (q) {
    items = items.filter((comp) => {
      const matchName = comp.name.toLowerCase().includes(q);
      const matchDomain = comp.domain ? comp.domain.toLowerCase().includes(q) : false;
      return matchName || matchDomain;
    });
  }

  // Status filter
  if (status && status !== 'all' as string) {
    items = items.filter((comp) => comp.status === status);
  }

  // Sorting
  items.sort((a, b) => {
    switch (sort) {
      case 'name':
        return a.name.localeCompare(b.name);
      case '-name':
        return b.name.localeCompare(a.name);
      case 'created_at':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case '-created_at':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const total = items.length;
  const paginated = items.slice(offset, offset + limit);

  return NextResponse.json({
    items: paginated,
    total,
    limit,
    offset
  });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await simulateNetworkDelay();

  let body: {
    name?: string;
    domain?: string | null;
    status?: CompanyStatus;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json(
      {
        message: 'Unprocessable Entity',
        errors: { name: 'Company name is required' }
      },
      { status: 422 }
    );
  }

  const now = new Date().toISOString();
  const domain = body.domain ? body.domain.trim() : null;
  const status: CompanyStatus = body.status ?? 'new';

  const newCompany: Company = {
    id: `comp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    domain,
    status,
    version: 1,
    created_at: now,
    updated_at: now
  };

  const store = getCompaniesStore();
  store.unshift(newCompany);

  return NextResponse.json(newCompany, { status: 201 });
}
