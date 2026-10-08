import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getStore } from '../data'
import { useAuth } from '../context/AuthContext'
import type { FarveValg, SourceFolie } from '../lib/types'
import { Swatch } from '../components/Swatch'
import { FarveArbejdsrum } from '../components/FarveArbejdsrum'
import { folieToValg } from '../lib/folie'
import { ErrorState, Spinner } from '../components/common'

export default function FolieDetail() {
  const { variantId } = useParams<{ variantId: string }>()
  const store = getStore()
  const { user } = useAuth()
  const canEdit = Boolean(user?.erRedaktoer)

  const [folie, setFolie] = useState<SourceFolie | null | undefined>(undefined)

  useEffect(() => {
    if (!variantId) return
    setFolie(undefined)
    store.getSourceFolie(variantId).then(setFolie)
  }, [variantId, store])

  if (folie === undefined) return <Spinner label="Indlæser folie…" />
  if (folie === null)
    return <ErrorState title="Folien blev ikke fundet">Findes ikke i Source, eller kræver login mod det delte projekt (Source-farver vises ikke i lokal dev).</ErrorState>

  const valg: FarveValg = folieToValg(folie)

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

      <FarveArbejdsrum farve={valg} canEdit={canEdit} canMatch={canEdit && folie.aktiv} />
    </div>
  )
}
