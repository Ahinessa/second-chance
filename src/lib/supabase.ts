import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const fallbackUrl = 'https://pactumjrziwltfjbvlvn.supabase.co';
const fallbackKey = 'sb_publishable_zYVmGDc9y2ds52LbTMWlKQ_-EzFW3PE';

export const supabaseConfigReady = Boolean((envUrl || fallbackUrl) && (envKey || fallbackKey));
export const supabaseConfigSource = envUrl && envKey ? 'environment' : 'fallback';

// Always initialize with safe non-empty values so missing build-time env vars do not crash startup.
export const supabase = createClient(envUrl || fallbackUrl, envKey || fallbackKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
