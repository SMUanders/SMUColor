import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Layers, Plus } from 'lucide-react'
import { getStore } from '../data'
import { useAuth } from '../context/AuthContext'
import type { FarveValg, RelationView, SourceFolie } from '../lib/types'
import { Swatch } from '../components/Swatch'
import { StatusBadge } from '../components/StatusBadge'
import { FarveValgRow } from '../components/FarveValgRow'
import { EmptyState, ErrorState, SectionTitle, Spinner } from '../components/common'

function folieTitel(f: SourceFolie): string {
  return `${f.producent ?? ''} ${f.serie ?? ''} ${f.kode}`.replace(/\s+/g, ' ').trim()
}

export default function FolieDetail() {
  const { variantId } = useParams<{ variantId: string }>()
  const store = getStore()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEdit = Boolean(user?.erRedaktoer)

  const [folie, setFolie] = useState<SourceFolie | null | undefined>(undefined)
  const [relations, setRelations] = useState<RelationView[] | null>(null)

  useEffect(() => {
    if (!variantId) return
    setFolie(undefined)
    setRelations(null)
    store.getSourceFolie(variantId).then(setFolie)
    store.getRelationsForColor('source', variantId).then(setRelations)
  }, [variantId, store])

  if (folie === undefined) return <Spinner label="Indlæser folie…" />
  if (folie === null)
    return <ErrorState title="Folien blev ikke fundet">Findes ikke i Source, eller kræver login mod det delte projekt (Source-farver vises ikke i lokal dev).</ErrorState>

  const valg: FarveValg = {
    kind: 'source',
    refId: folie.source_variant_id,
    titel: folieTitel(folie),
    undertekst: folie.producent_farvenavn ?? folie.variant_navn,
    hex: folie.digital_srgb,
    vejledende: true,
    aktiv: folie.aktiv,
  }

  function openModpart(v: FarveValg) {
    if (v.kind === 'pantone') navigate(`/farve/${v.refId}`)
    else if (v.kind === 'source') navigate(`/folie/${v.refId}`)
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <Link to="/" className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={15} /> Tilbage til søgning
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{valg.titel}</h1>
        {!folie.aktiv && <span className="smu-badge smu-badge-grey">Udgået</span>}
      </div>
      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 20px' }}>
        Source-folie{folie.farvegruppe ? ` · ${folie.farvegruppe}` : ''}{folie.finish ? ` · ${folie.finish}` : ''}
      </p>

      {/* Farve-kort (ejet af Source, vist via læsekontrakt) */}
      <div className="smu-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16 }}>
        <Swatch hex={folie.digital_srgb} size={64} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>
            {[folie.producent, folie.serie, folie.kode].filter(Boolean).join(' · ')}
          </div>
          {folie.producent_farvenavn && (
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>{folie.producent_farvenavn}</div>
          )}
          {folie.har_digital_farve ? (
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)', marginTop: 4 }}>
              Digital producentfarve (<b>vejledende</b>): sRGB {folie.digital_srgb}
              {folie.digital_lab ? ` · Lab ${folie.digital_lab}` : ''} — ikke fysisk sandhed.
            </div>
          ) : (
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)', marginTop: 4 }}>Ingen digital farveværdi registreret.</div>
          )}
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', marginTop: 6 }}>
            Ejes af SMU Source · vist via læsekontrakt (ikke kopieret)
          </div>
        </div>
      </div>

      {/* Relationer */}
      <div style={{ marginTop: 28 }}>
        <SectionTitle
          right={
            canEdit && folie.aktiv ? (
              <Link to="/relation/ny" state={{ fra: valg }} className="smu-btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}>
                <Plus size={15} /> Opret relation
              </Link>
            ) : undefined
          }
        >
          Relationer
        </SectionTitle>
        {relations === null ? (
          <Spinner />
        ) : relations.length === 0 ? (
          <EmptyState icon={Layers} title="Ingen relationer endnu">
            {canEdit
              ? folie.aktiv
                ? 'Opret en relation til fx en Pantone-reference eller en anden folie.'
                : 'Udgået folie — kan ikke bruges til nye relationer, men eksisterende vises her.'
              : 'En redaktør kan oprette en relation.'}
          </EmptyState>
        ) : (
          <div className="smu-card" style={{ overflow: 'hidden' }}>
            {relations.map((r, i) => (
              <FarveValgRow
                key={r.id}
                valg={r.modpart}
                border={i > 0}
                onClick={r.modpart.kind !== 'lokal' ? () => openModpart(r.modpart) : undefined}
                right={<StatusBadge status={r.status} />}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
