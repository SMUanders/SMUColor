import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, RotateCcw, Save, XCircle } from 'lucide-react'
import { getStore } from '../data'
import { useAuth } from '../context/AuthContext'
import type { Observation, ObservationStatus } from '../lib/types'
import { ErrorState, SectionTitle, Spinner } from '../components/common'
import { OBS_STATUS_META } from '../lib/observationStatus'

// Rå transskriptionsfelter (redigerbare). Originaltekst rettes her — normalisering
// er et review-resultat, ikke en overskrivning af andre lag.
const RAW_FIELDS: { key: keyof Observation; label: string }[] = [
  { key: 'pantone_as_written', label: 'Pantone (som skrevet)' },
  { key: 'internal_code_as_written', label: 'Intern kode (som skrevet)' },
  { key: 'numeric_string_as_written', label: 'Trykte/etiket-tal (som skrevet)' },
  { key: 'handwritten_as_written', label: 'Håndskrevet (rå — ikke tolket)' },
  { key: 'color_name_as_written', label: 'Farvenavn (som skrevet)' },
  { key: 'printer_as_written', label: 'Printer (som skrevet)' },
  { key: 'media_group_as_written', label: 'Mediegruppe (som skrevet)' },
  { key: 'material_as_written', label: 'Materiale (som skrevet)' },
  { key: 'profile_or_print_mode_as_written', label: 'Profil/printmode (som skrevet)' },
  { key: 'physical_material_as_written', label: 'Fysisk materiale (som skrevet)' },
  { key: 'result_marking_as_written', label: 'Resultatmarkering (som skrevet)' },
  { key: 'assessment_signal_as_written', label: 'Vurderingssignal (rå, fx flueben)' },
  { key: 'sample_type', label: 'Prøvetype' },
  { key: 'transcription_notes', label: 'Transskriptionsnoter / advarsler' },
]

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: 5 }

export default function ObservationReview() {
  const { obsId } = useParams<{ obsId: string }>()
  const store = getStore()
  const { user } = useAuth()

  const [obs, setObs] = useState<Observation | null | undefined>(undefined)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [reviewNotes, setReviewNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!obsId) return
    store.getObservation(obsId).then((o) => {
      setObs(o)
      if (o) {
        const f: Record<string, string> = {}
        for (const { key } of RAW_FIELDS) f[key as string] = (o[key] as string | null) ?? ''
        setFields(f)
        setReviewNotes(o.review_notes ?? '')
      }
    })
  }, [obsId, store])

  if (obs === undefined) return <Spinner label="Indlæser observation…" />
  if (obs === null) return <ErrorState title="Observationen blev ikke fundet" />

  async function apply(patch: Partial<Observation>, note: string) {
    if (!user || !obsId) return
    setSaving(true)
    setMsg(null)
    try {
      const updated = await store.updateObservation(obsId, patch, user)
      setObs(updated)
      setMsg(note)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Kunne ikke gemme.')
    } finally {
      setSaving(false)
    }
  }

  const saveTranscription = () => apply({ ...(fields as Partial<Observation>), review_notes: reviewNotes }, 'Transskription gemt.')
  const setStatus = (status: ObservationStatus, decision: string, note: string) =>
    apply({ status, review_decision: decision, review_notes: reviewNotes }, note)

  const meta = OBS_STATUS_META[obs.status]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link to="/observationer" className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={15} /> Tilbage til observationer
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{obs.obs_kode ?? 'Observation'}</h1>
        <span className={`smu-badge ${meta.badgeClass}`}>{meta.label}</span>
      </div>
      <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 18px' }}>
        Historisk observation — bliver aldrig automatisk et verificeret match. Godkendelse gør den til et forslag i matchlaget.
      </p>

      {/* Provenance (read-only) */}
      <section style={{ marginBottom: 20 }}>
        <SectionTitle>Kilde</SectionTitle>
        <div className="smu-card" style={{ padding: 16, display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 }}>
          <Row label="Fil" value={obs.source_file} />
          <Row label="Side" value={obs.source_page} />
          <Row label="Placering" value={obs.source_location} />
          <Row label="Dokumenttype" value={obs.document_type} />
          <Row label="Jobkontekst" value={obs.job_context} />
          <Row label="Prøve til stede" value={obs.sample_present ? 'Ja' : 'Nej'} />
          <Row label="AI-sikkerhed (per aspekt)" value={obs.confidence_notes ?? (obs.confidence != null ? `${Math.round(obs.confidence * 100)}%` : '—')} />
        </div>
      </section>

      {/* Rå transskription (redigerbar) */}
      <section style={{ marginBottom: 20 }}>
        <SectionTitle>Rå transskription (ret hvis nødvendigt)</SectionTitle>
        <div className="smu-card" style={{ padding: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {RAW_FIELDS.map(({ key, label }) => (
            <div key={key as string} style={key === 'transcription_notes' ? { gridColumn: '1 / -1' } : undefined}>
              <label style={labelStyle}>{label}</label>
              <input
                className="smu-input"
                value={fields[key as string] ?? ''}
                onChange={(e) => setFields({ ...fields, [key as string]: e.target.value })}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Review */}
      <section style={{ marginBottom: 24 }}>
        <SectionTitle>Gennemgang</SectionTitle>
        <div className="smu-card" style={{ padding: 16 }}>
          <label style={labelStyle}>Review-note</label>
          <textarea className="smu-input" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Fx: pantone antaget som 186 C, prøve mangler…" style={{ marginBottom: 14 }} />

          {msg && (
            <div style={{ background: 'var(--color-teal-soft)', color: 'var(--color-teal-deep)', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
              {msg}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="smu-btn-secondary" disabled={saving} onClick={saveTranscription} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Save size={15} /> Gem transskription
            </button>
            <button className="smu-btn-secondary" disabled={saving || obs.status === 'TIL_GENNEMGANG'} onClick={() => setStatus('TIL_GENNEMGANG', 'sat til gennemgang', 'Sat til gennemgang.')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw size={15} /> Til gennemgang
            </button>
            <button className="smu-btn-primary" disabled={saving} onClick={() => setStatus('GODKENDT_SOM_FORSLAG', 'godkendt som forslag', 'Godkendt som forslag.')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--color-teal)' }}>
              <CheckCircle2 size={16} /> Godkend som forslag
            </button>
            <button className="smu-btn-secondary" disabled={saving || obs.status === 'AFVIST'} onClick={() => setStatus('AFVIST', 'afvist', 'Afvist.')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-red-deep)', borderColor: 'var(--color-red-soft)' }}>
              <XCircle size={15} /> Afvis
            </button>
          </div>
          {obs.reviewer && (
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginTop: 12 }}>
              Senest gennemgået af {obs.reviewer}{obs.review_decision ? ` · ${obs.review_decision}` : ''}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <span style={{ color: 'var(--color-text-muted)', minWidth: 120 }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value || '—'}</span>
    </div>
  )
}
