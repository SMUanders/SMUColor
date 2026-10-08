import { describe, it, expect } from 'vitest'
import { erColorRedaktoer, erColorSkriver } from './colorAccess'

// Spejler har_app_rolle('color','redaktoer') (niveau >= 20) fra databasens RLS.
describe('erColorRedaktoer', () => {
  it('observatør (niveau 5) → kun læsning', () => {
    expect(erColorRedaktoer(['observatoer'])).toBe(false)
  })
  it('bruger (niveau 10) → kun læsning', () => {
    expect(erColorRedaktoer(['bruger'])).toBe(false)
  })
  it('redaktør (niveau 20) → skriveret', () => {
    expect(erColorRedaktoer(['redaktoer'])).toBe(true)
  })
  it('admin (niveau 30) → skriveret', () => {
    expect(erColorRedaktoer(['admin'])).toBe(true)
  })
  it('ingen color-adgang → ingen rettigheder (fail-closed)', () => {
    expect(erColorRedaktoer([])).toBe(false)
  })
  it('case/whitespace-robust', () => {
    expect(erColorRedaktoer([' Redaktoer '])).toBe(true)
  })
  it('flere roller: højeste vinder', () => {
    expect(erColorRedaktoer(['observatoer', 'admin'])).toBe(true)
  })
  it('ukendt rolle → ingen rettigheder', () => {
    expect(erColorRedaktoer(['gæst'])).toBe(false)
  })
})

// Spejler har_app_rolle('color','bruger') (niveau >= 10) fra TRIN C-RLS.
describe('erColorSkriver', () => {
  it('observatør (niveau 5) → read-only', () => {
    expect(erColorSkriver(['observatoer'])).toBe(false)
  })
  it('bruger (niveau 10) → må skrive forslag', () => {
    expect(erColorSkriver(['bruger'])).toBe(true)
  })
  it('redaktør/admin → må skrive', () => {
    expect(erColorSkriver(['redaktoer'])).toBe(true)
    expect(erColorSkriver(['admin'])).toBe(true)
  })
  it('ingen adgang / ukendt → false (fail-closed)', () => {
    expect(erColorSkriver([])).toBe(false)
    expect(erColorSkriver(['gæst'])).toBe(false)
  })
})
