// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import type { Company } from '../types';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/v1/companies/route';
import { GET as detail, PATCH } from '@/app/api/v1/companies/[id]/route';
import { POST as bump } from '@/app/api/v1/companies/[id]/bump-version/route';
import { resetCompaniesStore } from '@/lib/server/companies-store';

const context = (id = 'comp_01') => ({ params: Promise.resolve({ id }) });
const request = (path = '', method = 'GET', body?: unknown, auth = true) =>
  new NextRequest(`http://localhost/api/v1/companies${path}`, {
    method,
    headers: auth ? { authorization: 'Bearer test' } : {},
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
beforeEach(resetCompaniesStore);

describe('company API contract', () => {
  it('requires bearer auth on every endpoint', async () => {
    const responses = await Promise.all([
      GET(request('', 'GET', undefined, false)),
      POST(request('', 'POST', {}, false)),
      detail(request('/comp_01', 'GET', undefined, false), context()),
      PATCH(request('/comp_01', 'PATCH', {}, false), context()),
      bump(request('/comp_01/bump-version', 'POST', {}, false), context())
    ]);
    expect(responses.map((r) => r.status)).toEqual([401, 401, 401, 401, 401]);
  });
  it('seeds 40 records, paginates, searches names/domains and filters status', async () => {
    const first = await (await GET(request('?limit=20&offset=0'))).json();
    const second = await (await GET(request('?limit=20&offset=20'))).json();
    expect(first.total).toBe(40);
    expect(first.items).toHaveLength(20);
    expect(second.items).toHaveLength(20);
    expect(new Set([...first.items, ...second.items].map((c: Company) => c.id)).size).toBe(40);
    for (const q of ['ASML', 'asml.com']) {
      const result = await (await GET(request(`?q=${q}&status=qualified`))).json();
      expect(result.total).toBe(1);
      expect(result.items[0].id).toBe('comp_01');
    }
  });
  it.each(['name', '-name', 'created_at', '-created_at'])('sorts by %s', async (sort) => {
    const { items } = await (await GET(request(`?limit=40&sort=${sort}`))).json();
    const values: string[] = items.map((c: Company) =>
      sort.includes('name') ? c.name : c.created_at
    );
    const sorted = values.toSorted((a, b) => a.localeCompare(b));
    if (sort.startsWith('-')) sorted.reverse();
    expect(values).toEqual(sorted);
  });
  it.each([
    {},
    { name: '' },
    { name: '  ' },
    { name: 123 },
    null,
    { name: 'Test', status: 'unknown' },
    { name: 'Test', domain: 'bad domain.' }
  ])('rejects malformed create body: %j', async (body) => {
    const response = await POST(request('', 'POST', body));
    expect(response.status).toBe(422);
    expect((await response.json()).errors).toBeDefined();
  });
  it('creates and reads a company', async () => {
    const response = await POST(request('', 'POST', { name: '  Test Company  ', domain: null }));
    expect(response.status).toBe(201);
    const company = await response.json();
    expect(company).toMatchObject({
      name: 'Test Company',
      domain: null,
      status: 'new',
      version: 1
    });
    expect((await detail(request(`/${company.id}`), context(company.id))).status).toBe(200);
  });
  it.each([
    {},
    { if_version: null },
    { if_version: '1' },
    { if_version: 0 },
    { if_version: 1, name: null },
    { if_version: 1, domain: 42 },
    { if_version: 1, status: 'unknown' }
  ])('rejects invalid updates without changing data: %j', async (body) => {
    expect((await PATCH(request('/comp_01', 'PATCH', body), context())).status).toBe(422);
    const company = await (await detail(request('/comp_01'), context())).json();
    expect(company.version).toBe(1);
    expect(company.name).toBe('ASML Holding N.V.');
  });
  it('rejects stale versions and allows only one concurrent write', async () => {
    const responses = await Promise.all([
      PATCH(request('/comp_01', 'PATCH', { if_version: 1, name: 'First' }), context()),
      PATCH(request('/comp_01', 'PATCH', { if_version: 1, name: 'Second' }), context())
    ]);
    expect(responses.map((r) => r.status).toSorted()).toEqual([200, 409]);
    const conflict = await responses.find((r) => r.status === 409)!.json();
    expect(conflict.current_version).toBe(2);
  });
  it('returns 404 for missing companies', async () => {
    expect((await detail(request('/missing'), context('missing'))).status).toBe(404);
    expect(
      (await PATCH(request('/missing', 'PATCH', { if_version: 1 }), context('missing'))).status
    ).toBe(404);
  });
});
