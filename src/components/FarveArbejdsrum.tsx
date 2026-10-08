import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Layers, Pencil, Plus, Printer, Save } from 'lucide-react'
import { getStore } from '../data'
import { useAuth } from '../context/AuthContext'
import type { CreatePrintopskriftInput, FarveValg, Printopskrift, PrintopskriftView, RelationView, VerificationHistory } from '../lib/types'
import { Swatch } from './Swatch'
import { StatusBadge } from './StatusBadge'
import { FarveValgRow } from './FarveValgRow'
import { FarveValgtKort } from './FarveValgtKort'
import { PrintopskriftRow } from './PrintopskriftSektion'
import { FarveVaelger } from './FarveVaelger'
import { OpskriftForm } from './OpskriftForm'
import { OpskriftIndhold } from './OpskriftIndhold'
import { Drawer } from './Drawer'
import { farveHref } from '../lib/nav'
import { EmptyState, SectionTitle, Spinner } from './common'

/**
 * Farvens arbejdsrum (V1.5 Fase 3): farvematches + printopskrifter samlet, med
 * opret/åbn/rediger i drawers. Drawers styres via URL-params (?ny= / ?opskrift=
 * / &rediger=1), så direkte links og browserens tilbage-knap virker. Den aktive
 * farve er altid tydelig; eksisterende sider/flows og pilotdata bevares.
 */
export function FarveArbejdsrum({ farve, canEdit, canMatch }: { farve: FarveValg; canEdit: boolean; canMatch?: boolean }) {
  const kanMatche = canMatch ?? canEdit
  const store = getStore()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const [relations, setRelations] = useState<RelationView[] | null>(null)
  const [opskrifter, setOpskrifter] = useState<Printopskrift[] | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let aktiv = true
    setRelations(null)
    setOpskrifter(null)
    store.getRelationsForColor(farve.kind, farve.refId).then((r) => aktiv && setRelations(r))
    store.getPrintopskrifterForColor(farve.kind, farve.refId).then((o) => aktiv && setOpskrifter(o))
    return () => {
      aktiv = false
    }
  }, [store, farve.kind, farve.refId, refreshKey])

  const ny = sp.get('ny') // 'match' | 'opskrift'
  const opskriftId = sp.get('opskrift')
  const rediger = sp.get('rediger') === '1'

  const openParams = useCallback((next: Record<string, string>) => setSp(next), [setSp])
  const closeDrawer = useCallback(() => setSp({}, { replace: true }), [setSp])
  const efterAendring = useCallback(() => {
    setRefreshKey((k) => k + 1)
    setSp({}, { replace: true })
  }, [setSp])

  return (
    <>
      {/* Farvematches */}
      <div style={{ marginTop: 28 }}>
        <SectionTitle
          right={
            kanMatche ? (
              <button onClick={() => openParams({ ny: 'match' })} className="smu-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}>
                <Plus size={15} /> Opret farvematch
              </button>
            ) : undefined
          }
        >
          Farvematches
        </SectionTitle>
        {relations === null ? (
          <Spinner />
        ) : relations.length === 0 ? (
          <EmptyState icon={Layers} title="Ingen farvematches endnu">
            {kanMatche ? 'Match denne farve med en folie eller en anden farve for at begynde.' : 'En redaktør kan oprette et farvematch.'}
          </EmptyState>
        ) : (
          <div className="smu-card" style={{ overflow: 'hidden' }}>
            {relations.map((r, i) => {
              const href = farveHref(r.modpart)
              return (
                <FarveValgRow
                  key={r.id}
                  valg={r.modpart}
                  border={i > 0}
                  onClick={href ? () => navigate(href) : undefined}
                  right={<StatusBadge status={r.status} />}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Printopskrifter */}
      <div style={{ marginTop: 28 }}>
        <SectionTitle
          right={
            canEdit ? (
              <button onClick={() => openParams({ ny: 'opskrift' })} className="smu-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}>
                <Plus size={15} /> Opret printopskrift
              </button>
            ) : undefined
          }
        >
          Printopskrifter · Canon Colorado
        </SectionTitle>
        {opskrifter === null ? (
          <Spinner />
        ) : opskrifter.length === 0 ? (
          <EmptyState icon={Printer} title="Ingen printopskrifter endnu">
            {canEdit ? 'Registrér hvordan vi rammer denne farve på Canon Colorado.' : 'En redaktør kan oprette en printopskrift.'}
          </EmptyState>
        ) : (
          <div className="smu-card" style={{ overflow: 'hidden' }}>
            {opskrifter.map((o, i) => (
              <PrintopskriftRow key={o.id} o={o} border={i > 0} onClick={() => openParams({ opskrift: o.id })} />
            ))}
          </div>
        )}
      </div>

      {/* ── Drawers ──────────────────────────────────────────────────── */}
      <Drawer open={ny === 'match'} title="Opret farvematch" onClose={closeDrawer}>
        <MatchDrawer fra={farve} onDone={efterAendring} />
      </Drawer>

      <Drawer open={ny === 'opskrift'} title="Opret printopskrift" onClose={closeDrawer}>
        <OpretOpskriftDrawer farve={farve} onDone={efterAendring} />
      </Drawer>

      <Drawer open={Boolean(opskriftId)} title={rediger ? 'Rediger printopskrift' : 'Printopskrift'} onClose={closeDrawer}>
        {opskriftId && (
          <OpskriftDrawer
            id={opskriftId}
            rediger={rediger}
            canEdit={canEdit}
            onRediger={() => openParams({ opskrift: opskriftId, rediger: '1' })}
            onGemt={() => {
              setRefreshKey((k) => k + 1)
              setSp({ opskrift: opskriftId }, { replace: true })
            }}
            onAabnFarve={(href) => {
              closeDrawer()
              navigate(href)
            }}
          />
        )}
      </Drawer>
    </>
  )
}

// ── Opret farvematch ──────────────────────────────────────────────────────
function MatchDrawer({ fra, onDone }: { fra: FarveValg; onDone: () => void }) {
  const store = getStore()
  const { user } = useAuth()
  const [til, setTil] = useState<FarveValg | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const klar = Boolean(til && !(til.kind === fra.kind && til.refId === fra.refId))

  async function gem() {
    if (!til || !user) return
    setSaving(true)
    setError(null)
    try {
      await store.createRelationMellem({ kind: fra.kind, refId: fra.refId }, { kind: til.kind, refId: til.refId }, note.trim() || null, user)
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunne ikke gemme farvematchet.')
      setSaving(false)
    }
  }

  return (
    <div>
      {error && <div style={{ background: 'var(--color-red-soft)', color: 'var(--color-red-deep)', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{error}</div>}

      <SectionTitle>1 · Denne farve</SectionTitle>
      <FarveValgtKort valg={fra} />

      <div style={{ marginTop: 18 }}>
        <SectionTitle>2 · Match med</SectionTitle>
        {til ? <FarveValgtKort valg={til} onRyd={() => setTil(null)} /> : <FarveVaelger onPick={setTil} />}
      </div>

      <div style={{ marginTop: 18 }}>
        <SectionTitle>3 · Note (valgfri)</SectionTitle>
        <textarea className="smu-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Fri note om farvematchet…" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
        <button className="smu-btn-primary" onClick={gem} disabled={!klar || saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Save size={16} /> {saving ? 'Gemmer…' : 'Gem som forslag'}
        </button>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--color-text-muted)' }}>
          <Check size={14} /> Gemmes som forslag — ikke verificeret
        </span>
      </div>
    </div>
  )
}

// ── Opret printopskrift ───────────────────────────────────────────────────
function OpretOpskriftDrawer({ farve, onDone }: { farve: FarveValg; onDone: () => void }) {
  const store = getStore()
  const { user } = useAuth()
  async function gem(input: CreatePrintopskriftInput) {
    if (!user) return
    await store.createPrintopskrift({ kind: farve.kind, refId: farve.refId }, input, user)
    onDone()
  }
  return (
    <OpskriftForm
      maalfarve={farve}
      submitLabel="Gem som forslag"
      savingLabel="Gemmer…"
      statusNote="Gemmes som forslag — ikke verificeret"
      onSubmit={gem}
    />
  )
}

// ── Åbn / rediger printopskrift ───────────────────────────────────────────
function OpskriftDrawer({
  id,
  rediger,
  canEdit,
  onRediger,
  onGemt,
  onAabnFarve,
}: {
  id: string
  rediger: boolean
  canEdit: boolean
  onRediger: () => void
  onGemt: () => void
  onAabnFarve: (href: string) => void
}) {
  const store = getStore()
  const { user } = useAuth()
  const [view, setView] = useState<PrintopskriftView | null | undefined>(undefined)
  const [history, setHistory] = useState<VerificationHistory[]>([])

  useEffect(() => {
    let aktiv = true
    setView(undefined)
    setHistory([])
    store.getPrintopskrift(id).then((v) => aktiv && setView(v))
    store.getPrintopskriftHistorik(id).then((h) => aktiv && setHistory(h))
    return () => {
      aktiv = false
    }
  }, [store, id, rediger])

  if (view === undefined) return <Spinner label="Indlæser printopskrift…" />
  if (view === null) return <div style={{ fontSize: 14, fontWeight: 700 }}>Printopskriften blev ikke fundet.</div>

  const o = view.opskrift
  const farveUrl = farveHref(view.maalfarve)

  async function gem(input: CreatePrintopskriftInput) {
    if (!user) return
    await store.updatePrintopskrift(id, input, user)
    onGemt()
  }

  if (rediger) {
    return (
      <OpskriftForm
        maalfarve={view.maalfarve}
        initial={{
          printer: o.printer, medie: o.medie, laminat: o.laminat, media_group: o.media_group, media_name: o.media_name, ink_setup: o.ink_setup,
          printmode: o.printmode, profil_quickset: o.profil_quickset,
          cmyk_c: o.cmyk_c, cmyk_m: o.cmyk_m, cmyk_y: o.cmyk_y, cmyk_k: o.cmyk_k,
          spot1: o.kanalvaerdier?.Spot1 ?? null, spot2: o.kanalvaerdier?.Spot2 ?? null,
          outputopskrift: o.outputopskrift, note: o.note,
        }}
        submitLabel="Gem ændringer"
        savingLabel="Gemmer…"
        onSubmit={gem}
      />
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <StatusBadge status={o.status} />
        {canEdit && (
          <button onClick={onRediger} className="smu-btn-secondary" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Pencil size={14} /> Rediger
          </button>
        )}
      </div>

      {/* Hvilken farve opskriften tilhører */}
      <div
        className={farveUrl ? 'smu-card smu-clickable' : 'smu-card'}
        onClick={farveUrl ? () => onAabnFarve(farveUrl) : undefined}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, marginBottom: 14, cursor: farveUrl ? 'pointer' : 'default' }}
      >
        <Swatch hex={view.maalfarve.hex} size={44} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--color-text-muted)' }}>Målfarve</div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{view.maalfarve.titel}</div>
        </div>
      </div>

      <OpskriftIndhold view={view} history={history} />
    </div>
  )
}
