import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getStore } from '../data'
import { useAuth } from '../context/AuthContext'
import type { CreatePrintopskriftInput, FarveValg } from '../lib/types'
import { OpskriftForm } from '../components/OpskriftForm'
import { farveHref } from '../lib/nav'
import { ErrorState } from '../components/common'

export default function OpskriftNy() {
  const store = getStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const farve = (useLocation().state ?? {}) as { farve?: FarveValg }
  const maalfarve = farve.farve

  if (!maalfarve) {
    return (
      <ErrorState title="Ingen målfarve valgt">
        Åbn en farve og brug “Opret printopskrift” derfra.
        <div style={{ marginTop: 14 }}>
          <Link to="/" className="smu-btn-secondary" style={{ textDecoration: 'none' }}>Til søgning</Link>
        </div>
      </ErrorState>
    )
  }

  async function gem(input: CreatePrintopskriftInput) {
    if (!user || !maalfarve) return
    await store.createPrintopskrift({ kind: maalfarve.kind, refId: maalfarve.refId }, input, user)
    navigate(farveHref(maalfarve) ?? '/', { replace: true })
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <Link to="/" className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={15} /> Tilbage
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Opret printopskrift</h1>
      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 18px' }}>
        Canon Colorado / ONYX — hvordan vi rammer målfarven.
      </p>

      <OpskriftForm
        maalfarve={maalfarve}
        submitLabel="Gem som forslag"
        savingLabel="Gemmer…"
        statusNote="Gemmes som forslag — ikke verificeret"
        onSubmit={gem}
      />
    </div>
  )
}
