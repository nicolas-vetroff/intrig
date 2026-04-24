import { createClient } from '@supabase/supabase-js'

// Service-role Supabase client. Bypasses RLS — only use server-side
// behind a trust boundary (admin-gated server actions). Never expose
// the service role key to the client, never import this from a file
// that might leak into a client bundle.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Service-role client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    )
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
