import { getSupabase } from './supabase-client';

/** Call a Supabase Edge Function with auth headers attached automatically. */
export async function invokeFn<T = unknown>(name: string, body?: Record<string, unknown>): Promise<T> {
  const sb = getSupabase();
  if (!sb) throw new Error('Backend not connected');
  const { data, error } = await sb.functions.invoke(name, { body });
  if (error) throw error;
  return data as T;
}
