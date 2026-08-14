import { describe, expect, it } from 'vitest'
import { formatCmyk, formatLab, readableTextOn } from './color'

describe('readableTextOn', () => {
  it('vælger mørk tekst på lys baggrund', () => {
    expect(readableTextOn('#F6EB69')).toBe('#213746') // lys gul
  })
  it('vælger hvid tekst på mørk baggrund', () => {
    expect(readableTextOn('#213746')).toBe('#ffffff') // navy
    expect(readableTextOn('#302E2C')).toBe('#ffffff') // næsten sort
  })
})

describe('formatCmyk', () => {
  it('afrunder til hele procent', () => {
    expect(formatCmyk(0, 100, 79.6, 5.2)).toBe('0 / 100 / 80 / 5')
  })
})

describe('formatLab', () => {
  it('viser L a b med én decimal', () => {
    expect(formatLab(47.05, 66.5, 27.499)).toBe('L 47.1  a 66.5  b 27.5')
  })
})
