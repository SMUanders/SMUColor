import { useEffect, useRef, useState } from 'react'
import { getStore } from '../data'
import { useAuth } from '../context/AuthContext'
import { TOM_ONYX, type OnyxColorManagement, type OnyxMedia, type OnyxMediaGroup, type OnyxNiveau, type OnyxPrinter, type OnyxPrintmode, type OnyxValg } from '../lib/types'

type Valg = { id: string; navn: string }

/**
 * ONYX-konfiguration fra stamdatakatalog: afhængige dropdowns
 * Printer → Media Group → Media Name → Print Mode + Color Management (sidst).
 * Inline "+ Tilføj" (bruger+) opretter nye katalogværdier uden admin-skærm.
 */
export function OnyxKonfig({ value, onChange }: { value: OnyxValg; onChange: (v: OnyxValg) => void }) {
  const store = getStore()
  const { user } = useAuth()
  // Vis "+ Tilføj" for indloggede; DB håndhæver bruger+ (observatoer afvises der).
  const canWrite = Boolean(user)
  const [printere, setPrintere] = useState<OnyxPrinter[]>([])
  const [groups, setGroups] = useState<OnyxMediaGroup[]>([])
  const [medier, setMedier] = useState<OnyxMedia[]>([])
  const [modes, setModes] = useState<OnyxPrintmode[]>([])
  const [cms, setCms] = useState<OnyxColorManagement[]>([])
  const cmInit = useRef(false)

  useEffect(() => {
    store.onyxPrintere().then(setPrintere)
    store.onyxColorManagement().then(setCms)
  }, [store])
  useEffect(() => {
    if (value.printer_id) store.onyxMediaGroups(value.printer_id).then(setGroups)
    else setGroups([])
  }, [store, value.printer_id])
  useEffect(() => {
    if (value.media_group_id) store.onyxMedier(value.media_group_id).then(setMedier)
    else setMedier([])
  }, [store, value.media_group_id])
  useEffect(() => {
    if (value.media_id) store.onyxPrintmodes(value.media_id).then(setModes)
    else setModes([])
  }, [store, value.media_id])

  // Color Management forvalgt til standard, hvis intet er valgt.
  useEffect(() => {
    if (cmInit.current || cms.length === 0) return
    cmInit.current = true
    if (!value.color_management_id) {
      const std = cms.find((c) => c.er_standard) ?? cms[0]
      if (std) onChange({ ...value, color_management_id: std.id, color_management_navn: std.navn })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cms])

  async function tilfoej(niveau: OnyxNiveau, parentId: string | null, navn: string): Promise<Valg> {
    if (!user) throw new Error('Log ind for at tilføje.')
    const r = await store.onyxOpret(niveau, parentId, navn, user)
    // genindlæs relevant liste
    if (niveau === 'printer') setPrintere(await store.onyxPrintere())
    if (niveau === 'media_group') setGroups(await store.onyxMediaGroups(parentId!))
    if (niveau === 'media') setMedier(await store.onyxMedier(parentId!))
    if (niveau === 'printmode') setModes(await store.onyxPrintmodes(parentId!))
    if (niveau === 'color_management') setCms(await store.onyxColorManagement())
    return r
  }

  return (
    <div className="smu-card" style={{ padding: 16, display: 'grid', gap: 12 }}>
      <Vaelger
        label="Printer"
        options={printere}
        valueId={value.printer_id}
        valueNavn={value.printer_navn}
        onPick={(v) => onChange({ ...TOM_ONYX, color_management_id: value.color_management_id, color_management_navn: value.color_management_navn, printer_id: v?.id ?? null, printer_navn: v?.navn ?? null })}
        onTilfoej={canWrite ? (navn) => tilfoej('printer', null, navn) : null}
      />
      <Vaelger
        label="Media Group"
        options={groups}
        valueId={value.media_group_id}
        valueNavn={value.media_group_navn}
        disabled={!value.printer_id}
        onPick={(v) => onChange({ ...value, media_group_id: v?.id ?? null, media_group_navn: v?.navn ?? null, media_id: null, media_navn: null, printmode_id: null, printmode_navn: null })}
        onTilfoej={canWrite && value.printer_id ? (navn) => tilfoej('media_group', value.printer_id, navn) : null}
      />
      <Vaelger
        label="Media Name"
        options={medier}
        valueId={value.media_id}
        valueNavn={value.media_navn}
        disabled={!value.media_group_id}
        onPick={(v) => onChange({ ...value, media_id: v?.id ?? null, media_navn: v?.navn ?? null, printmode_id: null, printmode_navn: null })}
        onTilfoej={canWrite && value.media_group_id ? (navn) => tilfoej('media', value.media_group_id, navn) : null}
      />
      <Vaelger
        label="Print Mode"
        options={modes}
        valueId={value.printmode_id}
        valueNavn={value.printmode_navn}
        disabled={!value.media_id}
        onPick={(v) => onChange({ ...value, printmode_id: v?.id ?? null, printmode_navn: v?.navn ?? null })}
        onTilfoej={canWrite && value.media_id ? (navn) => tilfoej('printmode', value.media_id, navn) : null}
      />
      <Vaelger
        label="Color Management"
        options={cms}
        valueId={value.color_management_id}
        valueNavn={value.color_management_navn}
        onPick={(v) => onChange({ ...value, color_management_id: v?.id ?? null, color_management_navn: v?.navn ?? null })}
        onTilfoej={canWrite ? (navn) => tilfoej('color_management', null, navn) : null}
      />
    </div>
  )
}

function Vaelger({ label, options, valueId, valueNavn, onPick, onTilfoej, disabled }: {
  label: string
  options: Valg[]
  valueId: string | null
  valueNavn: string | null
  onPick: (v: Valg | null) => void
  onTilfoej: ((navn: string) => Promise<Valg>) | null
  disabled?: boolean
}) {
  const [tilfoejer, setTilfoejer] = useState(false)
  const [nyNavn, setNyNavn] = useState('')
  const [fejl, setFejl] = useState<string | null>(null)
  const [gemmer, setGemmer] = useState(false)

  // Vis valgt værdi selv hvis den ikke er i listen (legacy/deaktiveret).
  const harValgt = valueId != null && options.some((o) => o.id === valueId)
  const alle = valueId && !harValgt ? [...options, { id: valueId, navn: `${valueNavn ?? 'ukendt'} (udgået)` }] : options

  async function gem() {
    const n = nyNavn.trim()
    if (!n || !onTilfoej) return
    setGemmer(true); setFejl(null)
    try {
      const v = await onTilfoej(n)
      onPick(v)
      setTilfoejer(false); setNyNavn('')
    } catch (e) {
      setFejl(e instanceof Error ? e.message : 'Kunne ikke tilføje.')
    } finally {
      setGemmer(false)
    }
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', gap: 6 }}>
        <select
          className="smu-input"
          value={valueId ?? ''}
          disabled={disabled}
          onChange={(e) => {
            const o = alle.find((x) => x.id === e.target.value)
            onPick(o ? { id: o.id, navn: o.navn.replace(/ \(udgået\)$/, '') } : null)
          }}
          style={{ flex: 1, opacity: disabled ? 0.6 : 1 }}
        >
          <option value="">{disabled ? 'Vælg forrige felt først' : '—'}</option>
          {alle.map((o) => (
            <option key={o.id} value={o.id}>{o.navn}</option>
          ))}
        </select>
        {onTilfoej && !disabled && (
          <button type="button" className="smu-btn-secondary" onClick={() => setTilfoejer((v) => !v)} title="Tilføj ny" style={{ padding: '0 12px', fontWeight: 800 }}>
            +
          </button>
        )}
      </div>
      {tilfoejer && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <input className="smu-input" value={nyNavn} onChange={(e) => setNyNavn(e.target.value)} placeholder={`Ny ${label.toLowerCase()}…`} style={{ flex: 1 }} />
          <button type="button" className="smu-btn-primary" onClick={gem} disabled={gemmer || !nyNavn.trim()}>Tilføj</button>
        </div>
      )}
      {fejl && <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-red-deep)', marginTop: 4 }}>{fejl}</div>}
    </div>
  )
}
