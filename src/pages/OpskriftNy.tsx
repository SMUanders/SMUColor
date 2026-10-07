import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Save } from 'lucide-react'
import { getStore } from '../data'
import { useAuth } from '../context/AuthContext'
import type { CmykVaerdier, FarveValg } from '../lib/types'
import { Swatch } from '../components/Swatch'
import { farveHref } from '../lib/nav'
import { ErrorState, SectionTitle } from '../components/common'

function cmykFelt(v: string): number | null {
  if (v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : NaN
}

export default function OpskriftNy() {
  const store = getStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const farve = (useLocation().state ?? {}) as { farve?: FarveValg }
  const maalfarve = farve.farve

  const [medie, setMedie] = useState('')
  const [printmode, setPrintmode] = useState('')
  const [profil, setProfil] = useState('')
  const [c, setC] = useState('')
  const [m, setM] = useState('')
  const [y, setY] = useState('')
  const [k, setK] = useState('')
  const [output, setOutput] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!maalfarve) {
    return (
      <ErrorState title="Ingen målfarve valgt">
        Åbn en farve og brug “Opret printopskrift” derfra.
        <div style={{ marginTop: 14 }}>
          <Link to="/" className="smu-btn-secondary" style={{ textDecoration: 'none' }}>Til søgning</Link>
        </div>
      </ErrorState>
    )
  }

  async function gem() {
    if (!user || !maalfarve) return
    const cv = [c, m, y, k].map(cmykFelt)
    if (cv.some((x) => Number.isNaN(x))) {
      setError('CMYK-værdier skal være tal mellem 0 og 100.')
      return
    }
    const alleCmyk = cv.every((x) => x !== null)
    const cmyk: CmykVaerdier | null = alleCmyk ? { c: cv[0]!, m: cv[1]!, y: cv[2]!, k: cv[3]! } : null
    setSaving(true)
    setError(null)
    try {
      await store.createPrintopskrift(
        { kind: maalfarve.kind, refId: maalfarve.refId },
        { printer: 'Canon Colorado M-series', medie: medie.trim() || null, printmode: printmode.trim() || null, profil_quickset: profil.trim() || null, cmyk, outputopskrift: output.trim() || null, note: note.trim() || null },
        user,
      )
      navigate(farveHref(maalfarve) ?? '/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunne ikke gemme printopskriften.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <Link to="/" className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={15} /> Tilbage
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Opret printopskrift</h1>
      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 18px' }}>
        Canon Colorado / ONYX — hvordan vi rammer målfarven.
      </p>

      {error && (
        <div style={{ background: 'var(--color-red-soft)', color: 'var(--color-red-deep)', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>{error}</div>
      )}

      {/* Målfarve */}
      <div className="smu-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, marginBottom: 20 }}>
        <Swatch hex={maalfarve.hex} size={40} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--color-text-muted)' }}>Målfarve</div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{maalfarve.titel}</div>
        </div>
      </div>

      <section style={{ marginBottom: 20 }}>
        <SectionTitle>Produktion</SectionTitle>
        <div className="smu-card" style={{ padding: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Felt label="Printer" value="Canon Colorado M-series" onChange={() => {}} readOnly />
          <Felt label="Medie" value={medie} onChange={setMedie} placeholder="fx Oracal 751C hvid" />
          <Felt label="Printmode" value={printmode} onChange={setPrintmode} placeholder="fx High Quality" />
          <Felt label="Profil / Quick Set" value={profil} onChange={setProfil} placeholder="fx SMU-standard" />
        </div>
      </section>

      <section style={{ marginBottom: 20 }}>
        <SectionTitle>Outputværdier (CMYK)</SectionTitle>
        <div className="smu-card" style={{ padding: 16 }}>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(4, 1fr)', maxWidth: 360 }}>
            <Cmyk label="C" value={c} onChange={setC} />
            <Cmyk label="M" value={m} onChange={setM} />
            <Cmyk label="Y" value={y} onChange={setY} />
            <Cmyk label="K" value={k} onChange={setK} />
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', margin: '10px 0 0' }}>
            0–100. De gemte værdier gør opskriften søgbar via fx “C0 M100 Y80 K5”.
          </p>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, margin: '14px 0 6px' }}>Rå outputopskrift (valgfri)</label>
          <textarea className="smu-input" value={output} onChange={(e) => setOutput(e.target.value)} placeholder="Faktisk ONYX-opskrift / kanalværdier…" />
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <SectionTitle>Note (valgfri)</SectionTitle>
        <textarea className="smu-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Fri note om opskriften…" />
      </section>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="smu-btn-primary" onClick={gem} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Save size={16} /> {saving ? 'Gemmer…' : 'Gem som forslag'}
        </button>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--color-text-muted)' }}>
          <Check size={14} /> Gemmes som forslag — ikke verificeret
        </span>
      </div>
    </div>
  )
}

function Felt({ label, value, onChange, placeholder, readOnly }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; readOnly?: boolean }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>{label}</label>
      <input className="smu-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly} style={readOnly ? { color: 'var(--color-text-muted)' } : undefined} />
    </div>
  )
}

function Cmyk({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 6, textAlign: 'center' }}>{label}</label>
      <input className="smu-input" value={value} onChange={(e) => onChange(e.target.value)} inputMode="numeric" placeholder="0" style={{ textAlign: 'center', padding: '10px 6px' }} />
    </div>
  )
}
