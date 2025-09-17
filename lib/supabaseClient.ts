// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Important: use the *anon* public key on the client.
// Set these in your .env.local:
// NEXT_PUBLIC_SUPABASE_URL=...
// NEXT_PUBLIC_SUPABASE_ANON_KEY=...
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: false }, // you’re not using Supabase Auth here
  }
)
