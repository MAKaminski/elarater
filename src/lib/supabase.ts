/**
 * The typed Supabase client. NO COMPONENT IMPORTS THIS — only lib/api/* does
 * (docs/02-architecture.md, "Middleware" rules).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { Database } from './database.types';

/**
 * The Supabase CLI's local stack always listens here with the same fixed publishable
 * key. It is not a secret — it authenticates nothing but 127.0.0.1 — so defaulting to
 * it in development means a fresh clone runs against `supabase start` with no env file
 * to create, and makes it impossible to accidentally point a dev client at prod
 * (docs/02-architecture.md).
 */
const LOCAL_STACK = {
  url: 'http://127.0.0.1:54321',
  key: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
};

/**
 * SecureStore caps a value at 2048 bytes and a Supabase session can exceed that, so
 * sessions are chunked across keys. Keeping tokens in the keychain rather than
 * AsyncStorage is the point — it is the whole reason expo-secure-store is a dep.
 */
const CHUNK = 1800;

const secureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const count = await SecureStore.getItemAsync(`${key}.n`);
    if (!count) return SecureStore.getItemAsync(key);
    const parts = await Promise.all(
      Array.from({ length: Number(count) }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`)),
    );
    return parts.some((p) => p === null) ? null : parts.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    await this.removeItem(key);
    if (value.length <= CHUNK) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const chunks = value.match(new RegExp(`.{1,${CHUNK}}`, 'g')) ?? [];
    await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(`${key}.${i}`, c)));
    await SecureStore.setItemAsync(`${key}.n`, String(chunks.length));
  },
  async removeItem(key: string): Promise<void> {
    const count = await SecureStore.getItemAsync(`${key}.n`);
    if (count) {
      await Promise.all(
        Array.from({ length: Number(count) }, (_, i) => SecureStore.deleteItemAsync(`${key}.${i}`)),
      );
      await SecureStore.deleteItemAsync(`${key}.n`);
    }
    await SecureStore.deleteItemAsync(key);
  },
};

/** Server rendering has no persistent session; the browser keeps its own. */
const storage =
  Platform.OS === 'web'
    ? typeof window === 'undefined'
      ? undefined
      : AsyncStorage
    : secureStoreAdapter;

let client: SupabaseClient<Database> | null = null;

/**
 * Lazy, because `expo export` evaluates every module while prerendering and the
 * production configuration is not present at build time.
 *
 * A plain module-level `let` rather than a Proxy: auth libraries inspect the client
 * object, and a Proxy breaks those checks in ways that surface as hangs rather than
 * errors.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (client) return client;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? (__DEV__ ? LOCAL_STACK.url : undefined);
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? (__DEV__ ? LOCAL_STACK.key : undefined);

  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. In production these come from the Vercel project ' +
        'environment, injected by the Supabase Marketplace integration; see env.example.',
    );
  }

  client = createClient<Database>(url, key, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: typeof window !== 'undefined' || Platform.OS !== 'web',
      // Magic links and OAuth land in the URL on web; native handles them via linking.
      detectSessionInUrl: Platform.OS === 'web',
    },
  });

  return client;
}

export type { Database };
