import { File } from 'expo-file-system';
import { supabase } from './supabase';
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
};

export function getFileExtension(filename?: string | null, fallback = 'pdf'): string {
  const trimmed = filename?.trim();
  const parts = trimmed?.split('.');
  const ext = parts && parts.length > 1 ? parts.pop() : null;
  return ext?.toLowerCase() || fallback;
}

export function getMimeType(filename?: string | null, mimeType?: string | null, fallback = 'application/octet-stream'): string {
  if (mimeType) return mimeType;
  return MIME_BY_EXTENSION[getFileExtension(filename, '')] ?? fallback;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Upload from a base64 string (returned directly by expo-image-picker with base64:true).
 * Bucket must exist in Supabase Storage and allow authenticated uploads.
 */
export async function uploadFileFromBase64(
  bucket: string,
  storagePath: string,
  base64: string,
  contentType: string,
): Promise<string> {
  const arrayBuffer = base64ToArrayBuffer(base64);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, arrayBuffer, { contentType, upsert: true });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Upload from a local file URI (expo-document-picker / expo-image-picker).
 * Uses the modern Expo File API to read bytes and uploads the ArrayBuffer to Supabase.
 */
export async function uploadFileFromUri(
  bucket: string,
  storagePath: string,
  uri: string,
  contentType: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  onProgress?.(15);
  const file = new File(uri);
  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(65);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, arrayBuffer, { contentType, upsert: true });

  if (error) throw new Error(error.message);
  onProgress?.(100);

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}
