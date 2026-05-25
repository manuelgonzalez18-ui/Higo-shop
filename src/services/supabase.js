import { createClient } from '@supabase/supabase-js';

// Fallbacks publicos para builds de produccion en Hostinger.
// Si los GitHub Secrets estan vacios o corruptos (URL sin https://,
// con whitespace, anon-key truncado), el bundle igual arranca contra el
// proyecto Supabase publico en vez de tirar la app entera. El workflow
// de deploy ya tiene warnings (sin exit 1) sobre esto.
const FALLBACK_URL = 'https://gorjpmylbnzjgexvunsc.supabase.co';
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcmpwbXlsYm56amdleHZ1bnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1ODYxNzIsImV4cCI6MjA5NTE2MjE3Mn0.a-ZYdvbsIUPTHyPKTIEDxVn0NDkpWF-K-Nkjg2YTptU';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

// Si el env var no es un URL http(s) valido, supabase-js explota con
// "Invalid supabaseUrl". Mejor detectarlo aca y usar el fallback.
const isValidHttpUrl = (value) => /^https?:\/\/[^\s]+$/i.test(value);

const supabaseUrl = isValidHttpUrl(rawUrl) ? rawUrl : FALLBACK_URL;
const supabaseAnonKey = rawAnonKey.length >= 20 ? rawAnonKey : FALLBACK_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
