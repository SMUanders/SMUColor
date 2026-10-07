import { describe, it, expect } from 'vitest'
import { parseFolieQuery } from './folie'

// Alle disse skal finde ORACAL 751C, variant 031 (serie=751/751c, kode=031).
describe('parseFolieQuery — normaliserer folie-søgning', () => {
  it('751-031 → serie 751, kode 031', () => {
    expect(parseFolieQuery('751-031')).toMatchObject({ serie: '751', kode: '031' })
  })
  it('751 031 (mellemrum)', () => {
    expect(parseFolieQuery('751 031')).toMatchObject({ serie: '751', kode: '031' })
  })
  it('751C 031 (seriebogstav)', () => {
    expect(parseFolieQuery('751C 031')).toMatchObject({ serie: '751c', kode: '031' })
  })
  it('ORACAL 751C 031 (produktnavn)', () => {
    expect(parseFolieQuery('ORACAL 751C 031')).toMatchObject({ serie: '751c', kode: '031' })
  })
  it('ORAFOL 751C 031 (producentnavn)', () => {
    expect(parseFolieQuery('ORAFOL 751C 031')).toMatchObject({ serie: '751c', kode: '031' })
  })
  it('kun kode: 031', () => {
    const r = parseFolieQuery('031')
    expect(r.kode).toBe('031')
    expect(r.serie).toBeUndefined()
  })
  it('kun serie: 751', () => {
    const r = parseFolieQuery('751')
    expect(r.serie).toBe('751')
    expect(r.kode).toBeUndefined()
  })
  it('farvenavn som fritekst: rød', () => {
    const r = parseFolieQuery('rød')
    expect(r.rest).toBe('rød')
    expect(r.serie).toBeUndefined()
    expect(r.kode).toBeUndefined()
  })
})
