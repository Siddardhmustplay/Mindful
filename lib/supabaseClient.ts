// lib/supabaseClient.ts
'use client'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function createBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // In the browser, we do want a hard error if envs are missing.
  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
  }
  return createClient(url, anon, { auth: { persistSession: false } })
}

// During build/SSR (no window), avoid crashing the bundler.
// Return a proxy that throws only if something actually tries to use it.
function createServerSafeStub(): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get() {
      throw new Error('Supabase client accessed on the server/build without NEXT_PUBLIC_* envs. ' +
                      'Ensure the page is client-only or provide envs at build time.')
    },
  })
}

export const supabase: SupabaseClient =
  typeof window === 'undefined' ? createServerSafeStub() : createBrowserClient()
