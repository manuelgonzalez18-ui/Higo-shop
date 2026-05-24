import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables are not defined. ' +
    'Please create a .env file in the project root to configure the connection.'
  );
}

// Create and export the single client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
