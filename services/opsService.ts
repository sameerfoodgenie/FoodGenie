import { getSupabaseClient } from '@/template';

function getClient() {
  return getSupabaseClient();
}

// ─── Role Check ───
export async function getUserRole(userId: string): Promise<string | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return data.role;
}

// ─── Restaurants ───
export interface RestaurantRow {
  id: string;
  name: string;
  area: string | null;
  city: string;
  cuisines: string[];
  veg_type: string;
  price_band: string;
  is_verified: boolean;
  reliability_tier: string;
  google_rating: number | null;
  is_active: boolean;
  created_at: string;
}

export interface RestaurantInsert {
  name: string;
  area?: string;
  city?: string;
  cuisines?: string[];
  veg_type?: string;
  price_band?: string;
  is_verified?: boolean;
  reliability_tier?: string;
  google_rating?: number | null;
  is_active?: boolean;
}

export async function createRestaurant(
  data: RestaurantInsert,
): Promise<{ data: RestaurantRow | null; error: string | null }> {
  const supabase = getClient();
  const { data: row, error } = await supabase
    .from('restaurants')
    .insert(data)
    .select()
    .single();
  return { data: row, error: error?.message || null };
}

export async function updateRestaurant(
  id: string,
  data: Partial<RestaurantInsert>,
): Promise<{ error: string | null }> {
  const supabase = getClient();
  const { error } = await supabase.from('restaurants').update(data).eq('id', id);
  return { error: error?.message || null };
}

export async function fetchRestaurants(filters?: {
  search?: string;
  area?: string;
  reliability_tier?: string;
  is_verified?: boolean;
}): Promise<{ data: RestaurantRow[]; error: string | null }> {
  const supabase = getClient();
  let query = supabase.from('restaurants').select('*').order('created_at', { ascending: false });

  if (filters?.area) query = query.eq('area', filters.area);
  if (filters?.reliability_tier) query = query.eq('reliability_tier', filters.reliability_tier);
  if (filters?.is_verified !== undefined) query = query.eq('is_verified', filters.is_verified);
  if (filters?.search) query = query.ilike('name', `%${filters.search}%`);

  const { data, error } = await query;
  return { data: data || [], error: error?.message || null };
}

export async function fetchRestaurantById(
  id: string,
): Promise<{ data: RestaurantRow | null; error: string | null }> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error: error?.message || null };
}

// ─── Dishes ───
export interface DishRow {
  id: string;
  restaurant_id: string;
  name: string;
  category: string | null;
  is_veg: boolean;
  price_est: number;
  spice_level: string;
  is_active: boolean;
  created_at: string;
}

export interface DishInsert {
  restaurant_id: string;
  name: string;
  category?: string;
  is_veg?: boolean;
  price_est?: number;
  spice_level?: string;
  is_active?: boolean;
}

export async function createDish(
  data: DishInsert,
): Promise<{ data: DishRow | null; error: string | null }> {
  const supabase = getClient();
  const { data: row, error } = await supabase
    .from('dishes')
    .insert(data)
    .select()
    .single();
  return { data: row, error: error?.message || null };
}

export async function fetchDishesForRestaurant(
  restaurantId: string,
): Promise<{ data: DishRow[]; error: string | null }> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('dishes')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name');
  return { data: data || [], error: error?.message || null };
}

// ─── Dish Tags ───
export interface DishTagRow {
  id: string;
  dish_id: string;
  tag: string;
  created_at: string;
}

export async function createDishTags(
  dishId: string,
  tags: string[],
): Promise<{ inserted: number; error: string | null }> {
  const supabase = getClient();
  const rows = tags.map((tag) => ({ dish_id: dishId, tag: tag.toLowerCase().trim() }));
  const { data, error } = await supabase
    .from('dish_tags')
    .upsert(rows, { onConflict: 'dish_id,tag', ignoreDuplicates: true })
    .select();
  return { inserted: data?.length || 0, error: error?.message || null };
}

export async function fetchTagsForDish(
  dishId: string,
): Promise<{ data: DishTagRow[]; error: string | null }> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('dish_tags')
    .select('*')
    .eq('dish_id', dishId)
    .order('tag');
  return { data: data || [], error: error?.message || null };
}

// ─── Ops Actions Log ───
export async function logOpsAction(
  actorUserId: string,
  actionType: string,
  targetTable: string,
  targetId: string | null,
  meta?: Record<string, unknown>,
): Promise<void> {
  const supabase = getClient();
  await supabase.from('ops_actions').insert({
    actor_user_id: actorUserId,
    action_type: actionType,
    target_table: targetTable,
    target_id: targetId,
    meta: meta || {},
  });
}
