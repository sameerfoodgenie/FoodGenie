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

export interface CookAvailability {
  status: 'available' | 'partial' | 'busy';
  nextAvailableDate: string | null; // ISO date string
  bookedDaysNext7: number;
}

export async function fetchCookAvailability(cookIds: string[]): Promise<{ data: Record<string, CookAvailability>; error: string | null }> {
  try {
    if (cookIds.length === 0) return { data: {}, error: null };
    const supabase = getSupabaseClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const next7 = new Date(today);
    next7.setDate(next7.getDate() + 6);
    const next7Str = next7.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('cook_bookings')
      .select('cook_id, start_date, end_date, status')
      .in('cook_id', cookIds)
      .in('status', ['pending', 'confirmed'])
      .gte('end_date', todayStr)
      .order('start_date', { ascending: true });

    if (error) return { data: {}, error: error.message };

    const result: Record<string, CookAvailability> = {};

    for (const cookId of cookIds) {
      const bookings = (data || []).filter(b => b.cook_id === cookId);

      if (bookings.length === 0) {
        result[cookId] = { status: 'available', nextAvailableDate: null, bookedDaysNext7: 0 };
        continue;
      }

      // Calculate booked days in next 7 days
      const bookedDays = new Set<string>();
      for (const b of bookings) {
        const bStart = new Date(b.start_date + 'T00:00:00');
        const bEnd = new Date(b.end_date + 'T00:00:00');
        for (let d = new Date(Math.max(bStart.getTime(), today.getTime())); d <= bEnd && d <= next7; d.setDate(d.getDate() + 1)) {
          bookedDays.add(d.toISOString().split('T')[0]);
        }
      }

      const bookedCount = bookedDays.size;

      // Find next available date (first day not booked starting from today)
      let nextAvail: string | null = null;
      if (bookedCount > 0) {
        const allBookedDays = new Set<string>();
        for (const b of bookings) {
          const bStart = new Date(b.start_date + 'T00:00:00');
          const bEnd = new Date(b.end_date + 'T00:00:00');
          for (let d = new Date(bStart); d <= bEnd; d.setDate(d.getDate() + 1)) {
            allBookedDays.add(d.toISOString().split('T')[0]);
          }
        }
        // Find the first unbooked day starting from today
        for (let i = 0; i < 60; i++) {
          const check = new Date(today);
          check.setDate(check.getDate() + i);
          const checkStr = check.toISOString().split('T')[0];
          if (!allBookedDays.has(checkStr)) {
            nextAvail = checkStr;
            break;
          }
        }
      }

      if (bookedCount >= 7) {
        result[cookId] = { status: 'busy', nextAvailableDate: nextAvail, bookedDaysNext7: bookedCount };
      } else if (bookedCount >= 3) {
        result[cookId] = { status: 'partial', nextAvailableDate: nextAvail, bookedDaysNext7: bookedCount };
      } else {
        result[cookId] = { status: 'available', nextAvailableDate: nextAvail, bookedDaysNext7: bookedCount };
      }
    }

    return { data: result, error: null };
  } catch (err: any) {
    return { data: {}, error: err.message || 'Failed to fetch availability' };
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
