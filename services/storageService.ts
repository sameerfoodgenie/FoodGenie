import { getSupabaseClient } from '@/template';
import { Platform } from 'react-native';
import { decode } from 'base64-arraybuffer';

const supabase = getSupabaseClient();

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
