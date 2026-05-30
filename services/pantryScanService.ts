/**
 * Pantry Scan Service
 * Handles barcode scanning and image recognition for adding pantry items.
 */

import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';

export interface ScannedProduct {
  product_name: string | null;
  mrp: number | null;
  quantity: string | null;
  batch_number: string | null;
  mfg_date: string | null;
  expiry_date: string | null;
  category: string;
  brand: string | null;
}

export async function recognizeProductFromImage(
  imageBase64: string,
  scanType: 'barcode' | 'photo' = 'photo'
): Promise<{ data: ScannedProduct | null; error: string | null }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.functions.invoke('pantry-scan', {
      body: { imageBase64, scanType },
    });

    if (error) {
      let errorMessage = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const statusCode = error.context?.status ?? 500;
          const textContent = await error.context?.text();
          errorMessage = `[Code: ${statusCode}] ${textContent || error.message || 'Unknown error'}`;
        } catch {
          errorMessage = `${error.message || 'Failed to read response'}`;
        }
      }
      return { data: null, error: errorMessage };
    }

    if (data?.success && data?.product) {
      return { data: data.product, error: null };
    }

    return { data: null, error: data?.error || 'Recognition failed' };
  } catch (err: any) {
    return { data: null, error: err.message || 'Network error' };
  }
}

// Calculate expiry days from expiry date string
export function calculateExpiryDays(expiryDate: string | null): number | null {
  if (!expiryDate) return null;

  try {
    // Try parsing various date formats
    let date: Date;
    if (expiryDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      date = new Date(expiryDate);
    } else if (expiryDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = expiryDate.split('/');
      date = new Date(`${year}-${month}-${day}`);
    } else if (expiryDate.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [day, month, year] = expiryDate.split('-');
      date = new Date(`${year}-${month}-${day}`);
    } else {
      date = new Date(expiryDate);
    }

    if (isNaN(date.getTime())) return null;

    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);
    return Math.max(0, diffDays);
  } catch {
    return null;
  }
}
