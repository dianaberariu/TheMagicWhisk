import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

const CHUNK_SIZE_BYTES = 2000;

const getByteLength = (value: string) => {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length;
  }

  return value.length;
};

const splitIntoChunks = (value: string, maxBytes: number) => {
  const chunks: string[] = [];
  let currentChunk = '';
  let currentChunkBytes = 0;

  for (const character of value) {
    const characterBytes = getByteLength(character);

    if (currentChunk && currentChunkBytes + characterBytes > maxBytes) {
      chunks.push(currentChunk);
      currentChunk = character;
      currentChunkBytes = characterBytes;
      continue;
    }

    currentChunk += character;
    currentChunkBytes += characterBytes;
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
};

class LargeSecureStore {
  getChunkCountKey(key: string) {
    return `${key}_chunkCount`;
  }

  getChunkKey(key: string, index: number) {
    return `${key}_${index}`;
  }

  async getItem(key: string) {
    const chunkCountValue = await SecureStore.getItemAsync(this.getChunkCountKey(key));

    if (chunkCountValue) {
      const chunkCount = Number.parseInt(chunkCountValue, 10);

      if (Number.isFinite(chunkCount) && chunkCount > 0) {
        const chunks = await Promise.all(
          Array.from({ length: chunkCount }, async (_, index) => {
            return SecureStore.getItemAsync(this.getChunkKey(key, index));
          })
        );

        if (chunks.every((chunk) => typeof chunk === 'string')) {
          return chunks.join('');
        }
      }
    }

    return SecureStore.getItemAsync(key);
  }

  async setItem(key: string, value: string) {
    if (getByteLength(value) <= CHUNK_SIZE_BYTES) {
      await this.removeItem(key);
      await SecureStore.setItemAsync(key, value);
      return;
    }

    const chunks = splitIntoChunks(value, CHUNK_SIZE_BYTES);

    await this.removeItem(key);

    await Promise.all(
      chunks.map((chunk, index) => {
        return SecureStore.setItemAsync(this.getChunkKey(key, index), chunk);
      })
    );

    await SecureStore.setItemAsync(this.getChunkCountKey(key), String(chunks.length));
  }

  async removeItem(key: string) {
    const chunkCountValue = await SecureStore.getItemAsync(this.getChunkCountKey(key));

    await Promise.all([
      SecureStore.deleteItemAsync(key),
      SecureStore.deleteItemAsync(this.getChunkCountKey(key)),
      ...(chunkCountValue
        ? Array.from({ length: Number.parseInt(chunkCountValue, 10) || 0 }, (_, index) => {
            return SecureStore.deleteItemAsync(this.getChunkKey(key, index));
          })
        : []),
    ]);
  }
}

class WebStorageAdapter {
  async getItem(key: string) {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  }

  async removeItem(key: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  }
}

const storageAdapter = Platform.OS === 'web' ? new WebStorageAdapter() : new LargeSecureStore();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
  },
});