import { cookies } from 'next/headers';

export const ADMIN_SESSION_COOKIE = 'pi_admin_session';
const SESSION_DAYS = 7;

function getSecret() {
  return process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || 'propintel-admin-dev-secret';
}

export function getAdminPanelCredentials() {
  return {
    username: (process.env.ADMIN_USERNAME || 'propintel@admin').trim(),
    password: (process.env.ADMIN_PASSWORD || 'PropIntel@Admin@2026!!').trim(),
  };
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]!);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return toBase64Url(sig);
}

async function hmacVerify(payload: string, signature: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(payload, secret);
  if (expected.length !== signature.length) return false;
  let ok = 0;
  for (let i = 0; i < expected.length; i++) {
    ok |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return ok === 0;
}

export type AdminPanelSession = {
  username: string;
  exp: number;
};

export async function createAdminSessionToken(username: string): Promise<string> {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({ u: username, exp })));
  const sig = await hmacSign(payload, getSecret());
  return `${payload}.${sig}`;
}

export async function verifyAdminSessionToken(token: string | undefined | null): Promise<AdminPanelSession | null> {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const valid = await hmacVerify(payload, sig, getSecret());
  if (!valid) return null;
  try {
    const json = new TextDecoder().decode(fromBase64Url(payload));
    const data = JSON.parse(json) as { u?: string; exp?: number };
    if (!data.u || !data.exp || data.exp < Date.now()) return null;
    return { username: data.u, exp: data.exp };
  } catch {
    return null;
  }
}

export async function getAdminPanelSession(): Promise<AdminPanelSession | null> {
  const jar = await cookies();
  return verifyAdminSessionToken(jar.get(ADMIN_SESSION_COOKIE)?.value);
}

export function adminSessionCookieOptions(token: string) {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export function clearAdminSessionCookieOptions() {
  return {
    name: ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  };
}

export function credentialsMatch(username: string, password: string): boolean {
  const expected = getAdminPanelCredentials();
  return username.trim() === expected.username && password === expected.password;
}
