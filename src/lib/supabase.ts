import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** true når appen er koblet på det delte SMU Supabase-projekt. */
export const hasSupabase = Boolean(url && anonKey)

// Én delt singleton-klient (auth + data deler session). null i lokal dev.
export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url as string, anonKey as string)
  : null
