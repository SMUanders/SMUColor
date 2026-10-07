import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Printer } from 'lucide-react'
import { getStore } from '../data'
import type { FarveValg, Printopskrift } from '../lib/types'
import { formatCmyk } from '../lib/cmyk'
import { StatusBadge } from './StatusBadge'
import { EmptyState, SectionTitle, Spinner } from './common'

function harCmyk(o: Printopskrift): boolean {
  return o.cmyk_c != null && o.cmyk_m != null && o.cmyk_y != null && o.cmyk_k != null
}

export function PrintopskriftRow({ o, border }: { o: Printopskrift; border?: boolean }) {
  const kontekst = [o.printer, o.medie, o.printmode, o.profil_quickset].filter(Boolean).join(' · ')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: border ? '1px solid var(--color-border-soft)' : undefined }}>
      <span style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-grey-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Printer size={18} style={{ color: 'var(--color-grey-deep)' }} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>
          {harCmyk(o) ? formatCmyk({ c: o.cmyk_c, m: o.cmyk_m, y: o.cmyk_y, k: o.cmyk_k }) : o.outputopskrift || 'Printopskrift'}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {kontekst || 'Canon Colorado'}
        </div>
      </div>
      <StatusBadge status={o.status} />
    </div>
  )
}

/** "Printopskrifter"-afsnit til en farveside. Flere opskrifter pr. farve. */
export function PrintopskriftSektion({ farve, canEdit }: { farve: FarveValg; canEdit: boolean }) {
  const store = getStore()
  const [opskrifter, setOpskrifter] = useState<Printopskrift[] | null>(null)

  useEffect(() => {
    let aktiv = true
    store.getPrintopskrifterForColor(farve.kind, farve.refId).then((o) => aktiv && setOpskrifter(o))
    return () => {
      aktiv = false
    }
  }, [farve.kind, farve.refId, store])

  return (
    <div style={{ marginTop: 28 }}>
      <SectionTitle
        right={
          canEdit ? (
            <Link to="/opskrift/ny" state={{ farve }} className="smu-btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}>
              <Plus size={15} /> Opret printopskrift
            </Link>
          ) : undefined
        }
      >
        Printopskrifter · Canon Colorado
      </SectionTitle>
      {opskrifter === null ? (
        <Spinner />
      ) : opskrifter.length === 0 ? (
        <EmptyState icon={Printer} title="Ingen printopskrifter endnu">
          {canEdit ? 'Registrér hvordan vi rammer denne farve på Canon Colorado.' : 'En redaktør kan oprette en printopskrift.'}
        </EmptyState>
      ) : (
        <div className="smu-card" style={{ overflow: 'hidden' }}>
          {opskrifter.map((o, i) => (
            <PrintopskriftRow key={o.id} o={o} border={i > 0} />
          ))}
        </div>
      )}
    </div>
  )
}
