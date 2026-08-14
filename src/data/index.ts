// Vælger data-adapter: Supabase hvis konfigureret, ellers lokal dev-fallback.
import { hasSupabase, supabase } from '../lib/supabase'
import { LocalStore } from './localStore'
import { SupabaseStore } from './supabaseStore'
import type { FarveStore } from './store'

let instance: FarveStore | null = null

export function getStore(): FarveStore {
  if (instance) return instance
  instance = hasSupabase && supabase ? new SupabaseStore(supabase) : new LocalStore()
  return instance
}

export type { FarveStore } from './store'
