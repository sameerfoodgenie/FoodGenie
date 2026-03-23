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

// ─── Analytics: Posts Per Day (7d) ───
export interface DailyPostCount {
  date: string;
  count: number;
}

export async function fetchPostsPerDay(days: number = 7): Promise<{ data: DailyPostCount[]; error: string | null }> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('posts')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) return { data: [], error: error.message };

    const countMap: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      countMap[d.toISOString().split('T')[0]] = 0;
    }
    (data || []).forEach((p: any) => {
      const day = new Date(p.created_at).toISOString().split('T')[0];
      if (countMap[day] !== undefined) countMap[day]++;
    });

    const result = Object.entries(countMap).map(([date, count]) => ({ date, count }));
    return { data: result, error: null };
  } catch (e: any) {
    return { data: [], error: e?.message || 'Failed to fetch posts per day' };
  }
}

// ─── Analytics: User Growth (7d) ───
export interface DailyUserCount {
  date: string;
  count: number;
  cumulative: number;
}

export async function fetchUserGrowth(days: number = 7): Promise<{ data: DailyUserCount[]; error: string | null }> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    // Total users before period
    const { count: beforeCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', startDate.toISOString());

    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) return { data: [], error: error.message };

    const countMap: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      countMap[d.toISOString().split('T')[0]] = 0;
    }
    (data || []).forEach((u: any) => {
      const day = new Date(u.created_at).toISOString().split('T')[0];
      if (countMap[day] !== undefined) countMap[day]++;
    });

    let cumulative = beforeCount || 0;
    const result = Object.entries(countMap).map(([date, count]) => {
      cumulative += count;
      return { date, count, cumulative };
    });
    return { data: result, error: null };
  } catch (e: any) {
    return { data: [], error: e?.message || 'Failed to fetch user growth' };
  }
}

// ─── Analytics: Engagement Trends (7d) ───
export interface DailyEngagement {
  date: string;
  likes: number;
  comments: number;
}

export async function fetchEngagementTrends(days: number = 7): Promise<{ data: DailyEngagement[]; error: string | null }> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);
    const isoStart = startDate.toISOString();

    const [likesRes, commentsRes] = await Promise.all([
      supabase.from('post_likes').select('created_at').gte('created_at', isoStart),
      supabase.from('post_comments').select('created_at').gte('created_at', isoStart),
    ]);

    const initMap = () => {
      const m: Record<string, number> = {};
      for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        m[d.toISOString().split('T')[0]] = 0;
      }
      return m;
    };

    const likesMap = initMap();
    const commentsMap = initMap();

    (likesRes.data || []).forEach((l: any) => {
      const day = new Date(l.created_at).toISOString().split('T')[0];
      if (likesMap[day] !== undefined) likesMap[day]++;
    });
    (commentsRes.data || []).forEach((c: any) => {
      const day = new Date(c.created_at).toISOString().split('T')[0];
      if (commentsMap[day] !== undefined) commentsMap[day]++;
    });

    const result = Object.keys(likesMap).map((date) => ({
      date,
      likes: likesMap[date],
      comments: commentsMap[date],
    }));
    return { data: result, error: null };
  } catch (e: any) {
    return { data: [], error: e?.message || 'Failed to fetch engagement trends' };
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
