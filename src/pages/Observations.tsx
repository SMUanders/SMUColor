import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileSearch } from 'lucide-react'
import { getStore } from '../data'
import type { Observation } from '../lib/types'
import { EmptyState, SectionTitle, Spinner } from '../components/common'
import { OBS_STATUS_META, OBS_STATUS_ORDER } from '../lib/observationStatus'

/**
 * Historiske observationer — provenance/review-lag. Adskilt fra reference/
 * materiale/match. En redaktør gennemgår rå transskriptioner og godkender som
 * forslag eller afviser. Aldrig automatisk verificeret.
 */
export default function Observations() {
  const store = getStore()
  const [obs, setObs] = useState<Observation[] | null>(null)

  useEffect(() => {
    store.listObservations().then(setObs)
  }, [store])

  if (obs === null) return <Spinner label="Indlæser observationer…" />

  const ordered = obs
    .slice()
    .sort((a, b) => OBS_STATUS_ORDER.indexOf(a.status) - OBS_STATUS_ORDER.indexOf(b.status) || (a.obs_kode ?? '').localeCompare(b.obs_kode ?? ''))

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Historiske observationer</h1>
      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 20px' }}>
        Rå transskriptioner fra historiske produktionsark. Provenance-lag — ikke reference, match eller verificeret
        produktion. Godkend som forslag eller afvis; normalisering er altid et review-resultat.
      </p>

      {ordered.length === 0 ? (
        <EmptyState icon={FileSearch} title="Ingen observationer">
          Der er endnu ikke ekstraheret historiske observationer.
        </EmptyState>
      ) : (
        <section>
          <SectionTitle>{ordered.length} observationer</SectionTitle>
          <div className="smu-card" style={{ overflow: 'hidden' }}>
            {ordered.map((o, i) => {
              const meta = OBS_STATUS_META[o.status]
              return (
                <Link
                  key={o.id}
                  to={`/observationer/${o.id}`}
                  className="smu-clickable"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textDecoration: 'none', color: 'inherit', borderTop: i ? '1px solid var(--color-border-soft)' : undefined }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>
                      {o.obs_kode ?? 'Observation'}
                      {o.job_context && <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}> · {o.job_context}</span>}
                      {o.pantone_as_written && <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}> · {o.pantone_as_written}</span>}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      {o.source_file}{o.source_page ? ` · s. ${o.source_page}` : ''}
                      {o.printer_as_written && ` · ${o.printer_as_written}`}
                    </div>
                  </div>
                  <span className={`smu-badge ${meta.badgeClass}`}>{meta.label}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
