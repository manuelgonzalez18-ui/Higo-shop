import { createClient } from '@supabase/supabase-js';

// Fallbacks for production builds/deployment to Hostinger
const FALLBACK_URL = 'https://gorjpmylbnzjgexvunsc.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcmpwbXlsYm56amdleHZ1bnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1ODYxNzIsImV4cCI6MjA5NTE2MjE3Mn0.a-ZYdvbsIUPTHyPKTIEDxVn0NDkpWF-K-Nkjg2YTptU';

// Retrieve credentials from Vite environment variables or use fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

// Create and export the single client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
