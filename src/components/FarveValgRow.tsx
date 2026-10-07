import type { ReactNode } from 'react'
import type { FarveValg, NodeType } from '../lib/types'
import { Swatch } from './Swatch'

function kindLabel(k: NodeType): string {
  return k === 'pantone' ? 'Pantone' : k === 'ral' ? 'RAL Classic' : k === 'source' ? 'Source-folie' : 'Lokal'
}

/** Ensartet visning af en farve (uanset palette) i lister, resultater og vælgere. */
export function FarveValgRow({
  valg,
  right,
  onClick,
  disabled,
  border,
}: {
  valg: FarveValg
  right?: ReactNode
  onClick?: () => void
  disabled?: boolean
  border?: boolean
}) {
  const udgaaet = valg.kind === 'source' && valg.aktiv === false
  const clickable = Boolean(onClick) && !disabled
  return (
    <div
      className={clickable ? 'smu-clickable' : undefined}
      onClick={clickable ? onClick : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 14px',
        cursor: clickable ? 'pointer' : 'default',
        opacity: disabled ? 0.55 : 1,
        borderTop: border ? '1px solid var(--color-border-soft)' : undefined,
      }}
    >
      <Swatch hex={valg.hex} size={40} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {valg.titel}
          {udgaaet && <span className="smu-badge smu-badge-grey">Udgået</span>}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {kindLabel(valg.kind)}
          {valg.undertekst ? ` · ${valg.undertekst}` : ''}
          {valg.vejledende && valg.hex ? ' · vejledende farve' : ''}
        </div>
      </div>
      {right}
    </div>
  )
}
