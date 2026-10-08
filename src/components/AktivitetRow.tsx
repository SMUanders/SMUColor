import { Layers, Printer } from 'lucide-react'
import type { AktivitetItem } from '../lib/types'
import { Swatch } from './Swatch'
import { StatusBadge } from './StatusBadge'

function tidLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('da-DK', { day: '2-digit', month: 'short' })
}

/** Ensartet række i cockpittets "Mit arbejde" / "Seneste aktivitet". */
export function AktivitetRow({ item, border, visAf, onClick }: { item: AktivitetItem; border?: boolean; visAf?: boolean; onClick: () => void }) {
  const Icon = item.slags === 'printopskrift' ? Printer : Layers
  const meta = [visAf && item.af ? item.af : null, tidLabel(item.tidspunkt)].filter(Boolean).join(' · ')
  return (
    <div
      className="smu-clickable"
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', cursor: 'pointer', borderTop: border ? '1px solid var(--color-border-soft)' : undefined }}
    >
      <Swatch hex={item.hex} size={40} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.titel}</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.undertekst}
          {meta ? ` · ${meta}` : ''}
        </div>
      </div>
      <StatusBadge status={item.status} />
    </div>
  )
}
