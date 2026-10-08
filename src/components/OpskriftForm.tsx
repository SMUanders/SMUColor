import { useState, type ReactNode } from 'react'
import { Check, Save } from 'lucide-react'
import type { CmykVaerdier, CreatePrintopskriftInput, FarveValg } from '../lib/types'
import { Swatch } from './Swatch'
import { SectionTitle } from './common'

function cmykFelt(v: string): number | null {
  if (v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : NaN
}

export interface OpskriftFormInitial {
  printer?: string | null
  medie?: string | null
  printmode?: string | null
  profil_quickset?: string | null
  cmyk_c?: number | null
  cmyk_m?: number | null
  cmyk_y?: number | null
  cmyk_k?: number | null
  outputopskrift?: string | null
  note?: string | null
}

const num = (n: number | null | undefined): string => (n === null || n === undefined ? '' : String(n))

/**
 * Fælles printopskrift-formular — bruges af både opret (OpskriftNy) og rediger
 * (OpskriftEdit), så felter og validering er identiske. Målfarven er read-only
 * (kan ikke skiftes); parenten står for selve gemningen + navigation.
 */
export function OpskriftForm({
  maalfarve,
  initial,
  submitLabel,
  savingLabel,
  statusNote,
  onSubmit,
}: {
  maalfarve: FarveValg
  initial?: OpskriftFormInitial
  submitLabel: string
  savingLabel: string
  statusNote?: ReactNode
  onSubmit: (input: CreatePrintopskriftInput) => Promise<void>
}) {
  const [medie, setMedie] = useState(initial?.medie ?? '')
  const [printmode, setPrintmode] = useState(initial?.printmode ?? '')
  const [profil, setProfil] = useState(initial?.profil_quickset ?? '')
  const [c, setC] = useState(num(initial?.cmyk_c))
  const [m, setM] = useState(num(initial?.cmyk_m))
  const [y, setY] = useState(num(initial?.cmyk_y))
  const [k, setK] = useState(num(initial?.cmyk_k))
  const [output, setOutput] = useState(initial?.outputopskrift ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const printer = initial?.printer || 'Canon Colorado M-series'

  async function gem() {
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
      await onSubmit({
        printer,
        medie: medie.trim() || null,
        printmode: printmode.trim() || null,
        profil_quickset: profil.trim() || null,
        cmyk,
        outputopskrift: output.trim() || null,
        note: note.trim() || null,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunne ikke gemme printopskriften.')
      setSaving(false)
    }
  }

  return (
    <>
      {error && (
        <div style={{ background: 'var(--color-red-soft)', color: 'var(--color-red-deep)', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>{error}</div>
      )}

      {/* Målfarve (read-only — opskriftens tilknytning kan ikke skiftes) */}
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
          <Felt label="Printer" value={printer} onChange={() => {}} readOnly />
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
          <Save size={16} /> {saving ? savingLabel : submitLabel}
        </button>
        {statusNote && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--color-text-muted)' }}>
            <Check size={14} /> {statusNote}
          </span>
        )}
      </div>
    </>
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
