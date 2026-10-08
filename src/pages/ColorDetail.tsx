import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getStore } from '../data'
import type { FarveValg, ReferenceColor } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { ReferenceCard } from '../components/ReferenceCard'
import { FarveArbejdsrum } from '../components/FarveArbejdsrum'
import { ErrorState, Spinner } from '../components/common'

export default function ColorDetail() {
  const { refId } = useParams<{ refId: string }>()
  const store = getStore()
  const { user } = useAuth()
  const canEdit = Boolean(user?.erRedaktoer)

  const [ref, setRef] = useState<ReferenceColor | null | undefined>(undefined)

  useEffect(() => {
    if (!refId) return
    setRef(undefined)
    store.getReference(refId).then(setRef)
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

      <FarveArbejdsrum farve={pantoneValg} canEdit={canEdit} />
    </div>
  )
}
