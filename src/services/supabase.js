import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Variabile VITE_SUPABASE_URL mancante. Controlla il file .env."
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Variabile VITE_SUPABASE_ANON_KEY mancante. Controlla il file .env."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);