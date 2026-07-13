import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Variabile VITE_SUPABASE_URL mancante. Controlla le variabili Netlify.",
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    "Variabile VITE_SUPABASE_PUBLISHABLE_KEY mancante. Controlla le variabili Netlify.",
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
);
