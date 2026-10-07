import type { FarveValg, NodeType } from './types'

/**
 * URL til en farves side ud fra palette-kind. Ét sted, så alle lister/vælgere
 * navigerer ens (pantone + ral er begge referencefarver med hver sin side).
 * null = kan ikke åbnes (fx 'lokal' har ingen selvstændig side i V1).
 */
export function farveHref(v: Pick<FarveValg, 'kind' | 'refId'> | { kind: NodeType; refId: string }): string | null {
  switch (v.kind) {
    case 'pantone':
      return `/farve/${v.refId}`
    case 'ral':
      return `/ral/${v.refId}`
    case 'source':
      return `/folie/${v.refId}`
    default:
      return null
  }
}
