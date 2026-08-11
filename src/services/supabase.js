import { createClient } from '@supabase/supabase-js';

// La URL del proyecto de Supabase no es un secreto. Mantenemos un fallback
// únicamente para la URL para que un secret VITE_SUPABASE_URL malformado no
// rompa el bundle. La anon key SI debe venir siempre del entorno.
const DEFAULT_SUPABASE_URL = 'https://gorjpmylbnzjgexvunsc.supabase.co';
const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
const isValidSupabaseUrl = (value) => /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(value);

const supabaseUrl = isValidSupabaseUrl(rawSupabaseUrl)
  ? rawSupabaseUrl
  : DEFAULT_SUPABASE_URL;

if (supabaseAnonKey.length < 20) {
  throw new Error('Configuración inválida: falta VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
