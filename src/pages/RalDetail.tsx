import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getStore } from '../data'
import type { FarveValg, ReferenceFarve } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { Swatch } from '../components/Swatch'
import { FarveArbejdsrum } from '../components/FarveArbejdsrum'
import { ErrorState, Spinner } from '../components/common'

export default function RalDetail() {
  const { refId } = useParams<{ refId: string }>()
  const store = getStore()
  const { user } = useAuth()
  const canEdit = Boolean(user?.erRedaktoer)

  const [farve, setFarve] = useState<ReferenceFarve | null | undefined>(undefined)

  useEffect(() => {
    if (!refId) return
    setFarve(undefined)
    store.getRalFarve(refId).then(setFarve)
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

      <FarveArbejdsrum farve={valg} canEdit={canEdit} />
    </div>
  )
}
