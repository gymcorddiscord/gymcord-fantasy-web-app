import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
    throw new Error(
        'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set — copy frontend/.env.example to frontend/.env.local and fill them in.'
    );
}

export const supabase = createClient(url, anonKey);
