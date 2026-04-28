import { getSupabaseClient } from '@/template';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

// ── Types ──
export interface CookDish {
  name: string;
  image: string;
}

export interface CookVideoReview {
  id: string;
  customerName: string;
  customerPhoto: string;
  thumbnail: string;
  videoUrl: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CookPricing {
  perMeal: number;
  perDay: number;
  perWeek: number;
  perMonth: number;
}

export interface Cook {
  id: string;
  name: string;
  photo: string;
  rating: number;
  reviews: number;
  experience: string;
  expertise: string[];
  speciality: string;
  pricing: CookPricing;
  isAvailable: boolean;
  bio: string;
  dishes: CookDish[];
  videoReviews: CookVideoReview[];
  languages: string[];
  location: string;
}

function mapRowToCook(row: any): Cook {
  return {
    id: row.id,
    name: row.name,
    photo: row.photo_url,
    rating: parseFloat(row.rating) || 0,
    reviews: row.reviews_count || 0,
    experience: row.experience || '',
    expertise: row.expertise || [],
    speciality: row.speciality || '',
    pricing: {
      perMeal: row.pricing_per_meal || 0,
      perDay: row.pricing_per_day || 0,
      perWeek: row.pricing_per_week || 0,
      perMonth: row.pricing_per_month || 0,
    },
    isAvailable: row.is_available ?? true,
    bio: row.bio || '',
    dishes: (row.dishes || []).map((d: any) => ({
      name: d.name || '',
      image: d.image || '',
    })),
    videoReviews: (row.cook_video_reviews || []).map((r: any) => ({
      id: r.id,
      customerName: r.customer_name || '',
      customerPhoto: r.customer_photo_url || '',
      thumbnail: r.thumbnail_url || '',
      videoUrl: r.video_url || '',
      rating: r.rating || 5,
      comment: r.comment || '',
      date: r.review_date || '',
    })),
    languages: row.languages || [],
    location: row.location || '',
  };
}

export async function fetchCooks(): Promise<{ data: Cook[]; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('cooks')
      .select('*, cook_video_reviews(*)')
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (error) return { data: [], error: error.message };

    const cooks = (data || []).map(mapRowToCook);
    return { data: cooks, error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to fetch cooks' };
  }
}

export async function uploadVideoReview(params: {
  cookId: string;
  userId: string;
  customerName: string;
  customerPhotoUrl?: string;
  videoUri: string;
  rating: number;
  comment: string;
}): Promise<{ data: CookVideoReview | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const fileExt = params.videoUri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'mp4';
    const fileName = `reviews/${params.userId}/${Date.now()}.${fileExt}`;

    let uploadError: any = null;

    if (Platform.OS === 'web') {
      const response = await fetch(params.videoUri);
      const blob = await response.blob();
      const { error } = await supabase.storage
        .from('post-images')
        .upload(fileName, blob, { contentType: `video/${fileExt}`, upsert: false });
      uploadError = error;
    } else {
      const base64 = await FileSystem.readAsStringAsync(params.videoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const arrayBuffer = decode(base64);
      const { error } = await supabase.storage
        .from('post-images')
        .upload(fileName, arrayBuffer, { contentType: `video/${fileExt}`, upsert: false });
      uploadError = error;
    }

    if (uploadError) return { data: null, error: uploadError.message };

    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('cook_video_reviews')
      .insert({
        cook_id: params.cookId,
        user_id: params.userId,
        customer_name: params.customerName,
        customer_photo_url: params.customerPhotoUrl || '',
        video_url: urlData.publicUrl,
        thumbnail_url: '',
        rating: params.rating,
        comment: params.comment,
        review_date: 'Just now',
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    return {
      data: {
        id: data.id,
        customerName: data.customer_name,
        customerPhoto: data.customer_photo_url || '',
        thumbnail: data.thumbnail_url || '',
        videoUrl: data.video_url,
        rating: data.rating,
        comment: data.comment || '',
        date: data.review_date || 'Just now',
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to upload review' };
  }
}

export async function fetchCooksBySpeciality(speciality: string): Promise<{ data: Cook[]; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('cooks')
      .select('*, cook_video_reviews(*)')
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (speciality && speciality !== 'all') {
      query = query.eq('speciality', speciality);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };

    const cooks = (data || []).map(mapRowToCook);
    return { data: cooks, error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to fetch cooks' };
  }
}
