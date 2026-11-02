import { afterEach, expect, it, vi } from 'vitest';
import { clearAuthToken, getAuthToken, onUnauthorized, setAuthToken } from './auth-store';
afterEach(() => {
  vi.unstubAllGlobals();
  clearAuthToken();
});
it('observes sign-out in another tab instead of using an old in-memory token', () => {
  setAuthToken('test');
  localStorage.removeItem('novai_auth_token');
  localStorage.removeItem('novai_crm_bearer_token');
  document.cookie = 'novai_auth_token=; path=/; max-age=0';
  document.cookie = 'novai_crm_bearer_token=; path=/; max-age=0';
  window.dispatchEvent(new StorageEvent('storage', { key: 'novai_auth_token', newValue: null }));
  expect(getAuthToken()).toBeNull();
});
it('clears auth and redirects to sign-in on unauthorized', () => {
  setAuthToken('test');
  const location = { href: '/companies' };
  vi.stubGlobal('window', { location, dispatchEvent: vi.fn() });
  onUnauthorized();
  expect(getAuthToken()).toBeNull();
  expect(location.href).toBe('/sign-in');
});
