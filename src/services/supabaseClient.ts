
import { createClient } from '@supabase/supabase-js';

// Valores por defecto para evitar errores si las variables de entorno fallan temporalmente
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://esolamojbxosnwqbtmbe.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_zY7uEsSMSw-JMorX5KCBWw_A05KsnFa";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key missing. Falling back to internal defaults.');
}

// Initialize and export the Supabase client.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
