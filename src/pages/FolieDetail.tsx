import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Layers, Plus } from 'lucide-react'
import { getStore } from '../data'
import { useAuth } from '../context/AuthContext'
import type { FarveValg, RelationView, SourceFolie } from '../lib/types'
import { Swatch } from '../components/Swatch'
import { StatusBadge } from '../components/StatusBadge'
import { FarveValgRow } from '../components/FarveValgRow'
import { PrintopskriftSektion } from '../components/PrintopskriftSektion'
import { folieToValg } from '../lib/folie'
import { farveHref } from '../lib/nav'
import { EmptyState, ErrorState, SectionTitle, Spinner } from '../components/common'

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

  const valg: FarveValg = folieToValg(folie)

  function openModpart(v: FarveValg) {
    const href = farveHref(v)
    if (href) navigate(href)
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <Link to="/" className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={15} /> Tilbage til søgning
      </Link>

      {/* Stor, tydelig farveidentitet */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 6 }}>
        <Swatch hex={folie.digital_srgb} size={72} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{valg.titel}</h1>
            {!folie.aktiv && <span className="smu-badge smu-badge-grey">Udgået</span>}
          </div>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            {[folie.producent ? `Producent: ${folie.producent}` : null, folie.farvegruppe, folie.finish].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {/* Digital farveværdi — tydeligt vejledende */}
      <div className="smu-card" style={{ padding: '12px 16px', marginTop: 16 }}>
        {folie.har_digital_farve ? (
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)' }}>
            Digital producentfarve (<b>vejledende</b>): sRGB {folie.digital_srgb}
            {folie.digital_lab ? ` · Lab ${folie.digital_lab}` : ''} — ikke fysisk sandhed.
          </div>
        ) : (
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)' }}>Ingen digital farveværdi registreret.</div>
        )}
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', marginTop: 6 }}>
          Ejes af SMU Source · vist via læsekontrakt (ikke kopieret)
        </div>
      </div>

      {/* Farvematches */}
      <div style={{ marginTop: 28 }}>
        <SectionTitle
          right={
            canEdit && folie.aktiv ? (
              <Link to="/relation/ny" state={{ fra: valg }} className="smu-btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}>
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
            {canEdit
              ? folie.aktiv
                ? 'Match denne folie med fx en Pantone-reference eller en anden folie.'
                : 'Udgået folie — kan ikke bruges til nye farvematches, men eksisterende vises her.'
              : 'En redaktør kan oprette et farvematch.'}
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

      <PrintopskriftSektion farve={valg} canEdit={canEdit} />
    </div>
  )
}
