import { type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutList, LogOut, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getStore } from '../data'
import { BrandMark } from './BrandMark'
import { supabase } from '../lib/supabase'
import { AppSwitcher } from '../platform-nav/AppSwitcher'

function NavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '7px 12px',
        borderRadius: 8,
        fontWeight: 800,
        fontSize: 13,
        textDecoration: 'none',
        color: isActive ? '#fff' : 'var(--color-text-on-navy)',
        background: isActive ? 'var(--color-navy-soft)' : 'transparent',
      })}
    >
      {icon}
      {label}
    </NavLink>
  )
}

export function Layout() {
  const { user, requiresLogin, signOut } = useAuth()
  const navigate = useNavigate()
  const store = getStore()

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: 'var(--color-navy)', color: '#fff' }}>
        <div className="smu-shell" style={{ display: 'flex', alignItems: 'center', gap: 16, height: 58 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}>
            <BrandMark size={30} />
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: 0.2 }}>SMU Color</span>
          </Link>

          <nav style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
            <NavItem to="/" icon={<Search size={15} />} label="Søg" />
            {user?.erRedaktoer && <NavItem to="/admin" icon={<LayoutList size={15} />} label="Administration" />}
          </nav>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Diskret skift til Hub og brugerens øvrige SMU-apps.
                Kræver den delte Supabase-klient; i lokal dev uden nøgler er den null. */}
            {supabase && <AppSwitcher supabase={supabase} currentAppKey="color" />}
            {store.mode === 'local' && (
              <span className="smu-badge smu-badge-orange" title="Kører uden Supabase — data gemmes kun lokalt i browseren.">
                Lokal dev
              </span>
            )}
            {user && (
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text-on-navy)' }}>
                {user.navn}
                {!user.erRedaktoer && <span style={{ color: 'var(--color-text-on-navy-muted)' }}> · medarbejder</span>}
              </span>
            )}
            {requiresLogin && user && (
              <button
                onClick={async () => {
                  await signOut()
                  navigate('/login')
                }}
                title="Log ud"
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-on-navy)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="smu-shell" style={{ flex: 1, padding: '24px 20px 64px' }}>
        <Outlet />
      </main>
    </div>
  )
}

/** Beskytter redaktør-ruter. Medarbejdere ser en pæn SMU-besked. */
export function RequireRedaktoer({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user?.erRedaktoer) {
    return (
      <div className="smu-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Kun for redaktører</div>
        <div style={{ color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 14 }}>
          Denne handling kræver redaktør-adgang. Du kan søge og se referencer og matches som medarbejder.
        </div>
        <div style={{ marginTop: 16 }}>
          <Link className="smu-btn-secondary" to="/" state={{ from: location.pathname }} style={{ textDecoration: 'none' }}>
            Tilbage til søgning
          </Link>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
