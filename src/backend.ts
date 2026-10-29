import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
let client: SupabaseClient | null = null;
const AUTH_REQUEST_TIMEOUT_MS = 20_000;
const API_REQUEST_TIMEOUT_MS = 45_000;
const authStorageKey = supabaseUrl
  ? `sb-${supabaseUrl.replace(/^https?:\/\//, '').split('.')[0]}-auth-token`
  : 'kalinga-rescuer-auth-token';

const authFetchWithTimeout: typeof fetch = async (input, init = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();
  init.signal?.addEventListener('abort', abortFromCaller);
  if (init.signal?.aborted) controller.abort();

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener('abort', abortFromCaller);
  }
};

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('App configuration is missing. Set the Supabase URL and publishable key, then rebuild.');
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: { fetch: authFetchWithTimeout },
    });
  }
  return client;
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}

export async function clearSavedAuthSession() {
  await AsyncStorage.removeItem(authStorageKey);
}

export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function api<T = any>(
  path: string,
  method = 'GET',
  body?: unknown,
  accessToken?: string,
): Promise<T> {
  if (!apiBaseUrl) throw new Error('App configuration is missing the API base URL.');
  const token = accessToken ?? (await getSupabaseClient().auth.getSession()).data.session?.access_token;
  if (!token) throw new ApiError('Your session has ended. Please sign in again.', 401);

  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      signal: controller.signal,
    });

    let payload: any = null;
    try {
      payload = await response.json();
    } catch (error) {
      if (controller.signal.aborted) throw error;
    }
    if (!response.ok || payload?.success === false) {
      const message = payload?.error?.message ?? (
        response.status >= 500
          ? 'The server is temporarily unavailable. Please try again in a moment.'
          : `Request failed (${response.status})`
      );
      throw new ApiError(message, response.status, payload?.error?.code);
    }
    return (payload?.data ?? payload) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The rescue server took too long to respond. Wait a moment, then try again.');
    }
    throw new Error('We could not reach the server. Check your connection and try again.');
  } finally {
    clearTimeout(timeout);
  }
}

export function unwrapItems(data: any): any[] {
  return Array.isArray(data?.items) ? data.items : [];
}
