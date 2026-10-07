import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Palette } from 'lucide-react'
import { getStore } from '../data'
import type { SourceFolie } from '../lib/types'
import { EmptyState, Spinner } from '../components/common'

export default function PaletteSerie() {
  const { serie } = useParams<{ serie: string }>()
  const store = getStore()
  const navigate = useNavigate()
  const [varianter, setVarianter] = useState<SourceFolie[] | null>(null)

  useEffect(() => {
    if (!serie) return
    setVarianter(null)
    store.listSerieVarianter(serie).then(setVarianter)
  }, [serie, store])

  const brand = varianter?.[0]?.produkt_navn?.split(/\s+/)[0] ?? ''
  const producent = varianter?.[0]?.producent ?? null

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      <Link to="/" className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={15} /> Tilbage
      </Link>

      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 2px' }}>{[brand, serie].filter(Boolean).join(' ') || serie}</h1>
      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 20px' }}>
        {producent ? `Producent: ${producent} · ` : ''}
        {varianter ? `${varianter.length} farver` : ''}
      </p>

      {varianter === null ? (
        <Spinner label="Indlæser palette…" />
      ) : varianter.length === 0 ? (
        <EmptyState icon={Palette} title={`Ingen farver i ${serie}`}>
          Kræver login mod det delte projekt (Source-farver vises ikke i lokal dev).
        </EmptyState>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
          {varianter.map((v) => (
            <button
              key={v.source_variant_id}
              onClick={() => navigate(`/folie/${v.source_variant_id}`)}
              className="smu-card smu-clickable"
              style={{ padding: 10, textAlign: 'left', cursor: 'pointer', background: 'var(--color-surface)' }}
            >
              <div
                style={{
                  height: 64,
                  borderRadius: 8,
                  background: v.digital_srgb || 'var(--color-grey-soft)',
                  border: '1px solid var(--color-border)',
                  marginBottom: 8,
                  display: 'grid',
                  placeItems: 'center',
                }}
                aria-label={v.digital_srgb ? `Farveprøve ${v.kode}` : 'Ingen digital farve'}
              >
                {!v.har_digital_farve && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)' }}>ingen farve</span>}
              </div>
              <div style={{ fontWeight: 800, fontSize: 13 }}>{v.kode}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {v.producent_farvenavn ?? v.variant_navn ?? ''}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
