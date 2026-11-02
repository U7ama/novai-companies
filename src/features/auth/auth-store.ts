const TOKEN_KEY = 'novai_auth_token';
const LEGACY_TOKEN_KEY = 'novai_crm_bearer_token';

let memoryToken: string | null = null;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

function writeCookie(name: string, value: string, maxAgeDays = 30): void {
  if (typeof document === 'undefined') return;
  const maxAge = maxAgeDays * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function getAuthToken(): string | null {
  if (memoryToken) {
    return memoryToken;
  }
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const local = localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
    if (local) {
      memoryToken = local;
      return local;
    }
  } catch {
    // LocalStorage unavailable/blocked
  }
  const cookie = readCookie(TOKEN_KEY) ?? readCookie(LEGACY_TOKEN_KEY);
  if (cookie) {
    memoryToken = cookie;
    return cookie;
  }
  return null;
}

export function setAuthToken(token: string): void {
  memoryToken = token;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(LEGACY_TOKEN_KEY, token);
    } catch {
      // LocalStorage unavailable/blocked
    }
    try {
      writeCookie(TOKEN_KEY, token);
      writeCookie(LEGACY_TOKEN_KEY, token);
    } catch {
      // Cookies blocked
    }
    window.dispatchEvent(new Event('novai-auth-change'));
  }
}

export function clearAuthToken(): void {
  memoryToken = null;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    } catch {}
    try {
      deleteCookie(TOKEN_KEY);
      deleteCookie(LEGACY_TOKEN_KEY);
    } catch {}
    window.dispatchEvent(new Event('novai-auth-change'));
  }
}

export function onUnauthorized(): void {
  clearAuthToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/sign-in';
  }
}
