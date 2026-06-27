import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[MadMix] Supabase env vars not set. ' +
    'Copy frontend/.env.example to frontend/.env and fill in your project values.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
