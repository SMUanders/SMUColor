import type { FarveValg, SourceFolie } from './types'

// Folie-søgning normaliserer mellemrum/bindestreg/serie, så fx "751-031",
// "751 031", "751C 031", "ORACAL 751C 031" og "ORAFOL 751C 031" alle rammer
// ORACAL 751C, variant 031. Serie + kode udledes og bruges til filter/rangering.
const FOLIE_BRANDS = new Set([
  'oracal', 'orafol', 'avery', 'dennison', 'mactac', 'poli-tape', 'politape',
  'oraguard', 'orajet', 'oralite', 'supreme', 'wrapping', 'film',
])

/** Udled serie/kode/fritekst af en folie-søgning. Ren og testbar. */
export function parseFolieQuery(q: string): { serie?: string; kode?: string; rest?: string } {
  const tokens = q.toLowerCase().split(/[\s\-_/]+/).map((t) => t.trim()).filter((t) => t && !FOLIE_BRANDS.has(t))
  let serie: string | undefined
  let kode: string | undefined
  for (const t of tokens) {
    const isSeries = /^(651|751c?|970(ra\+?)?|8500|8800|3551|215|pt160)$/.test(t)
    if (isSeries && !serie) {
      serie = t
      continue
    }
    if (!kode && /^\d{1,3}[a-z]?$/.test(t)) {
      kode = t
      continue
    }
  }
  const rest = tokens.filter((t) => t !== serie && t !== kode).join(' ') || undefined
  return { serie, kode, rest }
}

/**
 * Brugerens faglige navn på en Source-folie, fx "ORACAL 751C 031 — Red".
 * Skjuler manglende metadata frem for at vise "ukendt".
 */
export function folieTitel(f: SourceFolie): string {
  const brand = (f.produkt_navn ?? '').trim().split(/\s+/)[0] || f.producent || ''
  const base = [brand, f.serie, f.kode].filter(Boolean).join(' ')
  return f.producent_farvenavn ? `${base} — ${f.producent_farvenavn}` : base
}

/** Sekundær linje: producent (kun hvis kendt). */
export function folieProducentLinje(f: SourceFolie): string | null {
  return f.producent ? `Producent: ${f.producent}` : null
}

/** Konvertér en Source-folie til et palette-neutralt farvevalg. */
export function folieToValg(f: SourceFolie): FarveValg {
  return {
    kind: 'source',
    refId: f.source_variant_id,
    titel: folieTitel(f),
    undertekst: folieProducentLinje(f),
    hex: f.digital_srgb,
    vejledende: true,
    aktiv: f.aktiv,
  }
}
