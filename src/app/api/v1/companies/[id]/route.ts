import { readCompaniesStore, mutateCompaniesStore } from '@/lib/server/companies-repository';
import { updateCompanySchema, validationErrors } from '@/features/companies/validation';
import { checkAuth } from '@/lib/server/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { simulateNetworkDelay } from '@/lib/server/companies-store';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!checkAuth(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await simulateNetworkDelay();

  const { id } = await context.params;
  const store = await readCompaniesStore();
  const company = store.find((c) => c.id === id);

  if (!company) {
    return NextResponse.json({ message: 'Company not found' }, { status: 404 });
  }

  return NextResponse.json(company, { status: 200 });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!checkAuth(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await simulateNetworkDelay();

  const { id } = await context.params;
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = updateCompanySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Unprocessable Entity', errors: validationErrors(parsed.error) },
      { status: 422 }
    );
  }
  const body = parsed.data;

  return mutateCompaniesStore<Response>((store) => {
    const existingCompany = store.find((company) => company.id === id);
    if (!existingCompany) {
      return {
        value: NextResponse.json({ message: 'Company not found' }, { status: 404 }),
        changed: false
      };
    }
    if (body.if_version !== existingCompany.version) {
      return {
        value: NextResponse.json(
          {
            message: 'Conflict: This record was modified by another user.',
            current_version: existingCompany.version
          },
          { status: 409 }
        ),
        changed: false
      };
    }
    if (body.name !== undefined) existingCompany.name = body.name;
    if (body.domain !== undefined) existingCompany.domain = body.domain || null;
    if (body.status !== undefined) existingCompany.status = body.status;
    existingCompany.version += 1;
    existingCompany.updated_at = new Date().toISOString();
    return { value: NextResponse.json(existingCompany), changed: true };
  });
}
