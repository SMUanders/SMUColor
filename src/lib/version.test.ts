import { describe, it, expect } from 'vitest'
import { formatProductVersion } from './version'

// Samme kontrakt som SMU Tids version.test.ts: labelen viser major.minor,
// patch skjules, og ukendte strenge (fx "dev") returneres uændret.
describe('formatProductVersion — diskret produktlabel fra package.json', () => {
  it('1.0.0 → v1.0', () => {
    expect(formatProductVersion('1.0.0')).toBe('v1.0')
  })
  it('1.0.3 → v1.0 (patch skjules i labelen)', () => {
    expect(formatProductVersion('1.0.3')).toBe('v1.0')
  })
  it('0.9.0 → v0.9', () => {
    expect(formatProductVersion('0.9.0')).toBe('v0.9')
  })
  it('10.0.0 → v10.0', () => {
    expect(formatProductVersion('10.0.0')).toBe('v10.0')
  })
  it('ukendt streng returneres uændret', () => {
    expect(formatProductVersion('dev')).toBe('dev')
  })
})
