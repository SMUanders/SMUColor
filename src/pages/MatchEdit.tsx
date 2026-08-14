import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, FlaskConical, Save, XCircle } from 'lucide-react'
import { getStore } from '../data'
import { useAuth } from '../context/AuthContext'
import type { Material, MaterialColor, MatchEnriched, MatchStatus, MatchType, ReferenceColor, VerificationHistory } from '../lib/types'
import { Swatch } from '../components/Swatch'
import { StatusBadge } from '../components/StatusBadge'
import { ErrorState, SectionTitle, Spinner } from '../components/common'
import { STATUS_META } from '../lib/status'

const TYPES: { value: MatchType; label: string }[] = [
  { value: 'folie', label: 'Foliematch' },
  { value: 'print', label: 'Printmatch' },
  { value: 'ral', label: 'RAL-match' },
  { value: 'cmyk', label: 'CMYK-match' },
  { value: 'materiale', label: 'Materialematch' },
  { value: 'andet', label: 'Andet' },
]

interface NavState {
  referenceColorId?: string
  referenceName?: string
}

export default function MatchEdit() {
  const { matchId } = useParams<{ matchId: string }>()
  const isNew = !matchId
  const store = getStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const nav = (useLocation().state ?? {}) as NavState

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [existing, setExisting] = useState<MatchEnriched | null>(null)
  const [reference, setReference] = useState<ReferenceColor | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialColors, setMaterialColors] = useState<MaterialColor[]>([])
  const [history, setHistory] = useState<VerificationHistory[]>([])

  // Formfelter
  const [matchType, setMatchType] = useState<MatchType>('folie')
  const [note, setNote] = useState('')
  const [mcMode, setMcMode] = useState<'existing' | 'new'>('existing')
  const [selectedMc, setSelectedMc] = useState<string>('')
  const [mcFilter, setMcFilter] = useState('')
  const [newKode, setNewKode] = useState('')
  const [newNavn, setNewNavn] = useState('')
  const [newRal, setNewRal] = useState('')
  const [newMaterialId, setNewMaterialId] = useState('')

  // Produktion
  const [prod, setProd] = useState({ printer: 'Canon Colorado M-series', medie: '', mediegruppe: '', printmode: '', profil: '', quick_set: '', outputopskrift: '', note: '' })

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const [mats, mcs] = await Promise.all([store.listMaterials(), store.listMaterialColors()])
      if (!active) return
      setMaterials(mats)
      setMaterialColors(mcs)

      if (isNew) {
        const refId = nav.referenceColorId
        if (refId) setReference(await store.getReference(refId))
        setLoading(false)
        return
      }
      const m = await store.getMatch(matchId!)
      if (!active) return
      if (!m) { setError('Match ikke fundet'); setLoading(false); return }
      setExisting(m)
      setReference(m.reference_color_id ? await store.getReference(m.reference_color_id) : null)
      setMatchType(m.match_type)
      setNote(m.note ?? '')
      setSelectedMc(m.material_color_id ?? '')
      if (m.production) {
        setProd({
          printer: m.production.printer ?? 'Canon Colorado M-series',
          medie: m.production.medie ?? '',
          mediegruppe: m.production.mediegruppe ?? '',
          printmode: m.production.printmode ?? '',
          profil: m.production.profil ?? '',
          quick_set: m.production.quick_set ?? '',
          outputopskrift: m.production.outputopskrift ?? '',
          note: m.production.note ?? '',
        })
      }
      setHistory(await store.getVerificationHistory(matchId!))
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [matchId, isNew, store, nav.referenceColorId])

  const filteredMc = useMemo(() => {
    const f = mcFilter.trim().toLowerCase()
    const list = materialColors
    if (!f) return list.slice(0, 30)
    return list
      .filter((c) => `${c.kode} ${c.navn ?? ''} ${c.ral_kode ?? ''}`.toLowerCase().includes(f))
      .slice(0, 30)
  }, [materialColors, mcFilter])

  const materialName = (id: string | null) => materials.find((m) => m.id === id)?.navn ?? ''

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      let materialColorId: string | null = mcMode === 'existing' ? selectedMc || null : null

      if (mcMode === 'new') {
        if (!newKode.trim()) throw new Error('Angiv en kode for materialefarven.')
        const created = await store.createMaterialColor(
          { material_id: newMaterialId || null, kode: newKode.trim(), navn: newNavn.trim() || null, ral_kode: newRal.trim() || null },
          user,
        )
        materialColorId = created.id
      }

      const prodFilled = prod.medie || prod.printmode || prod.profil || prod.quick_set || prod.outputopskrift || prod.mediegruppe || prod.note

      if (isNew) {
        if (!reference && !materialColorId) throw new Error('Vælg en reference eller en materialefarve.')
        const created = await store.createMatch(
          { reference_color_id: reference?.id ?? null, material_color_id: materialColorId, match_type: matchType, note: note.trim() || null },
          user,
        )
        if (prodFilled) await store.upsertProduction(created.id, prod, user)
        navigate(`/match/${created.id}`, { replace: true })
      } else {
        await store.updateMatch(matchId!, { match_type: matchType, note: note.trim() || null, material_color_id: materialColorId }, user)
        if (prodFilled) await store.upsertProduction(matchId!, prod, user)
        const m = await store.getMatch(matchId!)
        setExisting(m)
        setHistory(await store.getVerificationHistory(matchId!))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunne ikke gemme.')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatus(status: MatchStatus, metode?: string, kommentar?: string) {
    if (!user || !matchId) return
    setSaving(true)
    try {
      await store.setStatus(matchId, { status, metode: metode ?? null, kommentar: kommentar ?? null }, user)
      const m = await store.getMatch(matchId)
      setExisting(m)
      setHistory(await store.getVerificationHistory(matchId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunne ikke skifte status.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Indlæser…" />
  if (error && !existing && isNew && !reference) return <ErrorState title="Fejl">{error}</ErrorState>

  const backHref = reference ? `/farve/${reference.id}` : '/'

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link to={backHref} className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={15} /> Tilbage
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{isNew ? 'Opret match' : 'Rediger match'}</h1>
        {existing && <StatusBadge status={existing.status} />}
      </div>

      {/* Reference-kontekst */}
      {reference && (
        <div className="smu-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, marginBottom: 18 }}>
          <Swatch hex={reference.hex} size={44} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--color-text-muted)' }}>Reference</div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{reference.pantone_name}</div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--color-red-soft)', color: 'var(--color-red-deep)', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Match-detaljer */}
      <section style={{ marginBottom: 24 }}>
        <SectionTitle>Match</SectionTitle>
        <div className="smu-card" style={{ padding: 16, display: 'grid', gap: 16 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select className="smu-input" value={matchType} onChange={(e) => setMatchType(e.target.value as MatchType)}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Materialefarve</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button type="button" className={mcMode === 'existing' ? 'smu-btn-primary' : 'smu-btn-secondary'} onClick={() => setMcMode('existing')} style={{ fontSize: 13 }}>Vælg eksisterende</button>
              <button type="button" className={mcMode === 'new' ? 'smu-btn-primary' : 'smu-btn-secondary'} onClick={() => setMcMode('new')} style={{ fontSize: 13 }}>Opret ny</button>
            </div>

            {mcMode === 'existing' ? (
              <div>
                <input className="smu-input" placeholder="Filtrér — fx 751-031 eller red" value={mcFilter} onChange={(e) => setMcFilter(e.target.value)} style={{ marginBottom: 8 }} />
                <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
                  {filteredMc.length === 0 && <div style={{ padding: 12, fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>Ingen materialefarver matcher.</div>}
                  {filteredMc.map((c) => (
                    <label key={c.id} className="smu-clickable" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer', borderTop: '1px solid var(--color-border-soft)' }}>
                      <input type="radio" name="mc" checked={selectedMc === c.id} onChange={() => setSelectedMc(c.id)} />
                      <span style={{ fontWeight: 800, fontSize: 13 }}>{materialName(c.material_id)} {c.kode}</span>
                      {c.navn && <span style={{ fontSize: 12.5, color: 'var(--color-text-muted)', fontWeight: 600 }}>{c.navn}</span>}
                      {c.ral_kode && <span className="smu-badge smu-badge-grey" style={{ marginLeft: 'auto' }}>RAL {c.ral_kode}</span>}
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                <div>
                  <label style={subLabelStyle}>Materialefamilie</label>
                  <select className="smu-input" value={newMaterialId} onChange={(e) => setNewMaterialId(e.target.value)}>
                    <option value="">— vælg —</option>
                    {materials.map((m) => <option key={m.id} value={m.id}>{m.navn}</option>)}
                  </select>
                </div>
                <div>
                  <label style={subLabelStyle}>Kode *</label>
                  <input className="smu-input" value={newKode} onChange={(e) => setNewKode(e.target.value)} placeholder="fx 751-031" />
                </div>
                <div>
                  <label style={subLabelStyle}>Navn</label>
                  <input className="smu-input" value={newNavn} onChange={(e) => setNewNavn(e.target.value)} placeholder="fx red" />
                </div>
                <div>
                  <label style={subLabelStyle}>RAL</label>
                  <input className="smu-input" value={newRal} onChange={(e) => setNewRal(e.target.value)} placeholder="fx 3020" />
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={labelStyle}>Note</label>
            <textarea className="smu-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Fri note om matchet…" />
          </div>
        </div>
      </section>

      {/* Produktionskontekst */}
      <section style={{ marginBottom: 24 }}>
        <SectionTitle>Produktion (Canon Colorado M-series / ONYX)</SectionTitle>
        <div className="smu-card" style={{ padding: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Field label="Printer" value={prod.printer} onChange={(v) => setProd({ ...prod, printer: v })} />
          <Field label="Mediegruppe" value={prod.mediegruppe} onChange={(v) => setProd({ ...prod, mediegruppe: v })} />
          <Field label="Medie" value={prod.medie} onChange={(v) => setProd({ ...prod, medie: v })} />
          <Field label="Printmode" value={prod.printmode} onChange={(v) => setProd({ ...prod, printmode: v })} />
          <Field label="Profil" value={prod.profil} onChange={(v) => setProd({ ...prod, profil: v })} />
          <Field label="Quick Set" value={prod.quick_set} onChange={(v) => setProd({ ...prod, quick_set: v })} />
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Outputopskrift</label>
            <textarea className="smu-input" value={prod.outputopskrift} onChange={(e) => setProd({ ...prod, outputopskrift: e.target.value })} placeholder="Faktisk outputopskrift / kanalværdier…" />
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
        <button className="smu-btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Save size={16} /> {saving ? 'Gemmer…' : isNew ? 'Opret forslag' : 'Gem ændringer'}
        </button>
        <Link to={backHref} className="smu-btn-secondary" style={{ textDecoration: 'none' }}>Annullér</Link>
      </div>

      {/* Verifikationspanel (kun ved eksisterende match) */}
      {existing && <VerifyPanel match={existing} history={history} saving={saving} onStatus={handleStatus} />}
    </div>
  )
}

function VerifyPanel({
  match,
  history,
  saving,
  onStatus,
}: {
  match: MatchEnriched
  history: VerificationHistory[]
  saving: boolean
  onStatus: (status: MatchStatus, metode?: string, kommentar?: string) => void
}) {
  const [metode, setMetode] = useState('')
  const [kommentar, setKommentar] = useState('')
  const [rejectComment, setRejectComment] = useState('')

  return (
    <section style={{ marginBottom: 32 }}>
      <SectionTitle>Verifikation</SectionTitle>
      <div className="smu-card" style={{ padding: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 14px' }}>
          Verifikation er en faglig Signmeup-handling. Bruger og dato gemmes automatisk. Et forslag bliver først til
          Signmeup-viden, når et menneske verificerer det.
        </p>

        {/* Under test */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          <button
            className="smu-btn-secondary"
            disabled={saving || match.status === 'under_test'}
            onClick={() => onStatus('under_test')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <FlaskConical size={15} /> Marker under test
          </button>
          {match.status !== 'forslag' && (
            <button className="smu-btn-secondary" disabled={saving} onClick={() => onStatus('forslag')}>
              Tilbage til forslag
            </button>
          )}
        </div>

        {/* Verificér */}
        <div style={{ background: 'var(--color-teal-soft)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--color-teal-deep)', marginBottom: 10 }}>Verificér match</div>
          <label style={subLabelStyle}>Metode / kilde</label>
          <input className="smu-input" value={metode} onChange={(e) => setMetode(e.target.value)} placeholder="fx godkendt mod fysisk Color Bridge-guide" style={{ marginBottom: 10 }} />
          <label style={subLabelStyle}>Kommentar</label>
          <textarea className="smu-input" value={kommentar} onChange={(e) => setKommentar(e.target.value)} placeholder="fx Godkendt mod fysisk reference." style={{ marginBottom: 12 }} />
          <button
            className="smu-btn-primary"
            disabled={saving}
            onClick={() => onStatus('verificeret', metode.trim() || undefined, kommentar.trim() || undefined)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--color-teal)' }}
          >
            <CheckCircle2 size={16} /> Verificér
          </button>
        </div>

        {/* Afvis */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10 }}>Afvis match</div>
          <label style={subLabelStyle}>Årsag</label>
          <input className="smu-input" value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} placeholder="Hvorfor afvises matchet?" style={{ marginBottom: 12 }} />
          <button
            className="smu-btn-secondary"
            disabled={saving || match.status === 'afvist'}
            onClick={() => onStatus('afvist', undefined, rejectComment.trim() || undefined)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-red-deep)', borderColor: 'var(--color-red-soft)' }}
          >
            <XCircle size={15} /> Afvis
          </button>
        </div>

        {/* Historik */}
        {history.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--color-text-muted)', marginBottom: 8 }}>Historik</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {history.map((h) => (
                <div key={h.id} style={{ display: 'flex', gap: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  <span style={{ minWidth: 130, color: 'var(--color-text)' }}>
                    {new Date(h.created_at).toLocaleString('da-DK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>
                    <b style={{ color: 'var(--color-text)' }}>{handlingLabel(h)}</b>
                    {h.til_status && ` → ${STATUS_META[h.til_status].label}`} · {h.udfoert_af_navn ?? 'ukendt'}
                    {h.kommentar && ` · ${h.kommentar}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function handlingLabel(h: VerificationHistory): string {
  switch (h.handling) {
    case 'oprettet': return 'Oprettet'
    case 'verificeret': return 'Verificeret'
    case 'afvist': return 'Afvist'
    case 'status_skiftet': return 'Status skiftet'
    case 'opdateret': return 'Opdateret'
    default: return h.handling
  }
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 6 }
const subLabelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: 5 }

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input className="smu-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
