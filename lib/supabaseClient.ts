'use client'

import { createClient } from '@supabase/supabase-js'


const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anon) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
}

// Export directly as supabase
export const supabase = createClient(url, anon, {
  auth: {
    persistSession: false, // You're not using Supabase Auth here
  },
})
