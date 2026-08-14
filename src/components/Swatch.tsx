import { readableTextOn } from '../lib/color'

/**
 * Farvefelt — kun visuel hjælp. En skærmfarve er ALDRIG den fysiske sandhed
 * (opgavens §15). Bruges derfor altid sammen med referenceværdier, ikke i
 * stedet for dem.
 */
export function Swatch({
  hex,
  label,
  size = 56,
}: {
  hex: string | null | undefined
  label?: string
  size?: number
}) {
  const bg = hex || '#eef2f3'
  const fg = hex ? readableTextOn(hex) : 'var(--color-text-muted)'
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: bg,
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        padding: 5,
        flexShrink: 0,
        boxShadow: 'inset 0 0 0 1px rgba(33,55,70,0.04)',
      }}
      aria-label={label ? `Farveprøve ${label}` : 'Farveprøve'}
    >
      {label && <span style={{ fontSize: 9, fontWeight: 800, color: fg, opacity: 0.9 }}>{label}</span>}
    </div>
  )
}
