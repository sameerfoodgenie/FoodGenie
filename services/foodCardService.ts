import { getSupabaseClient } from '@/template';

export type EmotionType = 'craving' | 'must_try' | 'loved';

export interface FoodCardDB {
  id: string;
  dish_name: string;
  creator_handle: string;
  creator_avatar_url: string | null;
  image_url: string;
  video_url: string | null;
  description: string | null;
  recipe_steps: string[];
  cook_time: string | null;
  difficulty: string;
  category: string;
  price: string | null;
  restaurant_name: string | null;
  tags: string[];
  craving_count: number;
  must_try_count: number;
  loved_count: number;
  is_active: boolean;
  created_at: string;
}

export interface UserEmotion {
  card_id: string;
  emotion_type: EmotionType;
}

export async function fetchFoodCards(options?: {
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: FoodCardDB[]; error: string | null }> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('food_cards')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (options?.category) query = query.eq('category', options.category);
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  return { data: (data || []) as FoodCardDB[], error: error?.message || null };
}

export async function fetchUserEmotions(
  userId: string,
): Promise<{ data: UserEmotion[]; error: string | null }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('food_card_emotions')
    .select('card_id, emotion_type')
    .eq('user_id', userId);
  return { data: (data || []) as UserEmotion[], error: error?.message || null };
}

export async function toggleEmotion(
  cardId: string,
  userId: string,
  emotionType: EmotionType,
): Promise<{ data: any; error: string | null }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('toggle_food_card_emotion', {
    p_card_id: cardId,
    p_user_id: userId,
    p_emotion_type: emotionType,
  });
  return { data, error: error?.message || null };
}

export async function fetchSingleCard(
  cardId: string,
): Promise<{ data: FoodCardDB | null; error: string | null }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('food_cards')
    .select('*')
    .eq('id', cardId)
    .single();
  return { data: data as FoodCardDB | null, error: error?.message || null };
}
