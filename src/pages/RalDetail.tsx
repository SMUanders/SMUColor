import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Layers, Plus } from 'lucide-react'
import { getStore } from '../data'
import type { FarveValg, ReferenceFarve, RelationView } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { Swatch } from '../components/Swatch'
import { FarveValgRow } from '../components/FarveValgRow'
import { PrintopskriftSektion } from '../components/PrintopskriftSektion'
import { StatusBadge } from '../components/StatusBadge'
import { farveHref } from '../lib/nav'
import { EmptyState, ErrorState, SectionTitle, Spinner } from '../components/common'

export default function RalDetail() {
  const { refId } = useParams<{ refId: string }>()
  const store = getStore()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEdit = Boolean(user?.erRedaktoer)

  const [farve, setFarve] = useState<ReferenceFarve | null | undefined>(undefined)
  const [relations, setRelations] = useState<RelationView[] | null>(null)

  useEffect(() => {
    if (!refId) return
    setFarve(undefined)
    setRelations(null)
    store.getRalFarve(refId).then(setFarve)
    store.getRelationsForColor('ral', refId).then(setRelations)
  }, [refId, store])

  if (farve === undefined) return <Spinner label="Indlæser farve…" />
  if (farve === null) return <ErrorState title="Farven blev ikke fundet">Referencefarven findes ikke i biblioteket.</ErrorState>

  const valg: FarveValg = {
    kind: 'ral',
    refId: farve.id,
    titel: farve.navn,
    undertekst: farve.bibliotek_navn,
    hex: farve.hex,
    vejledende: true,
    aktiv: true,
  }

  const kildeLinje = [farve.kilde, farve.kilde_version].filter(Boolean).join(' · ')

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <Link to="/" className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={15} /> Tilbage til søgning
      </Link>

      <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px' }}>{farve.navn}</h1>
      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 20px' }}>
        Referencefarve · {farve.bibliotek_navn}
      </p>

      {/* Identitetskort — digital farve er VEJLEDENDE, ikke fysisk sandhed. */}
      <div className="smu-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16 }}>
        <Swatch hex={farve.hex} size={72} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>RAL {farve.kode}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {farve.hex ? `Vejledende digital farve ${farve.hex} — ikke et verificeret fysisk match` : 'Ingen digital farve registreret'}
          </div>
          {kildeLinje && (
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginTop: 4 }}>
              Kilde: {kildeLinje}
            </div>
          )}
        </div>
      </div>

      {/* Farvematches (palette-neutralt) */}
      <div style={{ marginTop: 28 }}>
        <SectionTitle
          right={
            canEdit ? (
              <Link
                to="/relation/ny"
                state={{ fra: valg }}
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
            RAL-koden ovenfor er en reference.
            {canEdit ? ' Match den med en folie eller en anden farve for at begynde.' : ' En redaktør kan oprette et farvematch.'}
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

      <PrintopskriftSektion farve={valg} canEdit={canEdit} />
    </div>
  )
}
