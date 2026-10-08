import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { getStore } from '../data'
import { useAuth } from '../context/AuthContext'
import type { PrintopskriftView, VerificationHistory } from '../lib/types'
import { Swatch } from '../components/Swatch'
import { StatusBadge } from '../components/StatusBadge'
import { OpskriftIndhold } from '../components/OpskriftIndhold'
import { farveHref } from '../lib/nav'
import { ErrorState, Spinner } from '../components/common'
import { STATUS_META } from '../lib/status'

export default function OpskriftDetail() {
  const { id } = useParams<{ id: string }>()
  const store = getStore()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEdit = Boolean(user?.erRedaktoer)

  const [view, setView] = useState<PrintopskriftView | null | undefined>(undefined)
  const [history, setHistory] = useState<VerificationHistory[]>([])

  useEffect(() => {
    if (!id) return
    setView(undefined)
    setHistory([])
    store.getPrintopskrift(id).then(setView)
    store.getPrintopskriftHistorik(id).then(setHistory)
  }, [id, store])

  if (view === undefined) return <Spinner label="Indlæser printopskrift…" />
  if (view === null || !id) return <ErrorState title="Printopskriften blev ikke fundet" />

  const o = view.opskrift
  const farve = view.maalfarve
  const farveUrl = farveHref(farve)
  const meta = STATUS_META[o.status]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link to={farveUrl ?? '/'} className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={15} /> Tilbage til farven
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Printopskrift</h1>
        <StatusBadge status={o.status} />
        {canEdit && (
          <Link to={`/opskrift/${o.id}/rediger`} className="smu-btn-secondary" style={{ marginLeft: 'auto', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Pencil size={14} /> Rediger
          </Link>
        )}
      </div>

      {meta.hint && (
        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 16px' }}>{meta.hint}</p>
      )}

      {/* Hvilken farve opskriften tilhører */}
      <div
        className={farveUrl ? 'smu-card smu-clickable' : 'smu-card'}
        onClick={farveUrl ? () => navigate(farveUrl) : undefined}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, marginBottom: 14, cursor: farveUrl ? 'pointer' : 'default' }}
      >
        <Swatch hex={farve.hex} size={44} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--color-text-muted)' }}>Målfarve</div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{farve.titel}</div>
        </div>
      </div>

      <OpskriftIndhold view={view} history={history} />
    </div>
  )
}
