import { describe, expect, it } from 'vitest'
import references from './seed/reference-colors.json'
import matches from './seed/matches.json'
import issues from './seed/import-issues.json'
import materialColors from './seed/material-colors.json'
import type { Match, ReferenceColor } from '../lib/types'

const refs = references as unknown as ReferenceColor[]
const legacyMatches = matches as unknown as Match[]

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

describe('Legacy-seed — reference ≠ verifikation', () => {
  it('importerer INTET legacy-match som verificeret', () => {
    expect(legacyMatches.every((m) => m.status === 'forslag')).toBe(true)
    expect(legacyMatches.some((m) => m.status === 'verificeret')).toBe(false)
  })
  it('markerer legacy-referencen som antaget (ikke bekræftet)', () => {
    expect(legacyMatches.every((m) => m.reference_antaget === true)).toBe(true)
  })
  it('bevarer sporbarhed til kildefil og række', () => {
    expect(legacyMatches.every((m) => m.source === 'import_legacy' && m.source_file && m.source_row)).toBe(true)
  })
  it('har ingen verifikationsdata på forslag', () => {
    expect(legacyMatches.every((m) => m.verified_at === null && m.verified_by === null)).toBe(true)
  })
})

describe('Legacy-seed — tvetydige rækker logges', () => {
  it('logger uopløste/tvetydige rækker i stedet for at gætte', () => {
    expect((issues as unknown[]).length).toBeGreaterThan(0)
  })
  it('materialefarver bevarer det rå legacy-pantone-tal', () => {
    const withRaw = (materialColors as { legacy_pantone_raw: string | null }[]).filter((c) => c.legacy_pantone_raw)
    expect(withRaw.length).toBeGreaterThan(0)
  })
})
