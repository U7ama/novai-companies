const TOKEN_KEY = 'novai_auth_token';

let memoryToken: string | null = null;

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return memoryToken;
  }
  return memoryToken ?? localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  memoryToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearAuthToken(): void {
  memoryToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function onUnauthorized(): void {
  clearAuthToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/sign-in';
  }
}
