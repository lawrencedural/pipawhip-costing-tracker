import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your project credentials.'
  );
}

// Note: we intentionally don't pass the generated `Database` generic here.
// Our hand-written types in `types.ts` are applied at the hook boundary
// instead, which keeps the postgrest-js query builder's overloads simple.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
