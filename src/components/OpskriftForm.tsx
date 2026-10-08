import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Check, Save } from 'lucide-react'
import { getStore } from '../data'
import type { CmykVaerdier, CreatePrintopskriftInput, FarveValg, PrintopskriftFeltforslag } from '../lib/types'
import { Swatch } from './Swatch'
import { SectionTitle } from './common'

function kanalFelt(v: string): number | null {
  if (v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : NaN
}

export interface OpskriftFormInitial {
  printer?: string | null
  medie?: string | null
  laminat?: string | null
  media_group?: string | null
  media_name?: string | null
  ink_setup?: string | null
  printmode?: string | null
  profil_quickset?: string | null
  cmyk_c?: number | null
  cmyk_m?: number | null
  cmyk_y?: number | null
  cmyk_k?: number | null
  spot1?: number | null
  spot2?: number | null
  outputopskrift?: string | null
  note?: string | null
}

const num = (n: number | null | undefined): string => (n === null || n === undefined ? '' : String(n))
const TOM_FORSLAG: PrintopskriftFeltforslag = { medie: [], laminat: [], media_group: [], ink_setup: [], kombinationer: [] }

/**
 * Fælles printopskrift-formular (opret + rediger). Fem afsnit: Målfarve,
 * Materialer, ONYX-konfiguration, Farvekanaler, Note. Datalist-forslag fra
 * faktiske data (fri tekst altid mulig). Spot1/Spot2 gemmes i kanalvaerdier.
 * Ingen obligatoriske felter ud over at noget kan gemmes.
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
  const store = getStore()
  const [forslag, setForslag] = useState<PrintopskriftFeltforslag>(TOM_FORSLAG)
  const [medie, setMedie] = useState(initial?.medie ?? '')
  const [laminat, setLaminat] = useState(initial?.laminat ?? '')
  const [mediaGroup, setMediaGroup] = useState(initial?.media_group ?? '')
  const [mediaName, setMediaName] = useState(initial?.media_name ?? '')
  const [inkSetup, setInkSetup] = useState(initial?.ink_setup ?? '')
  const [printmode, setPrintmode] = useState(initial?.printmode ?? '')
  const [profil, setProfil] = useState(initial?.profil_quickset ?? '')
  const [c, setC] = useState(num(initial?.cmyk_c))
  const [m, setM] = useState(num(initial?.cmyk_m))
  const [y, setY] = useState(num(initial?.cmyk_y))
  const [k, setK] = useState(num(initial?.cmyk_k))
  const [s1, setS1] = useState(num(initial?.spot1))
  const [s2, setS2] = useState(num(initial?.spot2))
  const [output, setOutput] = useState(initial?.outputopskrift ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const printer = initial?.printer || 'Canon Colorado M-series'

  useEffect(() => {
    let aktiv = true
    store.printopskriftFeltforslag().then((f) => aktiv && setForslag(f))
    return () => {
      aktiv = false
    }
  }, [store])

  // Afhængige forslag bygget paa reelle ONYX-kombinationer (ikke Source-antagelser).
  const mediaNameForslag = useMemo(() => {
    const vals = forslag.kombinationer
      .filter((x) => x.media_name && (!mediaGroup.trim() || x.media_group === mediaGroup.trim()))
      .map((x) => x.media_name as string)
    return [...new Set(vals)].sort((a, b) => a.localeCompare(b, 'da'))
  }, [forslag, mediaGroup])
  const printmodeForslag = useMemo(() => {
    const vals = forslag.kombinationer
      .filter((x) => x.printmode && (!mediaGroup.trim() || x.media_group === mediaGroup.trim()) && (!mediaName.trim() || x.media_name === mediaName.trim()))
      .map((x) => x.printmode as string)
    return [...new Set(vals)].sort((a, b) => a.localeCompare(b, 'da'))
  }, [forslag, mediaGroup, mediaName])

  async function gem() {
    const cv = [c, m, y, k].map(kanalFelt)
    const sv = [s1, s2].map(kanalFelt)
    if ([...cv, ...sv].some((x) => Number.isNaN(x))) {
      setError('Kanalværdier skal være tal mellem 0 og 100.')
      return
    }
    const cmyk: CmykVaerdier | null = cv.every((x) => x !== null) ? { c: cv[0]!, m: cv[1]!, y: cv[2]!, k: cv[3]! } : null
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        printer,
        medie: medie.trim() || null,
        laminat: laminat.trim() || null,
        media_group: mediaGroup.trim() || null,
        media_name: mediaName.trim() || null,
        ink_setup: inkSetup.trim() || null,
        printmode: printmode.trim() || null,
        profil_quickset: profil.trim() || null,
        cmyk,
        spot1: sv[0],
        spot2: sv[1],
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

      {/* A · Målfarve (read-only — tilknytning kan ikke skiftes) */}
      <div className="smu-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, marginBottom: 20 }}>
        <Swatch hex={maalfarve.hex} size={40} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--color-text-muted)' }}>Målfarve</div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{maalfarve.titel}</div>
        </div>
      </div>

      {/* B · Materialer */}
      <section style={{ marginBottom: 20 }}>
        <SectionTitle>Materialer</SectionTitle>
        <div className="smu-card" style={{ padding: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Felt label="Printmedie" value={medie} onChange={setMedie} placeholder="fx Oracal 3551 hvid" forslag={forslag.medie} />
          <Felt label="Laminat" value={laminat} onChange={setLaminat} placeholder="fx Oraguard 215" forslag={forslag.laminat} />
        </div>
        <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '8px 0 0 2px' }}>
          Fri tekst. Materialer ejes af SMU Source — her registreres kun hvad opskriften bruger.
        </p>
      </section>

      {/* C · ONYX-produktionsopsætning */}
      <section style={{ marginBottom: 20 }}>
        <SectionTitle>ONYX-produktionsopsætning</SectionTitle>
        <div className="smu-card" style={{ padding: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Felt label="Printer" value={printer} onChange={() => {}} readOnly />
          <Felt label="Media Group" value={mediaGroup} onChange={setMediaGroup} placeholder="fx SMU Profiling 310823" forslag={forslag.media_group} />
          <Felt label="Media Name" value={mediaName} onChange={setMediaName} placeholder="fx SMU Orajet 3551" forslag={mediaNameForslag} />
          <Felt label="Print Mode" value={printmode} onChange={setPrintmode} placeholder="fx Gloss 4 pass HQ" forslag={printmodeForslag} />
          <Felt label="Ink Setup" value={inkSetup} onChange={setInkSetup} placeholder="fx CMYKSS" forslag={forslag.ink_setup} />
          <Felt label="Profil / Quick Set" value={profil} onChange={setProfil} placeholder="fx SMU-standard" />
        </div>
      </section>

      {/* D · Farvekanaler */}
      <section style={{ marginBottom: 20 }}>
        <SectionTitle>Farvekanaler</SectionTitle>
        <div className="smu-card" style={{ padding: 16 }}>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(6, 1fr)', maxWidth: 520 }}>
            <Kanal label="C" value={c} onChange={setC} />
            <Kanal label="M" value={m} onChange={setM} />
            <Kanal label="Y" value={y} onChange={setY} />
            <Kanal label="K" value={k} onChange={setK} />
            <Kanal label="Spot1" value={s1} onChange={setS1} />
            <Kanal label="Spot2" value={s2} onChange={setS2} />
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', margin: '10px 0 0' }}>
            0–100. CMYK gør opskriften søgbar (fx “C0 M100 Y80 K5”). Spot1/Spot2 gemmes som kanalværdier.
          </p>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 800, margin: '14px 0 6px' }}>Rå outputopskrift (valgfri)</label>
          <textarea className="smu-input" value={output} onChange={(e) => setOutput(e.target.value)} placeholder="Faktisk ONYX-opskrift / kanalværdier…" />
        </div>
      </section>

      {/* E · Note */}
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

function Felt({ label, value, onChange, placeholder, readOnly, forslag }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; readOnly?: boolean; forslag?: string[] }) {
  const listId = forslag && forslag.length ? `dl-${label.replace(/[^a-zA-Z]/g, '')}` : undefined
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>{label}</label>
      <input className="smu-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly} list={listId} style={readOnly ? { color: 'var(--color-text-muted)' } : undefined} />
      {listId && (
        <datalist id={listId}>
          {forslag!.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
      )}
    </div>
  )
}

function Kanal({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6, textAlign: 'center' }}>{label}</label>
      <input className="smu-input" value={value} onChange={(e) => onChange(e.target.value)} inputMode="numeric" placeholder="—" style={{ textAlign: 'center', padding: '10px 4px' }} />
    </div>
  )
}
