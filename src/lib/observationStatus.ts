import type { ObservationStatus } from './types'

export const OBS_STATUS_META: Record<ObservationStatus, { label: string; badgeClass: string }> = {
  AI_EKSTRAHERET: { label: 'AI-ekstraheret', badgeClass: 'smu-badge-grey' },
  TIL_GENNEMGANG: { label: 'Til gennemgang', badgeClass: 'smu-badge-orange' },
  GODKENDT_SOM_FORSLAG: { label: 'Godkendt som forslag', badgeClass: 'smu-badge-blue' },
  AFVIST: { label: 'Afvist', badgeClass: 'smu-badge-red' },
}

export const OBS_STATUS_ORDER: ObservationStatus[] = [
  'TIL_GENNEMGANG',
  'AI_EKSTRAHERET',
  'GODKENDT_SOM_FORSLAG',
  'AFVIST',
]
