import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

export interface DBPost {
  id: string;
  user_id: string;
  image_url: string | null;
  dish_name: string;
  caption: string;
  location: string;
  meal_type: string;
  source: string;
  restaurant_name: string | null;
  platform: string | null;
  tags: string[];
  tagged_friends: string[];
  likes_count: number;
  comments_count: number;
  creator_type: string | null;
  is_verified: boolean;
  show_name: string | null;
  show_id: string | null;
  thumbnail_url: string | null;
  created_at: string;
  // Joined
  user_profiles?: { username: string; email: string };
  profiles?: { full_name: string; avatar_url: string | null; bio: string };
  is_liked?: boolean;
  is_saved?: boolean;
}

export async function fetchFeedPosts(userId?: string): Promise<{ data: DBPost[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user_profiles!posts_user_id_fkey(username, email)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return { data: [], error: error.message };

    // If user is logged in, check likes and saves
    if (userId && data) {
      const postIds = data.map((p: any) => p.id);

      const [likesRes, savesRes] = await Promise.all([
        supabase.from('post_likes').select('post_id').eq('user_id', userId).in('post_id', postIds),
        supabase.from('post_saves').select('post_id').eq('user_id', userId).in('post_id', postIds),
      ]);

      const likedSet = new Set((likesRes.data || []).map((l: any) => l.post_id));
      const savedSet = new Set((savesRes.data || []).map((s: any) => s.post_id));

      return {
        data: data.map((p: any) => ({ ...p, is_liked: likedSet.has(p.id), is_saved: savedSet.has(p.id) })),
        error: null,
      };
    }

    return { data: data || [], error: null };
  } catch (e: any) {
    return { data: [], error: e?.message || 'Failed to fetch posts' };
  }
}

export async function createPost(post: {
  user_id: string;
  image_url?: string | null;
  dish_name: string;
  caption?: string;
  location?: string;
  meal_type?: string;
  source?: string;
  restaurant_name?: string;
  platform?: string;
  tags?: string[];
  tagged_friends?: string[];
  creator_type?: string | null;
  is_verified?: boolean;
  show_name?: string;
  show_id?: string;
  thumbnail_url?: string | null;
}): Promise<{ data: DBPost | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select(`
        *,
        user_profiles!posts_user_id_fkey(username, email)
      `)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: { ...data, is_liked: false, is_saved: false }, error: null };
  } catch (e: any) {
    return { data: null, error: e?.message || 'Failed to create post' };
  }
}

export async function togglePostLike(postId: string, userId: string, isLiked: boolean): Promise<{ error: string | null }> {
  try {
    if (isLiked) {
      // Unlike
      const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
      if (!error) {
        await supabase.rpc('decrement_likes', { post_id_input: postId }).catch(() => {
          // Fallback: manual update
          supabase.from('posts').select('likes_count').eq('id', postId).single().then(({ data }) => {
            if (data) supabase.from('posts').update({ likes_count: Math.max(0, (data.likes_count || 0) - 1) }).eq('id', postId);
          });
        });
      }
      return { error: error?.message || null };
    } else {
      // Like
      const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
      if (!error) {
        await supabase.rpc('increment_likes', { post_id_input: postId }).catch(() => {
          supabase.from('posts').select('likes_count').eq('id', postId).single().then(({ data }) => {
            if (data) supabase.from('posts').update({ likes_count: (data.likes_count || 0) + 1 }).eq('id', postId);
          });
        });
      }
      return { error: error?.message || null };
    }
  } catch (e: any) {
    return { error: e?.message || 'Failed to toggle like' };
  }
}

export async function togglePostSave(postId: string, userId: string, isSaved: boolean): Promise<{ error: string | null }> {
  try {
    if (isSaved) {
      const { error } = await supabase.from('post_saves').delete().eq('post_id', postId).eq('user_id', userId);
      return { error: error?.message || null };
    } else {
      const { error } = await supabase.from('post_saves').insert({ post_id: postId, user_id: userId });
      return { error: error?.message || null };
    }
  } catch (e: any) {
    return { error: e?.message || 'Failed to toggle save' };
  }
}

export async function addPostComment(postId: string, userId: string, text: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: userId, text });
    if (!error) {
      // Increment comments count
      const { data } = await supabase.from('posts').select('comments_count').eq('id', postId).single();
      if (data) {
        await supabase.from('posts').update({ comments_count: (data.comments_count || 0) + 1 }).eq('id', postId);
      }
    }
    return { error: error?.message || null };
  } catch (e: any) {
    return { error: e?.message || 'Failed to add comment' };
  }
}

export async function fetchPostComments(postId: string): Promise<{ data: any[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .select('*, user_profiles!post_comments_user_id_fkey(username)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    return { data: data || [], error: error?.message || null };
  } catch (e: any) {
    return { data: [], error: e?.message || 'Failed to fetch comments' };
  }
}

// Follow system
export async function fetchFollowing(userId: string): Promise<{ data: string[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);
    return { data: (data || []).map((f: any) => f.following_id), error: error?.message || null };
  } catch (e: any) {
    return { data: [], error: e?.message || 'Failed to fetch following' };
  }
}

export async function fetchFollowerCount(userId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);
    return count || 0;
  } catch {
    return 0;
  }
}

export async function toggleFollow(followerId: string, followingId: string, isFollowing: boolean): Promise<{ error: string | null }> {
  try {
    if (isFollowing) {
      const { error } = await supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId);
      return { error: error?.message || null };
    } else {
      const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
      return { error: error?.message || null };
    }
  } catch (e: any) {
    return { error: e?.message || 'Failed to toggle follow' };
  }
}
