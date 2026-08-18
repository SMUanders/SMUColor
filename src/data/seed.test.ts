import { describe, expect, it } from 'vitest'
import references from './seed/reference-colors.json'
import matches from './seed/matches.json'
import issues from './seed/import-issues.json'
import materials from './seed/materials.json'
import materialColors from './seed/material-colors.json'
import type { ReferenceColor } from '../lib/types'

const refs = references as unknown as ReferenceColor[]

describe('Pantone reference-seed (C-anker + CP CMYK)', () => {
  it('indeholder 2390 spotfarver (Solid Coated)', () => {
    expect(refs.length).toBe(2390)
  })
  it('har unikke pantone-navne', () => {
    expect(new Set(refs.map((r) => r.pantone_name)).size).toBe(refs.length)
  })
  it('bevarer spot-kilde/version på hver post', () => {
    expect(refs.every((r) => r.source && r.source_version && r.source_sha256)).toBe(true)
  })
  it('ankrer på spotfarven (C) med målt Lab (186 er en rød)', () => {
    const p186 = refs.find((r) => r.pantone_name === 'PANTONE 186 C')!
    expect(p186.lab_a).toBeGreaterThan(40) // rød = høj positiv a*
    expect(p186.hex.toUpperCase()).toBe('#C8102E') // spotfarvens rigtige hex
  })
  it('hænger CP CMYK-reference på (og den adskiller sig fra spot)', () => {
    const p186 = refs.find((r) => r.pantone_code === '186')!
    expect(p186.cp_name).toBe('PANTONE 186 CP')
    expect(p186.cmyk_c).not.toBeNull()
    expect(p186.cp_hex).toBe('#CC2647') // CMYK-simuleringen ≠ spot #C8102E
    expect(p186.cp_hex).not.toBe(p186.hex)
  })
})

describe('SMU-matchlaget starter tomt (legacy fjernet)', () => {
  // Legacy fra Tegnestueplan2023.xlsx blev fjernet — tegnestuen bygger
  // matchlaget fra bunden. Kun Pantone-referencen (read-only) er seedet.
  it('ingen matches i seed', () => {
    expect((matches as unknown[]).length).toBe(0)
  })
  it('ingen materialer i seed', () => {
    expect((materials as unknown[]).length).toBe(0)
  })
  it('ingen materialefarver i seed', () => {
    expect((materialColors as unknown[]).length).toBe(0)
  })
  it('ingen import-issues i seed', () => {
    expect((issues as unknown[]).length).toBe(0)
  })
})
