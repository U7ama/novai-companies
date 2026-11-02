import { getAuthToken, onUnauthorized } from '@/features/auth/auth-store';
import type { Company, CompanyStatus } from '../types';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ListCompaniesParams = {
  limit?: number;
  offset?: number;
  q?: string;
  status?: CompanyStatus;
  sort?: string;
};

export type ListCompaniesResponse = {
  items: Company[];
  total: number;
  limit: number;
  offset: number;
};

export type CreateCompanyBody = {
  name: string;
  domain?: string | null;
  status?: CompanyStatus;
};

export type UpdateCompanyBody = {
  if_version: number;
  name?: string;
  domain?: string | null;
  status?: CompanyStatus;
};

const BASE_URL = '/api/v1/companies';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // CloudFront signs the private Lambda origin request. Writes also need the
  // hash of the original payload so AWS can verify that signature.
  if (process.env.NEXT_PUBLIC_AWS_OAC === 'true' && options.method !== 'GET') {
    const payload = typeof options.body === 'string' ? options.body : '';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
    headers.set(
      'x-amz-content-sha256',
      Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
    );
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (response.status === 401) {
    onUnauthorized();
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    let errorData: { message?: string; errors?: Record<string, string> } = {};
    try {
      errorData = await response.json();
    } catch {
      // Body not JSON
    }

    throw new ApiError(
      response.status,
      errorData.message ?? `Request failed with status ${response.status}`,
      errorData.errors
    );
  }

  return response.json() as Promise<T>;
}

export const companiesApi = {
  async list(params: ListCompaniesParams = {}): Promise<ListCompaniesResponse> {
    const searchParams = new URLSearchParams();
    if (params.limit !== undefined) {
      searchParams.set('limit', params.limit.toString());
    }
    if (params.offset !== undefined) {
      searchParams.set('offset', params.offset.toString());
    }
    if (params.q) {
      searchParams.set('q', params.q);
    }
    if (params.status) {
      searchParams.set('status', params.status);
    }
    if (params.sort) {
      searchParams.set('sort', params.sort);
    }

    const query = searchParams.toString();
    const endpoint = query ? `${BASE_URL}?${query}` : BASE_URL;
    return request<ListCompaniesResponse>(endpoint, { method: 'GET' });
  },

  async getById(id: string): Promise<Company> {
    return request<Company>(`${BASE_URL}/${encodeURIComponent(id)}`, { method: 'GET' });
  },

  async create(body: CreateCompanyBody): Promise<Company> {
    return request<Company>(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  async update(id: string, body: UpdateCompanyBody): Promise<Company> {
    return request<Company>(`${BASE_URL}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

  async bumpVersion(id: string): Promise<{ message: string; id: string; version: number }> {
    return request<{ message: string; id: string; version: number }>(
      `${BASE_URL}/${encodeURIComponent(id)}/bump-version`,
      { method: 'POST' }
    );
  }
};
