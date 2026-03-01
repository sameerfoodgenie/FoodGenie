import { getSupabaseClient } from '@/template';

const supabase = getSupabaseClient();

export interface UserPreferences {
  diet: 'veg' | 'egg' | 'nonveg' | null;
  budget_min: number;
  budget_max: number;
  spice_level: number;
  mode: 'quick' | 'guided';
  onboarding_complete: boolean;
  session_count: number;
  preferred_partner_app: string | null;
  last_partner_used: string | null;
  partner_redirect_count: number;
}

export interface UserBehavior {
  ignored_best_match_count: number;
  spice_contradictions: number;
  session_count: number;
  last_spice_prompt_at: string | null;
  last_clarification_at: string | null;
  actual_spice_choices: number[];
  preferred_mode: 'quick' | 'guided';
}

// ---- Preferences ----

export async function loadPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return {
    diet: data.diet,
    budget_min: data.budget_min,
    budget_max: data.budget_max,
    spice_level: data.spice_level,
    mode: data.mode,
    onboarding_complete: data.onboarding_complete,
    session_count: data.session_count,
    preferred_partner_app: data.preferred_partner_app || null,
    last_partner_used: data.last_partner_used || null,
    partner_redirect_count: data.partner_redirect_count || 0,
  };
}

export async function savePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<{ error: string | null }> {
  const { error: upsertError } = await supabase
    .from('user_preferences')
    .upsert(
      { user_id: userId, ...prefs, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  return { error: upsertError?.message || null };
}

export async function incrementSessionCount(userId: string): Promise<number> {
  const current = await loadPreferences(userId);
  const newCount = (current?.session_count || 0) + 1;
  await savePreferences(userId, { session_count: newCount });
  return newCount;
}

// ---- Behavior ----

export async function loadBehavior(userId: string): Promise<UserBehavior | null> {
  const { data, error } = await supabase
    .from('user_behavior')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return {
    ignored_best_match_count: data.ignored_best_match_count,
    spice_contradictions: data.spice_contradictions,
    session_count: data.session_count,
    last_spice_prompt_at: data.last_spice_prompt_at,
    last_clarification_at: data.last_clarification_at,
    actual_spice_choices: data.actual_spice_choices || [],
    preferred_mode: data.preferred_mode,
  };
}

export async function saveBehavior(userId: string, behavior: Partial<UserBehavior>): Promise<{ error: string | null }> {
  const { error: upsertError } = await supabase
    .from('user_behavior')
    .upsert(
      { user_id: userId, ...behavior, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  return { error: upsertError?.message || null };
}

export async function trackIgnoredBestMatch(userId: string): Promise<number> {
  const current = await loadBehavior(userId);
  const newCount = (current?.ignored_best_match_count || 0) + 1;
  await saveBehavior(userId, { ignored_best_match_count: newCount });
  return newCount;
}

export async function resetIgnoredCount(userId: string): Promise<void> {
  await saveBehavior(userId, { ignored_best_match_count: 0 });
}

export async function trackSpiceChoice(userId: string, spiceLevel: number): Promise<{ contradictions: number; choices: number[] }> {
  const current = await loadBehavior(userId);
  const choices = [...(current?.actual_spice_choices || []), spiceLevel].slice(-10);
  
  // Detect contradiction: if recent choices trend differs from preference
  const recentAvg = choices.slice(-5).reduce((a, b) => a + b, 0) / Math.min(choices.length, 5);
  
  // Load user preference to compare
  const prefs = await loadPreferences(userId);
  const prefSpice = prefs?.spice_level || 2;
  const contradiction = Math.abs(recentAvg - prefSpice) > 1;
  const contradictions = contradiction ? (current?.spice_contradictions || 0) + 1 : 0;
  
  await saveBehavior(userId, { 
    actual_spice_choices: choices, 
    spice_contradictions: contradictions 
  });
  
  return { contradictions, choices };
}
