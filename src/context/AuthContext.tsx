import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { hasSupabase, supabase } from '../lib/supabase'
import type { CurrentUser } from '../lib/types'

interface AuthState {
  user: CurrentUser | null
  loading: boolean
  /** false i lokal dev (ingen login-gate). */
  requiresLogin: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

// Dev-bruger i lokal tilstand (ingen Supabase). Behandles som redaktør så
// hele flowet kan afprøves uden login.
const DEV_USER: CurrentUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'dev@signmeup.dk',
  navn: 'Dev (lokal)',
  erRedaktoer: true,
}

function navnFraEmail(email: string): string {
  const local = email.split('@')[0] ?? email
  return local.charAt(0).toUpperCase() + local.slice(1)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(hasSupabase ? null : DEV_USER)
  const [loading, setLoading] = useState(hasSupabase)

  useEffect(() => {
    if (!hasSupabase || !supabase) return
    let active = true

    async function loadFromSession() {
      const { data } = await supabase!.auth.getSession()
      if (!active) return
      await applyUser(data.session?.user ?? null)
      setLoading(false)
    }

    async function applyUser(authUser: { id: string; email?: string } | null) {
      if (!authUser) {
        setUser(null)
        return
      }
      // Hent navn + rolle fra den delte profiler-tabel (defensivt — kolonner
      // kan variere i det delte projekt).
      let navn = navnFraEmail(authUser.email ?? '')
      let erRedaktoer = false
      try {
        const { data: profil } = await supabase!
          .from('profiler')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle()
        if (profil) {
          const p = profil as Record<string, unknown>
          navn = (p.navn as string) || (p.fornavn as string) || navn
          const rolle = String(p.rolle ?? p.role ?? '').toLowerCase()
          erRedaktoer = ['admin', 'redaktoer', 'redaktør', 'editor'].includes(rolle)
        }
      } catch {
        // profiler findes måske ikke endnu — fald tilbage til navn fra email.
      }
      setUser({ id: authUser.id, email: authUser.email ?? '', navn, erRedaktoer })
    }

    loadFromSession()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      applyUser(session?.user ?? null)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      requiresLogin: hasSupabase,
      async signIn(email, password) {
        if (!supabase) return { error: null }
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error ? oversætFejl(error.message) : null }
      },
      async signOut() {
        if (supabase) await supabase.auth.signOut()
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function oversætFejl(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'Forkert email eller adgangskode.'
  if (/email not confirmed/i.test(msg)) return 'Emailen er ikke bekræftet endnu.'
  return msg
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth skal bruges inde i AuthProvider')
  return ctx
}
