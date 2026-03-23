import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

// ─── Dashboard Stats ───
export interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  totalRestaurants: number;
  totalDishes: number;
  totalLikes: number;
  totalComments: number;
  totalFollows: number;
  verifiedRestaurants: number;
  activeUsers7d: number;
  postsToday: number;
}

export async function fetchDashboardStats(): Promise<{ data: DashboardStats; error: string | null }> {
  try {
    const [
      usersRes,
      postsRes,
      restaurantsRes,
      dishesRes,
      likesRes,
      commentsRes,
      followsRes,
      verifiedRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('restaurants').select('*', { count: 'exact', head: true }),
      supabase.from('dishes').select('*', { count: 'exact', head: true }),
      supabase.from('post_likes').select('*', { count: 'exact', head: true }),
      supabase.from('post_comments').select('*', { count: 'exact', head: true }),
      supabase.from('follows').select('*', { count: 'exact', head: true }),
      supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('is_verified', true),
    ]);

    // Posts today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const postsTodayRes = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    // Active users last 7 days (users who posted)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeRes = await supabase
      .from('posts')
      .select('user_id')
      .gte('created_at', sevenDaysAgo.toISOString());

    const uniqueActive = new Set((activeRes.data || []).map((p: any) => p.user_id));

    return {
      data: {
        totalUsers: usersRes.count || 0,
        totalPosts: postsRes.count || 0,
        totalRestaurants: restaurantsRes.count || 0,
        totalDishes: dishesRes.count || 0,
        totalLikes: likesRes.count || 0,
        totalComments: commentsRes.count || 0,
        totalFollows: followsRes.count || 0,
        verifiedRestaurants: verifiedRes.count || 0,
        activeUsers7d: uniqueActive.size,
        postsToday: postsTodayRes.count || 0,
      },
      error: null,
    };
  } catch (e: any) {
    return {
      data: {
        totalUsers: 0, totalPosts: 0, totalRestaurants: 0, totalDishes: 0,
        totalLikes: 0, totalComments: 0, totalFollows: 0, verifiedRestaurants: 0,
        activeUsers7d: 0, postsToday: 0,
      },
      error: e?.message || 'Failed to fetch stats',
    };
  }
}

// ─── Recent Posts ───
export interface RecentPost {
  id: string;
  dish_name: string;
  caption: string | null;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
}

export async function fetchRecentPosts(limit: number = 10): Promise<{ data: RecentPost[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, dish_name, caption, image_url, likes_count, comments_count, created_at, user_id, profiles!posts_user_id_fkey(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data: (data as any) || [], error: error?.message || null };
  } catch (e: any) {
    return { data: [], error: e?.message || 'Failed to fetch posts' };
  }
}

// ─── Users List ───
export interface AdminUser {
  user_id: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

export async function fetchUsers(limit: number = 20): Promise<{ data: AdminUser[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, role, avatar_url, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data: (data as any) || [], error: error?.message || null };
  } catch (e: any) {
    return { data: [], error: e?.message || 'Failed to fetch users' };
  }
}

// ─── Recent Ops Actions ───
export interface OpsAction {
  id: string;
  action_type: string;
  target_table: string | null;
  target_id: string | null;
  meta: any;
  created_at: string;
  actor: { full_name: string | null } | null;
}

export async function fetchRecentOpsActions(limit: number = 15): Promise<{ data: OpsAction[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('ops_actions')
      .select('id, action_type, target_table, target_id, meta, created_at, actor:profiles!ops_actions_actor_user_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data: (data as any) || [], error: error?.message || null };
  } catch (e: any) {
    return { data: [], error: e?.message || 'Failed to fetch ops actions' };
  }
}
