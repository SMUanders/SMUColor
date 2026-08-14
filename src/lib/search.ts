// Ren søgelogik — ingen I/O, så den kan enhedstestes og genbruges af begge
// data-adaptere. Prioriterer hurtige, forudsigelige træf for tegnestuen.
import type { MaterialColor, ReferenceColor } from './types'

export function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Kun tal/bogstaver — til at sammenligne farvekoder ("186 cp" → "186cp"). */
function compact(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Dansk → engelsk for de almindeligste farveord (materialefarver er på engelsk).
const DK_EN: Record<string, string> = {
  rød: 'red', roed: 'red', blå: 'blue', blaa: 'blue', grøn: 'green', groen: 'green',
  gul: 'yellow', sort: 'black', hvid: 'white', grå: 'grey', graa: 'grey', gray: 'grey',
  orange: 'orange', lilla: 'purple', violet: 'violet', brun: 'brown', lyseblå: 'light blue',
  turkis: 'turquoise', sølv: 'silver', guld: 'gold', beige: 'beige', pink: 'pink', lyserød: 'pink',
}

export function expandSynonyms(q: string): string[] {
  const n = normalize(q)
  const out = new Set<string>([n])
  if (DK_EN[n]) out.add(DK_EN[n])
  // enkeltord i en flerords-forespørgsel
  for (const w of n.split(' ')) if (DK_EN[w]) out.add(n.replace(w, DK_EN[w]))
  return [...out]
}

/**
 * Score en referencefarve mod forespørgslen. 0 = intet træf.
 * Højere = bedre. Eksakt kode-match vinder over delvise.
 */
export function scoreReference(ref: ReferenceColor, query: string): number {
  const q = normalize(query)
  if (!q) return 0
  const qc = compact(q)
  const nameC = compact(ref.pantone_name) // spot: "pantone186c"
  const cpC = compact(ref.cp_name ?? '') // CMYK-ref: "pantone186cp"
  const codeC = compact(ref.pantone_code)

  if (codeC === qc || nameC === qc || cpC === qc) return 100
  // "186" mod code "186", eller "186c"/"186cp" der reduceres til nummeret
  if (codeC === qc.replace(/^pantone/, '').replace(/cp?$/, '')) return 95
  if (nameC.startsWith(qc) || cpC.startsWith(qc)) return 80
  if (codeC.startsWith(qc)) return 78
  if (qc.length >= 2 && codeC.includes(qc)) return 55
  if (qc.length >= 2 && (nameC.includes(qc) || cpC.includes(qc))) return 50
  return 0
}

/** Score en materialefarve (Oracal/RAL) mod forespørgslen. */
export function scoreMaterialColor(mc: MaterialColor, query: string): number {
  const variants = expandSynonyms(query)
  let best = 0
  for (const q of variants) {
    const qc = compact(q)
    if (!qc) continue
    const kodeC = compact(mc.kode)
    const navnC = compact(mc.navn ?? '')
    const ralC = compact(mc.ral_kode ?? '')
    const pantC = compact(mc.legacy_pantone_raw ?? '')

    if (kodeC === qc) best = Math.max(best, 100)
    else if (ralC && (ralC === qc || compact('ral' + ralC) === qc)) best = Math.max(best, 92)
    else if (kodeC.includes(qc) && qc.length >= 3) best = Math.max(best, 70)
    else if (navnC === qc) best = Math.max(best, 66)
    else if (navnC.startsWith(qc) && qc.length >= 2) best = Math.max(best, 60)
    else if (navnC.includes(qc) && qc.length >= 2) best = Math.max(best, 45)
    else if (pantC && pantC === qc) best = Math.max(best, 40)
  }
  return best
}
