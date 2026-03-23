import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

export interface UserProfile {
  user_id: string;
  full_name: string;
  bio: string;
  avatar_url: string | null;
  role: string;
}

export async function fetchProfile(userId: string): Promise<{ data: UserProfile | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No profile yet
      return { data: null, error: null };
    }
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e?.message || 'Failed to fetch profile' };
  }
}

export async function upsertProfile(profile: {
  user_id: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string | null;
}): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert(
        { ...profile, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
    return { error: error?.message || null };
  } catch (e: any) {
    return { error: e?.message || 'Failed to update profile' };
  }
}

export async function checkProfileComplete(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', userId)
      .single();
    return !!(data?.full_name && data.full_name.trim().length > 0);
  } catch {
    return false;
  }
}
