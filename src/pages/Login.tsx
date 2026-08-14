import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BrandMark } from '../components/BrandMark'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await signIn(email.trim(), password)
    setBusy(false)
    if (error) setError(error)
    else navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--color-bg)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 22 }}>
          <BrandMark size={42} />
          <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--color-navy)' }}>SMU Color</span>
        </div>

        <form onSubmit={onSubmit} className="smu-card" style={{ padding: 24 }}>
          <h1 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px' }}>Log ind</h1>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 18px' }}>
            Brug dit Signmeup-login (fornavn@signmeup.dk).
          </p>

          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Email</label>
          <input
            className="smu-input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="fornavn@signmeup.dk"
            required
            style={{ marginBottom: 14 }}
          />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>Adgangskode</label>
          <input
            className="smu-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ marginBottom: 18 }}
          />

          {error && (
            <div style={{ background: 'var(--color-red-soft)', color: 'var(--color-red-deep)', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button className="smu-btn-primary" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Logger ind…' : 'Log ind'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginTop: 16 }}>
          Internt værktøj for Signmeups tegnestue.
        </p>
      </div>
    </div>
  )
}
