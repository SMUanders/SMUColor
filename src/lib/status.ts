// Statusmodel for matches. Status kommunikeres ALTID med tekst + badge + ikon
// — aldrig kun med farve (opgavens §9). Rød er kun til fejl/afvist.
import type { MatchStatus } from './types'

export interface StatusMeta {
  label: string
  badgeClass: string
  /** Lucide-ikonnavn — importeres i komponenten. */
  icon: 'CircleDashed' | 'FlaskConical' | 'CheckCircle2' | 'XCircle'
  hint: string
}

export const STATUS_META: Record<MatchStatus, StatusMeta> = {
  forslag: {
    label: 'Forslag',
    badgeClass: 'smu-badge-grey',
    icon: 'CircleDashed',
    hint: 'Ikke verificeret. Et forslag — ikke Signmeups godkendte match.',
  },
  under_test: {
    label: 'Under test',
    badgeClass: 'smu-badge-orange',
    icon: 'FlaskConical',
    hint: 'Under afprøvning. Endnu ikke godkendt.',
  },
  verificeret: {
    label: 'Verificeret',
    badgeClass: 'smu-badge-green',
    icon: 'CheckCircle2',
    hint: 'Godkendt af Signmeup mod fysisk reference.',
  },
  afvist: {
    label: 'Afvist',
    badgeClass: 'smu-badge-red',
    icon: 'XCircle',
    hint: 'Afvist — brug ikke dette match.',
  },
}

export const STATUS_ORDER: MatchStatus[] = ['verificeret', 'under_test', 'forslag', 'afvist']

export function statusLabel(s: MatchStatus): string {
  return STATUS_META[s].label
}
