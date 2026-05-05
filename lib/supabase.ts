import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// In-memory fallback for environments where SecureStore is unavailable (Expo Go on Android).
const memory = new Map<string, string>();

const CHUNK_SIZE = 1800;

async function secureGet(key: string): Promise<string | null> {
  const chunkCount = await SecureStore.getItemAsync(`${key}_n`);
  if (!chunkCount) return SecureStore.getItemAsync(key);
  const chunks: string[] = [];
  for (let i = 0; i < parseInt(chunkCount, 10); i++) {
    const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
    if (chunk === null) return null;
    chunks.push(chunk);
  }
  return chunks.join('');
}

async function secureSet(key: string, value: string): Promise<void> {
  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }
  await SecureStore.setItemAsync(`${key}_n`, String(chunks.length));
  await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(`${key}_${i}`, c)));
}

async function secureRemove(key: string): Promise<void> {
  const chunkCount = await SecureStore.getItemAsync(`${key}_n`);
  if (chunkCount) {
    const n = parseInt(chunkCount, 10);
    await Promise.all([
      SecureStore.deleteItemAsync(`${key}_n`),
      ...Array.from({ length: n }, (_, i) => SecureStore.deleteItemAsync(`${key}_${i}`)),
    ]);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

const StorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const val = await secureGet(key);
      if (val !== null) memory.set(key, val);
      return val;
    } catch {
      return memory.get(key) ?? null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    memory.set(key, value);
    try { await secureSet(key, value); } catch { /* fallback to memory only */ }
  },
  removeItem: async (key: string): Promise<void> => {
    memory.delete(key);
    try { await secureRemove(key); } catch { /* fallback to memory only */ }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: StorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Pause token refresh when backgrounded to prevent "tick failed" on Android.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
