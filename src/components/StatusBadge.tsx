import { CheckCircle2, CircleDashed, FlaskConical, XCircle } from 'lucide-react'
import type { MatchStatus } from '../lib/types'
import { STATUS_META } from '../lib/status'

const ICONS = {
  CircleDashed,
  FlaskConical,
  CheckCircle2,
  XCircle,
} as const

/**
 * Statusvisning med tekst + badge + ikon (aldrig kun farve).
 * Gør tydeligt forskellen på forslag / under test / verificeret / afvist.
 */
export function StatusBadge({ status, size = 12 }: { status: MatchStatus; size?: number }) {
  const meta = STATUS_META[status]
  const Icon = ICONS[meta.icon]
  return (
    <span className={`smu-badge ${meta.badgeClass}`} title={meta.hint}>
      <Icon size={size} strokeWidth={2.5} />
      {meta.label}
    </span>
  )
}
