import { SESSION_CONFIG } from '@/config/constants';
import type { Session } from '@/types';

const SESSION_STORAGE_KEY = 'veilwallet_session';
const SESSION_EXPIRY_KEY = 'veilwallet_session_expiry';

/**
 * Store session in localStorage
 */
export function storeSession(session: Session): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem(SESSION_EXPIRY_KEY, session.expiresAt);
}

/**
 * Get session from localStorage
 */
export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;

  const sessionStr = localStorage.getItem(SESSION_STORAGE_KEY);
  const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);

  if (!sessionStr || !expiryStr) return null;

  // Check if session is expired
  const expiryDate = new Date(expiryStr);
  if (expiryDate < new Date()) {
    clearSession();
    return null;
  }

  try {
    return JSON.parse(sessionStr);
  } catch {
    return null;
  }
}

/**
 * Clear session from localStorage
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(SESSION_EXPIRY_KEY);
}

/**
 * Check if session is valid
 */
export function isSessionValid(): boolean {
  const session = getSession();
  return session !== null;
}

/**
 * Get session token
 */
export function getSessionToken(): string | null {
  const session = getSession();
  return session?.token || null;
}

/**
 * Store key ID reference (not the key itself)
 */
export function storeKeyId(keyId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('veilwallet_key_id', keyId);
}

/**
 * Get key ID reference
 */
export function getKeyId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('veilwallet_key_id');
}

/**
 * Clear key ID reference
 */
export function clearKeyId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('veilwallet_key_id');
}

/**
 * Store session key
 */
export function storeSessionKey(sessionKey: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('veilwallet_session_key', sessionKey);
}

/**
 * Get session key
 */
export function getSessionKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('veilwallet_session_key');
}

/**
 * Clear session key
 */
export function clearSessionKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('veilwallet_session_key');
}

