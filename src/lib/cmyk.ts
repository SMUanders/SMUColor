import type { CmykVaerdier } from './types'

/**
 * Parse en CMYK-søgning til EKSAKTE værdier (0–100). Normaliserer kun notation
 * (mellemrum), ALDRIG værdierne. Returnerer null hvis det ikke er en komplet
 * C/M/Y/K-angivelse. Ingen tolerance/nærhed — det er bevidst (V1.3).
 *
 * Forstår ens: "C0 M100 Y80 K5" og "C 0 M 100 Y 80 K 5".
 */
export function parseCmyk(q: string): CmykVaerdier | null {
  const pick = (label: string): number | null => {
    const m = q.match(new RegExp(`${label}\\s*(\\d{1,3})`, 'i'))
    if (!m) return null
    const n = Number(m[1])
    return n >= 0 && n <= 100 ? n : null
  }
  const c = pick('c')
  const m = pick('m')
  const y = pick('y')
  const k = pick('k')
  if (c === null || m === null || y === null || k === null) return null
  return { c, m, y, k }
}

/** Standardnotation til visning. */
export function formatCmyk(v: CmykVaerdier | { c: number | null; m: number | null; y: number | null; k: number | null }): string {
  return `C${v.c ?? 0} M${v.m ?? 0} Y${v.y ?? 0} K${v.k ?? 0}`
}
