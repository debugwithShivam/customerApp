import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const CONFIGURED_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
// Android emulators run in a separate network namespace; 10.0.2.2 maps to the host PC.
const BASE_URL = Platform.OS === 'android'
  ? CONFIGURED_BASE_URL.replace(/^(https?:\/\/)localhost(?=:\d|$)/i, (_match, scheme: string) => `${scheme}10.0.2.2`)
  : CONFIGURED_BASE_URL;
const API_PREFIX = '/api/v1/medical';
const TOKEN_KEY = 'aimedix_customer_token';
const GUEST_CREDENTIAL_KEY = 'aimedix_guest_credential';

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
    response = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
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

export async function saveLoginToken(token: string): Promise<void> {
  await write(TOKEN_KEY, token);
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
