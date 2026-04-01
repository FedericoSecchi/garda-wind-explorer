import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (import.meta.env.DEV) {
  console.log("[supabase] URL:", supabaseUrl ?? "MISSING");
  console.log("[supabase] Key present:", Boolean(supabaseAnonKey));
  console.log("[supabase] Configured:", isSupabaseConfigured);
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null!;
