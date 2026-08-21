import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { platformAuthStorage } from '../platform-nav/platformStorage'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** true når appen er koblet på det delte SMU Supabase-projekt. */
export const hasSupabase = Boolean(url && anonKey)

// Én delt singleton-klient (auth + data deler session). null i lokal dev.
//
// Kun `storage` er overridet — miljøbevidst platform-session: på *.smu.signmeup.dk
// gemmes sessionen i en cookie scoped til .smu.signmeup.dk, så login deles med de øvrige
// SMU-apps. På localhost og *.netlify.app falder den tilbage til localStorage, dvs.
// UÆNDRET nuværende adfærd indtil Color får sit custom subdomæne.
// Ingen anden auth-logik, ingen flowType og ingen defaults er rørt.
export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url as string, anonKey as string, {
      auth: {
        storage: platformAuthStorage(),
      },
    })
  : null
