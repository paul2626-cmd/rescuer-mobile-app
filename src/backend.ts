import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
let client: SupabaseClient | null = null;

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
    });
  }
  return client;
}

export function getApiBaseUrl() {
  return apiBaseUrl;
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

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new Error('We could not reach the server. Check your connection and try again.');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    const message = payload?.error?.message ?? (
      response.status >= 500
        ? 'The server is temporarily unavailable. Please try again in a moment.'
        : `Request failed (${response.status})`
    );
    throw new ApiError(message, response.status, payload?.error?.code);
  }
  return (payload?.data ?? payload) as T;
}

export function unwrapItems(data: any): any[] {
  return Array.isArray(data?.items) ? data.items : [];
}
