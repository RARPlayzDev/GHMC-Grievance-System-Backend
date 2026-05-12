// ═══════════════════════════════════════════════════════════════════
// Storage — Supabase Storage provider (implements StorageProvider)
// Swap to S3 in production by changing STORAGE_PROVIDER env var
// ═══════════════════════════════════════════════════════════════════

import { supabaseAdmin } from '../db/supabase-client';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

export interface StorageProvider {
  uploadPhoto(buffer: Buffer, mimeType: string): Promise<string>;
  generateSignedUrl(internalPath: string, expirySeconds: number): Promise<string>;
  deletePhoto(internalPath: string): Promise<void>;
}

class SupabaseStorageProvider implements StorageProvider {
  private bucket = config.supabase.storageBucket;

  async uploadPhoto(buffer: Buffer, mimeType: string): Promise<string> {
    const ext = mimeType === 'image/webp' ? 'webp' : mimeType === 'image/png' ? 'png' : 'jpg';
    const path = `complaints/${new Date().toISOString().slice(0, 10)}/${uuidv4()}.${ext}`;

    const { error } = await supabaseAdmin.storage.from(this.bucket).upload(path, buffer, {
      contentType: mimeType,
      upsert: false,
    });

    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    return path;
  }

  async generateSignedUrl(internalPath: string, expirySeconds: number = 86400): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
      .from(this.bucket)
      .createSignedUrl(internalPath, expirySeconds);

    if (error || !data?.signedUrl) throw new Error(`Failed to generate signed URL: ${error?.message}`);
    return data.signedUrl;
  }

  async deletePhoto(internalPath: string): Promise<void> {
    await supabaseAdmin.storage.from(this.bucket).remove([internalPath]);
  }
}

// Factory — swap implementation based on env var
export function createStorageProvider(): StorageProvider {
  // In production, add S3StorageProvider here
  return new SupabaseStorageProvider();
}

export const storage = createStorageProvider();

