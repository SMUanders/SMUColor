// Farve-hjælpere til visning. En skærmfarve er ALDRIG den fysiske sandhed —
// swatches er kun visuel hjælp (se SMU_DESIGN_SYSTEM + opgavens §15).

/** Vælg læsbar tekstfarve (mørk/lys) oven på en hex-baggrund. */
export function readableTextOn(hex: string): '#213746' | '#ffffff' {
  const c = hex.replace('#', '')
  if (c.length < 6) return '#213746'
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  // relativ luminans (sRGB, forenklet)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return lum > 0.6 ? '#213746' : '#ffffff'
}

export function formatCmyk(c: number, m: number, y: number, k: number): string {
  const r = (n: number) => Math.round(n)
  return `${r(c)} / ${r(m)} / ${r(y)} / ${r(k)}`
}

export function formatRgb(r: number, g: number, b: number): string {
  return `${r}, ${g}, ${b}`
}

export function formatLab(l: number, a: number, b: number): string {
  const f = (n: number) => (Math.round(n * 10) / 10).toString()
  return `L ${f(l)}  a ${f(a)}  b ${f(b)}`
}
