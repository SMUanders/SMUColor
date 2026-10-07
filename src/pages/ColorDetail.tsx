import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Layers, Plus } from 'lucide-react'
import { getStore } from '../data'
import type { FarveValg, ReferenceColor, RelationView } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { ReferenceCard } from '../components/ReferenceCard'
import { FarveValgRow } from '../components/FarveValgRow'
import { PrintopskriftSektion } from '../components/PrintopskriftSektion'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState, ErrorState, SectionTitle, Spinner } from '../components/common'

export default function ColorDetail() {
  const { refId } = useParams<{ refId: string }>()
  const store = getStore()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEdit = Boolean(user?.erRedaktoer)

  const [ref, setRef] = useState<ReferenceColor | null | undefined>(undefined)
  const [relations, setRelations] = useState<RelationView[] | null>(null)

  useEffect(() => {
    if (!refId) return
    setRef(undefined)
    setRelations(null)
    store.getReference(refId).then(setRef)
    store.getRelationsForColor('pantone', refId).then(setRelations)
  }, [refId, store])

  if (ref === undefined) return <Spinner label="Indlæser farve…" />
  if (ref === null) return <ErrorState title="Farven blev ikke fundet">Referencen findes ikke i Color Bridge-biblioteket.</ErrorState>

  const pantoneValg: FarveValg = {
    kind: 'pantone',
    refId: ref.id,
    titel: ref.pantone_name,
    undertekst: ref.cp_name,
    hex: ref.hex,
    vejledende: false,
    aktiv: true,
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <Link to="/" className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={15} /> Tilbage til søgning
      </Link>

      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px' }}>{ref.pantone_name}</h1>
      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 20px' }}>
        Spotfarve · Coated{ref.cp_name ? ` · CMYK-reference: ${ref.cp_name}` : ''}
      </p>

      <ReferenceCard color={ref} />

      {/* Farvematches (palette-neutralt) */}
      <div style={{ marginTop: 28 }}>
        <SectionTitle
          right={
            canEdit ? (
              <Link
                to="/relation/ny"
                state={{ fra: pantoneValg }}
                className="smu-btn-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}
              >
                <Plus size={15} /> Opret farvematch
              </Link>
            ) : undefined
          }
        >
          Farvematches
        </SectionTitle>
        {relations === null ? (
          <Spinner />
        ) : relations.length === 0 ? (
          <EmptyState icon={Layers} title="Ingen farvematches endnu">
            Referencen ovenfor (spot + CP) er ikke det samme som et verificeret match.
            {canEdit ? ' Match denne farve med en folie eller en anden farve for at begynde.' : ' En redaktør kan oprette et farvematch.'}
          </EmptyState>
        ) : (
          <div className="smu-card" style={{ overflow: 'hidden' }}>
            {relations.map((r, i) => (
              <FarveValgRow
                key={r.id}
                valg={r.modpart}
                border={i > 0}
                onClick={
                  r.modpart.kind === 'pantone'
                    ? () => navigate(`/farve/${r.modpart.refId}`)
                    : r.modpart.kind === 'source'
                      ? () => navigate(`/folie/${r.modpart.refId}`)
                      : undefined
                }
                right={<StatusBadge status={r.status} />}
              />
            ))}
          </div>
        )}
      </div>

      <PrintopskriftSektion farve={pantoneValg} canEdit={canEdit} />
    </div>
  )
}
