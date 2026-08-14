import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Layers, Plus } from 'lucide-react'
import { getStore } from '../data'
import type { MatchEnriched, ReferenceColor } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { ReferenceCard } from '../components/ReferenceCard'
import { MatchCard } from '../components/MatchCard'
import { EmptyState, ErrorState, SectionTitle, Spinner } from '../components/common'
import { STATUS_ORDER } from '../lib/status'

export default function ColorDetail() {
  const { refId } = useParams<{ refId: string }>()
  const store = getStore()
  const { user } = useAuth()
  const canEdit = Boolean(user?.erRedaktoer)

  const [ref, setRef] = useState<ReferenceColor | null | undefined>(undefined)
  const [matches, setMatches] = useState<MatchEnriched[] | null>(null)

  useEffect(() => {
    if (!refId) return
    setRef(undefined)
    setMatches(null)
    store.getReference(refId).then(setRef)
    store.getMatchesForReference(refId).then(setMatches)
  }, [refId, store])

  if (ref === undefined) return <Spinner label="Indlæser farve…" />
  if (ref === null) return <ErrorState title="Farven blev ikke fundet">Referencen findes ikke i Color Bridge-biblioteket.</ErrorState>

  const sorted = (matches ?? [])
    .slice()
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))

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
    </div>
  )
}
