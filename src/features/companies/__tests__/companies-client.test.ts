import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { companiesKeys, listCompaniesOptions, companyDetailOptions } from '../api/queries';
import { companiesApi, ApiError } from '../api/client';
import { setAuthToken, clearAuthToken, getAuthToken } from '@/features/auth/auth-store';

describe('companiesKeys and query options', () => {
  it('generates normalized query keys', () => {
    expect(companiesKeys.all).toEqual(['companies']);
    expect(companiesKeys.lists()).toEqual(['companies', 'list']);
    expect(companiesKeys.list({ q: 'asml' })).toEqual(['companies', 'list', { q: 'asml' }]);
    expect(companiesKeys.details()).toEqual(['companies', 'detail']);
    expect(companiesKeys.detail('comp_01')).toEqual(['companies', 'detail', 'comp_01']);
  });

  it('configures listCompaniesOptions with placeholderData', () => {
    const options = listCompaniesOptions({ limit: 20, offset: 0 });
    expect(options.queryKey).toEqual(['companies', 'list', { limit: 20, offset: 0 }]);
    expect(typeof options.placeholderData).toBe('function');
  });

  it('configures companyDetailOptions', () => {
    const options = companyDetailOptions('comp_42');
    expect(options.queryKey).toEqual(['companies', 'detail', 'comp_42']);
    expect(typeof options.queryFn).toBe('function');
  });
});

describe('companiesApi client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    clearAuthToken();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('injects Authorization: Bearer <token> header when token is present', async () => {
    setAuthToken('mock-secret-token');

    let capturedHeaders: Headers | undefined;
    globalThis.fetch = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      capturedHeaders = new Headers(init?.headers);
      return Promise.resolve(
        new Response(JSON.stringify({ items: [], total: 0, limit: 20, offset: 0 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    await companiesApi.list({ q: 'test' });
    expect(capturedHeaders?.get('Authorization')).toBe('Bearer mock-secret-token');
    expect(capturedHeaders?.get('Content-Type')).toBe('application/json');
  });

  it('handles 401 Unauthorized by clearing token and throwing ApiError', async () => {
    setAuthToken('expired-token');

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    await expect(companiesApi.list()).rejects.toThrow(ApiError);
    expect(getAuthToken()).toBeNull();
  });

  it('handles 409 Conflict with parsed ApiError and message', async () => {
    setAuthToken('valid-token');

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'Conflict: This record was modified by another user.',
          current_version: 3
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    );

    try {
      await companiesApi.update('comp_01', { if_version: 1, name: 'New Name' });
      expect.unreachable('Should have thrown ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(409);
      expect(apiErr.message).toContain('Conflict');
    }
  });

  it('handles 422 Unprocessable Entity with parsed field-level errors', async () => {
    setAuthToken('valid-token');

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'Unprocessable Entity',
          errors: { name: 'Company name is required' }
        }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    );

    try {
      await companiesApi.create({ name: '' });
      expect.unreachable('Should have thrown ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(422);
      expect(apiErr.errors?.name).toBe('Company name is required');
    }
  });
});
