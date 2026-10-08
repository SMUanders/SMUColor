import { Printer } from 'lucide-react'
import type { Printopskrift } from '../lib/types'
import { formatCmyk } from '../lib/cmyk'
import { StatusBadge } from './StatusBadge'

function harCmyk(o: Printopskrift): boolean {
  return o.cmyk_c != null && o.cmyk_m != null && o.cmyk_y != null && o.cmyk_k != null
}

/** Én printopskrift-række (genbruges i farvens arbejdsrum). Klikbar hvis onClick. */
export function PrintopskriftRow({ o, border, onClick }: { o: Printopskrift; border?: boolean; onClick?: () => void }) {
  const kontekst = [o.printer, o.medie, o.printmode, o.profil_quickset].filter(Boolean).join(' · ')
  return (
    <div
      className={onClick ? 'smu-clickable' : undefined}
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: border ? '1px solid var(--color-border-soft)' : undefined, cursor: onClick ? 'pointer' : undefined }}
    >
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
