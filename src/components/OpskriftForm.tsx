import { useEffect, useState, type ReactNode } from 'react'
import { Check, Save } from 'lucide-react'
import { getStore } from '../data'
import { TOM_ONYX, type CmykVaerdier, type CreatePrintopskriftInput, type FarveValg, type OnyxValg, type PrintopskriftFeltforslag } from '../lib/types'
import { Swatch } from './Swatch'
import { OnyxKonfig } from './OnyxKonfig'
import { SectionTitle } from './common'

function kanalFelt(v: string): number | null {
  if (v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : NaN
}

export interface OpskriftFormInitial {
  medie?: string | null
  laminat?: string | null
  profil_quickset?: string | null
  printer?: string | null
  onyx_printer_id?: string | null
  media_group?: string | null
  onyx_media_group_id?: string | null
  media_name?: string | null
  onyx_media_id?: string | null
  printmode?: string | null
  onyx_printmode_id?: string | null
  color_management?: string | null
  onyx_color_management_id?: string | null
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

function initialOnyx(i?: OpskriftFormInitial): OnyxValg {
  if (!i) return TOM_ONYX
  return {
    printer_id: i.onyx_printer_id ?? null, printer_navn: i.printer ?? null,
    media_group_id: i.onyx_media_group_id ?? null, media_group_navn: i.media_group ?? null,
    media_id: i.onyx_media_id ?? null, media_navn: i.media_name ?? null,
    printmode_id: i.onyx_printmode_id ?? null, printmode_navn: i.printmode ?? null,
    color_management_id: i.onyx_color_management_id ?? null, color_management_navn: i.color_management ?? null,
  }
}

/**
 * Fælles printopskrift-formular (opret + rediger). Afsnit: Målfarve, Materialer
 * (fri tekst), ONYX-konfiguration (katalog-dropdowns + Color Management),
 * Farvekanaler (CMYK + Spot1/Spot2), Note. Spot1/Spot2 gemmes i kanalvaerdier.
 */
export function OpskriftForm({
  maalfarve, initial, submitLabel, savingLabel, statusNote, onSubmit,
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
  const [profil, setProfil] = useState(initial?.profil_quickset ?? '')
  const [onyx, setOnyx] = useState<OnyxValg>(initialOnyx(initial))
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

  useEffect(() => {
    let aktiv = true
    store.printopskriftFeltforslag().then((f) => aktiv && setForslag(f))
    return () => { aktiv = false }
  }, [store])

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
        medie: medie.trim() || null,
        laminat: laminat.trim() || null,
        profil_quickset: profil.trim() || null,
        printer: onyx.printer_navn,
        onyx_printer_id: onyx.printer_id,
        media_group: onyx.media_group_navn,
        onyx_media_group_id: onyx.media_group_id,
        media_name: onyx.media_navn,
        onyx_media_id: onyx.media_id,
        printmode: onyx.printmode_navn,
        onyx_printmode_id: onyx.printmode_id,
        color_management: onyx.color_management_navn,
        onyx_color_management_id: onyx.color_management_id,
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

      <div className="smu-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, marginBottom: 20 }}>
        <Swatch hex={maalfarve.hex} size={40} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--color-text-muted)' }}>Målfarve</div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{maalfarve.titel}</div>
        </div>
      </div>

      <section style={{ marginBottom: 20 }}>
        <SectionTitle>Materialer</SectionTitle>
        <div className="smu-card" style={{ padding: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Felt label="Printmedie" value={medie} onChange={setMedie} placeholder="fx Oracal 3551 hvid" forslag={forslag.medie} />
          <Felt label="Laminat" value={laminat} onChange={setLaminat} placeholder="fx Oraguard 215" forslag={forslag.laminat} />
        </div>
        <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '8px 0 0 2px' }}>
          Fri tekst. Materialer ejes af SMU Source.
        </p>
      </section>

      <section style={{ marginBottom: 20 }}>
        <SectionTitle>ONYX-produktionsopsætning</SectionTitle>
        <OnyxKonfig value={onyx} onChange={setOnyx} />
        <div style={{ marginTop: 12 }}>
          <Felt label="Profil / Quick Set (valgfri)" value={profil} onChange={setProfil} placeholder="fx SMU-standard" />
        </div>
      </section>

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
            0–100. CMYK gør opskriften søgbar. Spot1/Spot2 gemmes som kanalværdier.
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

function Felt({ label, value, onChange, placeholder, forslag }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; forslag?: string[] }) {
  const listId = forslag && forslag.length ? `dl-${label.replace(/[^a-zA-Z]/g, '')}` : undefined
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>{label}</label>
      <input className="smu-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} list={listId} />
      {listId && (
        <datalist id={listId}>
          {forslag!.map((f) => (<option key={f} value={f} />))}
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
