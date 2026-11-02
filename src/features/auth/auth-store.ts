const TOKEN_KEY = 'novai_auth_token';
const LEGACY_TOKEN_KEY = 'novai_crm_bearer_token';

let memoryToken: string | null = null;

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return memoryToken;
  }
  return memoryToken ?? localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  memoryToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(LEGACY_TOKEN_KEY, token);
    window.dispatchEvent(new Event('novai-auth-change'));
  }
}

export function clearAuthToken(): void {
  memoryToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    window.dispatchEvent(new Event('novai-auth-change'));
  }
}

export function onUnauthorized(): void {
  clearAuthToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/sign-in';
  }
}
