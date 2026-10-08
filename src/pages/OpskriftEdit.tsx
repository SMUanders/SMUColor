import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getStore } from '../data'
import { useAuth } from '../context/AuthContext'
import type { CreatePrintopskriftInput, PrintopskriftView } from '../lib/types'
import { OpskriftForm } from '../components/OpskriftForm'
import { ErrorState, Spinner } from '../components/common'

export default function OpskriftEdit() {
  const { id } = useParams<{ id: string }>()
  const store = getStore()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [view, setView] = useState<PrintopskriftView | null | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    setView(undefined)
    store.getPrintopskrift(id).then(setView)
  }, [id, store])

  if (view === undefined) return <Spinner label="Indlæser printopskrift…" />
  if (view === null || !id) return <ErrorState title="Printopskriften blev ikke fundet" />

  const o = view.opskrift

  async function gem(input: CreatePrintopskriftInput) {
    if (!user || !id) return
    await store.updatePrintopskrift(id, input, user)
    navigate(`/opskrift/${id}`, { replace: true })
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <Link to={`/opskrift/${id}`} className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={15} /> Tilbage
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Rediger printopskrift</h1>
      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 18px' }}>
        Canon Colorado / ONYX — ret felterne. Status, verificering og historik bevares.
      </p>

      <OpskriftForm
        maalfarve={view.maalfarve}
        initial={{
          medie: o.medie,
          laminat: o.laminat,
          profil_quickset: o.profil_quickset,
          printer: o.printer,
          onyx_printer_id: o.onyx_printer_id,
          media_group: o.media_group,
          onyx_media_group_id: o.onyx_media_group_id,
          media_name: o.media_name,
          onyx_media_id: o.onyx_media_id,
          printmode: o.printmode,
          onyx_printmode_id: o.onyx_printmode_id,
          color_management: o.color_management,
          onyx_color_management_id: o.onyx_color_management_id,
          cmyk_c: o.cmyk_c,
          cmyk_m: o.cmyk_m,
          cmyk_y: o.cmyk_y,
          cmyk_k: o.cmyk_k,
          spot1: o.kanalvaerdier?.Spot1 ?? null,
          spot2: o.kanalvaerdier?.Spot2 ?? null,
          outputopskrift: o.outputopskrift,
          note: o.note,
        }}
        submitLabel="Gem ændringer"
        savingLabel="Gemmer…"
        onSubmit={gem}
      />
    </div>
  )
}
