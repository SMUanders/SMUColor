import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Layers, Link2, Plus } from 'lucide-react'
import { getStore } from '../data'
import type { FarveValg, MatchEnriched, ReferenceColor, RelationView } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { ReferenceCard } from '../components/ReferenceCard'
import { MatchCard } from '../components/MatchCard'
import { FarveValgRow } from '../components/FarveValgRow'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState, ErrorState, SectionTitle, Spinner } from '../components/common'
import { STATUS_ORDER } from '../lib/status'

export default function ColorDetail() {
  const { refId } = useParams<{ refId: string }>()
  const store = getStore()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEdit = Boolean(user?.erRedaktoer)

  const [ref, setRef] = useState<ReferenceColor | null | undefined>(undefined)
  const [matches, setMatches] = useState<MatchEnriched[] | null>(null)
  const [relations, setRelations] = useState<RelationView[] | null>(null)

  useEffect(() => {
    if (!refId) return
    setRef(undefined)
    setMatches(null)
    setRelations(null)
    store.getReference(refId).then(setRef)
    store.getMatchesForReference(refId).then(setMatches)
    store.getRelationsForColor('pantone', refId).then(setRelations)
  }, [refId, store])

  if (ref === undefined) return <Spinner label="Indlæser farve…" />
  if (ref === null) return <ErrorState title="Farven blev ikke fundet">Referencen findes ikke i Color Bridge-biblioteket.</ErrorState>

  const sorted = (matches ?? [])
    .slice()
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))

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

      <div style={{ marginTop: 28 }}>
        <SectionTitle
          right={
            canEdit ? (
              <Link
                to="/match/ny"
                state={{ referenceColorId: ref.id, referenceName: ref.pantone_name }}
                className="smu-btn-primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}
              >
                <Plus size={15} /> Opret match
              </Link>
            ) : undefined
          }
        >
          SMU-matches
        </SectionTitle>

        {matches === null ? (
          <Spinner />
        ) : sorted.length === 0 ? (
          <EmptyState icon={Layers} title="Ingen SMU-matches endnu">
            Referencen ovenfor (spot + CP) er ikke det samme som et verificeret match.
            {canEdit ? ' Opret et forslag for at begynde at opbygge Signmeups viden om denne farve.' : ' En redaktør kan oprette et match.'}
          </EmptyState>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {sorted.map((m) => (
              <MatchCard key={m.id} match={m} canEdit={canEdit} />
            ))}
          </div>
        )}
      </div>

      {/* Relationer (V1.2 — palette-neutralt) */}
      <div style={{ marginTop: 28 }}>
        <SectionTitle
          right={
            canEdit ? (
              <Link
                to="/relation/ny"
                state={{ fra: pantoneValg }}
                className="smu-btn-secondary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}
              >
                <Link2 size={15} /> Opret relation
              </Link>
            ) : undefined
          }
        >
          Relationer
        </SectionTitle>
        {relations === null ? (
          <Spinner />
        ) : relations.length === 0 ? (
          <EmptyState icon={Link2} title="Ingen relationer endnu">
            {canEdit ? 'Forbind denne farve med en folie eller en anden farve.' : 'En redaktør kan oprette en relation.'}
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
    </div>
  )
}
