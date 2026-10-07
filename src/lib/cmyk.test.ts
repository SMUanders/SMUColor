import { describe, it, expect } from 'vitest'
import { parseCmyk, formatCmyk } from './cmyk'

describe('parseCmyk — eksakt CMYK (ingen tolerance)', () => {
  it('C0 M100 Y80 K5', () => {
    expect(parseCmyk('C0 M100 Y80 K5')).toEqual({ c: 0, m: 100, y: 80, k: 5 })
  })
  it('C 0 M 100 Y 80 K 5 (mellemrum) → samme værdier', () => {
    expect(parseCmyk('C 0 M 100 Y 80 K 5')).toEqual({ c: 0, m: 100, y: 80, k: 5 })
  })
  it('næsten identisk er IKKE samme (eksakt)', () => {
    expect(parseCmyk('C0 M100 Y80 K6')).not.toEqual(parseCmyk('C0 M100 Y80 K5'))
  })
  it('ikke-CMYK → null', () => {
    expect(parseCmyk('751-031')).toBeNull()
    expect(parseCmyk('186')).toBeNull()
    expect(parseCmyk('rød')).toBeNull()
  })
  it('ufuldstændig CMYK → null', () => {
    expect(parseCmyk('C0 M100')).toBeNull()
  })
  it('værdi uden for 0–100 → null', () => {
    expect(parseCmyk('C0 M100 Y80 K150')).toBeNull()
  })
  it('formatCmyk', () => {
    expect(formatCmyk({ c: 0, m: 100, y: 80, k: 5 })).toBe('C0 M100 Y80 K5')
  })
})
