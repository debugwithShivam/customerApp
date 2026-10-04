import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Public API origin fallback: EAS remote builds do not receive a developer's
// untracked .env.local file. EXPO_PUBLIC_API_BASE_URL still overrides this.
const FALLBACK_BASE_URL = 'https://aimedixmeds.com';
const environmentBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
// Older preview builds carried a temporary Hostinger URL. Do not let a stale
// EAS Preview variable send the released customer app back to that backend.
const CONFIGURED_BASE_URL = !environmentBaseUrl || environmentBaseUrl.includes('lightgoldenrodyellow-okapi-349601.hostingersite.com')
  ? FALLBACK_BASE_URL
  : environmentBaseUrl;
// Android emulators run in a separate network namespace; 10.0.2.2 maps to the host PC.
const BASE_URL = Platform.OS === 'android'
  ? CONFIGURED_BASE_URL.replace(/^(https?:\/\/)localhost(?=:\d|$)/i, (_match: string, scheme: string) => `${scheme}10.0.2.2`)
  : CONFIGURED_BASE_URL;
const API_PREFIX = '/api/v1/medical';
const TOKEN_KEY = 'aimedix_customer_token';
const GUEST_CREDENTIAL_KEY = 'aimedix_guest_credential';
const CUSTOMER_AREA_KEY = 'aimedix_customer_area';

async function read(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function write(key: string, value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return;
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
    return;
  }
  if (value) await SecureStore.setItemAsync(key, value);
  else await SecureStore.deleteItemAsync(key);
}

export class ApiError extends Error {
  constructor(message: string, public readonly status = 0) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function api<T = any>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  if (!BASE_URL) throw new ApiError('Backend URL is not set yet. Add EXPO_PUBLIC_API_BASE_URL when you are ready to connect the live site.');
  const token = await read(TOKEN_KEY);
  const guest = token ? null : await read(GUEST_CREDENTIAL_KEY);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (guest) headers['X-Guest-Credential'] = guest;

  let response: Response;
  try {
    const url = path.startsWith('/api/v1/') ? `${BASE_URL}${path}` : `${BASE_URL}${API_PREFIX}${path}`;
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError('Could not reach the Amedix backend. Check the network and API URL.');
  }
  const payload = await response.json().catch(() => ({}));
  if (payload?.guest_credential) await write(GUEST_CREDENTIAL_KEY, payload.guest_credential);
  if (response.status === 401 && token) await write(TOKEN_KEY, null);
  if (!response.ok) throw new ApiError(payload?.message || `The server returned ${response.status}.`, response.status);
  return payload as T;
}

export async function fetchDocument(path: string): Promise<{ data: ArrayBuffer; fileName: string; mimeType: string }> {
  if (!BASE_URL) throw new ApiError('Backend URL is not set yet. Add EXPO_PUBLIC_API_BASE_URL when you are ready to connect the live site.');
  const token = await read(TOKEN_KEY);
  const guest = token ? null : await read(GUEST_CREDENTIAL_KEY);
  const headers: Record<string, string> = { Accept: '*/*' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (guest) headers['X-Guest-Credential'] = guest;
  const url = path.startsWith('/api/v1/') ? `${BASE_URL}${path}` : `${BASE_URL}${API_PREFIX}${path}`;
  let response: Response;
  try {
    response = await fetch(url, { headers });
  } catch {
    throw new ApiError('Could not reach the Amedix backend. Check the network and API URL.');
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiError(payload?.message || `The server returned ${response.status}.`, response.status);
  }
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return { data: await response.arrayBuffer(), fileName: match?.[1] ?? 'amedix-document', mimeType: response.headers.get('Content-Type') ?? 'application/octet-stream' };
}

export async function saveLoginToken(token: string): Promise<void> {
  await write(TOKEN_KEY, token);
}

export async function readCustomerArea<T = any>(): Promise<T | null> {
  const value = await read(CUSTOMER_AREA_KEY);
  if (!value) return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

export async function saveCustomerArea(value: unknown): Promise<void> {
  await write(CUSTOMER_AREA_KEY, JSON.stringify(value));
}

export async function clearLoginToken(): Promise<void> {
  await write(TOKEN_KEY, null);
}

export async function hasLoginToken(): Promise<boolean> {
  return Boolean(await read(TOKEN_KEY));
}

export function hasBackendUrl(): boolean {
  return BASE_URL.length > 0;
}

export function backendUrl(): string {
  return BASE_URL;
}
