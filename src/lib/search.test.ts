import { describe, expect, it } from 'vitest'
import { expandSynonyms, scoreMaterialColor, scoreReference } from './search'
import type { MaterialColor, ReferenceColor } from './types'

function ref(partial: Partial<ReferenceColor>): ReferenceColor {
  return {
    id: 'x', pantone_name: 'PANTONE 186 C', cp_name: 'PANTONE 186 CP', pantone_code: '186', fixed_id: 1,
    process: false, lab_l: 44.7, lab_a: 67.8, lab_b: 40.1, srgb_r: 200, srgb_g: 16, srgb_b: 46, hex: '#C8102E',
    cmyk_c: 0, cmyk_m: 100, cmyk_y: 80, cmyk_k: 5, cp_hex: '#CC2647',
    lab_corel_raw: '', srgb_corel_raw: '', adobe_rgb_corel_raw: '', cmyk_corel_raw: '',
    source: '', source_version: '', source_file: '', source_sha256: '',
    cp_source_version: null, cp_source_file: null, cp_source_sha256: null, ...partial,
  }
}

function mc(partial: Partial<MaterialColor>): MaterialColor {
  return {
    id: 'y', material_id: null, kode: '751-031', navn: 'red', ral_kode: '3020', apa_kode: null,
    legacy_pantone_raw: '3546', hex: null, note: null, source_file: null, source_sheet: null,
    source_row: null, source_value_raw: null, slettet: false, ...partial,
  }
}

describe('scoreReference', () => {
  it('rangerer eksakt kode-match højest', () => {
    expect(scoreReference(ref({}), '186')).toBe(100)
  })
  it('matcher "186 cp" og "PANTONE 186"', () => {
    expect(scoreReference(ref({}), '186 CP')).toBeGreaterThan(0)
    expect(scoreReference(ref({}), 'PANTONE 186')).toBeGreaterThan(0)
  })
  it('matcher delvist på nummer', () => {
    expect(scoreReference(ref({ pantone_name: 'PANTONE 1865 CP', pantone_code: '1865' }), '186')).toBeGreaterThan(0)
  })
  it('giver 0 ved intet træf', () => {
    expect(scoreReference(ref({}), 'zzz')).toBe(0)
    expect(scoreReference(ref({}), '')).toBe(0)
  })
  it('prioriterer eksakt over delvist', () => {
    const exact = scoreReference(ref({ pantone_code: '300', pantone_name: 'PANTONE 300 CP' }), '300')
    const partial = scoreReference(ref({ pantone_code: '3005', pantone_name: 'PANTONE 3005 CP' }), '300')
    expect(exact).toBeGreaterThan(partial)
  })
})

describe('scoreMaterialColor', () => {
  it('matcher eksakt foliekode', () => {
    expect(scoreMaterialColor(mc({}), '751-031')).toBe(100)
  })
  it('matcher RAL med og uden præfiks', () => {
    expect(scoreMaterialColor(mc({}), '3020')).toBeGreaterThan(0)
    expect(scoreMaterialColor(mc({}), 'RAL 3020')).toBeGreaterThan(0)
  })
  it('matcher engelsk farvenavn', () => {
    expect(scoreMaterialColor(mc({ navn: 'red' }), 'red')).toBeGreaterThan(0)
  })
  it('matcher dansk farvenavn via synonym', () => {
    expect(scoreMaterialColor(mc({ navn: 'red' }), 'rød')).toBeGreaterThan(0)
  })
})

describe('expandSynonyms', () => {
  it('oversætter dansk farve til engelsk', () => {
    expect(expandSynonyms('blå')).toContain('blue')
    expect(expandSynonyms('grøn')).toContain('green')
  })
  it('bevarer den oprindelige forespørgsel', () => {
    expect(expandSynonyms('186')).toContain('186')
  })
})
