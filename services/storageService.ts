import { getSupabaseClient } from '@/template';
import { Platform } from 'react-native';
import { decode } from 'base64-arraybuffer';

const supabase = getSupabaseClient();

/**
 * Upload a thumbnail version of an image (low quality, small size)
 * Returns the public URL of the thumbnail
 */
export async function uploadThumbnail(
  bucket: 'post-images' | 'avatars',
  uri: string,
  userId: string,
): Promise<{ url: string | null; error: string | null }> {
  try {
    const ext = 'jpg';
    const fileName = `${userId}/thumb_${Date.now()}.${ext}`;
    const contentType = 'image/jpeg';

    if (Platform.OS === 'web') {
      // On web, create a low-quality canvas thumbnail
      const thumbBlob = await createWebThumbnail(uri, 200, 0.3);
      if (!thumbBlob) return { url: null, error: 'Failed to create thumbnail' };
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, thumbBlob, { contentType, upsert: true });
      if (uploadError) return { url: null, error: uploadError.message };
    } else {
      // On mobile, use ImageManipulator to resize + compress
      const thumbUri = await createMobileThumbnail(uri, 200, 0.3);
      if (!thumbUri) return { url: null, error: 'Failed to create thumbnail' };
      const base64 = await fileToBase64(thumbUri);
      if (!base64) return { url: null, error: 'Failed to read thumbnail file' };
      const arrayBuffer = decode(base64);
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, arrayBuffer, { contentType, upsert: true });
      if (uploadError) return { url: null, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return { url: urlData.publicUrl, error: null };
  } catch (e: any) {
    return { url: null, error: e?.message || 'Thumbnail upload failed' };
  }
}

async function createMobileThumbnail(
  uri: string,
  maxSize: number,
  compress: number,
): Promise<string | null> {
  try {
    const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: maxSize } }],
      { compress, format: SaveFormat.JPEG },
    );
    return result.uri;
  } catch {
    return null;
  }
}

async function createWebThumbnail(
  uri: string,
  maxSize: number,
  quality: number,
): Promise<Blob | null> {
  try {
    return await new Promise<Blob | null>((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const scale = maxSize / Math.max(img.width, img.height);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
      };
      img.onerror = () => resolve(null);
      img.src = uri;
    });
  } catch {
    return null;
  }
}

export async function uploadImage(
  bucket: 'post-images' | 'avatars',
  uri: string,
  userId: string,
): Promise<{ url: string | null; error: string | null }> {
  try {
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${ext}`;
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, { contentType, upsert: true });
      if (uploadError) return { url: null, error: uploadError.message };
    } else {
      // Mobile: convert file:// URI to base64 then arraybuffer
      const base64 = await fileToBase64(uri);
      if (!base64) return { url: null, error: 'Failed to read image file' };
      const arrayBuffer = decode(base64);
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, arrayBuffer, { contentType, upsert: true });
      if (uploadError) return { url: null, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return { url: urlData.publicUrl, error: null };
  } catch (e: any) {
    return { url: null, error: e?.message || 'Upload failed' };
  }
}

async function fileToBase64(uri: string): Promise<string | null> {
  try {
    const { readAsStringAsync, EncodingType } = await import('expo-file-system');
    const result = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
    return result;
  } catch {
    return null;
  }
}
