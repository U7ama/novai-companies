import { NextRequest, NextResponse } from 'next/server';
import {
  getCompaniesStore,
  simulateNetworkDelay
} from '@/lib/server/companies-store';
import type { CompanyStatus } from '@/features/companies/types';

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization') ?? request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.slice(7).trim();
  return token.length > 0;
}

export async function GET(
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

  return NextResponse.json(company, { status: 200 });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await simulateNetworkDelay();

  const { id } = await context.params;
  const store = getCompaniesStore();
  const companyIndex = store.findIndex((c) => c.id === id);

  if (companyIndex === -1) {
    return NextResponse.json({ message: 'Company not found' }, { status: 404 });
  }

  const existingCompany = store[companyIndex];

  let body: {
    if_version?: number;
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

  // Validate name if provided
  if (body.name !== undefined && body.name.trim() === '') {
    return NextResponse.json(
      {
        message: 'Unprocessable Entity',
        errors: { name: 'Company name cannot be empty' }
      },
      { status: 422 }
    );
  }

  // Check optimistic concurrency version
  if (body.if_version !== undefined && body.if_version !== existingCompany.version) {
    return NextResponse.json(
      {
        message: 'Conflict: This record was modified by another user.',
        current_version: existingCompany.version
      },
      { status: 409 }
    );
  }

  // Apply updates
  if (body.name !== undefined) {
    existingCompany.name = body.name.trim();
  }
  if (body.domain !== undefined) {
    existingCompany.domain = body.domain ? body.domain.trim() : null;
  }
  if (body.status !== undefined) {
    existingCompany.status = body.status;
  }

  existingCompany.version += 1;
  existingCompany.updated_at = new Date().toISOString();

  return NextResponse.json(existingCompany, { status: 200 });
}
