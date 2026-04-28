import { getSupabaseClient } from '@/template';

// ── Types ──
export interface Booking {
  id: string;
  userId: string;
  cookId: string;
  cookName: string;
  cookPhoto: string;
  cookSpeciality: string;
  plan: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  totalAmount: number;
  perMealRate: number;
  mealsPerDay: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  bookingRef: string;
  createdAt: string;
  updatedAt: string;
}

function generateRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'FG-';
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

function mapRow(row: any): Booking {
  return {
    id: row.id,
    userId: row.user_id,
    cookId: row.cook_id,
    cookName: row.cook_name,
    cookPhoto: row.cook_photo_url || '',
    cookSpeciality: row.cook_speciality || '',
    plan: row.plan,
    startDate: row.start_date,
    endDate: row.end_date,
    totalAmount: row.total_amount,
    perMealRate: row.per_meal_rate || 0,
    mealsPerDay: row.meals_per_day || 3,
    status: row.status,
    notes: row.notes || '',
    bookingRef: row.booking_ref,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createBooking(params: {
  userId: string;
  cookId: string;
  cookName: string;
  cookPhoto: string;
  cookSpeciality: string;
  plan: 'daily' | 'weekly' | 'monthly';
  totalAmount: number;
  perMealRate: number;
  notes?: string;
}): Promise<{ data: Booking | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];

    let endDate: string;
    if (params.plan === 'daily') {
      endDate = startDate;
    } else if (params.plan === 'weekly') {
      const end = new Date(today);
      end.setDate(end.getDate() + 6);
      endDate = end.toISOString().split('T')[0];
    } else {
      const end = new Date(today);
      end.setDate(end.getDate() + 29);
      endDate = end.toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('cook_bookings')
      .insert({
        user_id: params.userId,
        cook_id: params.cookId,
        cook_name: params.cookName,
        cook_photo_url: params.cookPhoto,
        cook_speciality: params.cookSpeciality,
        plan: params.plan,
        start_date: startDate,
        end_date: endDate,
        total_amount: params.totalAmount,
        per_meal_rate: params.perMealRate,
        meals_per_day: 3,
        status: 'pending',
        notes: params.notes || '',
        booking_ref: generateRef(),
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: mapRow(data), error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to create booking' };
  }
}

export async function fetchUserBookings(userId: string): Promise<{ data: Booking[]; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('cook_bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: (data || []).map(mapRow), error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to fetch bookings' };
  }
}

export async function updateBookingStatus(
  bookingId: string,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
): Promise<{ error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('cook_bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || 'Failed to update booking' };
  }
}
