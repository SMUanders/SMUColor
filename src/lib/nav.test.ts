import { describe, expect, it } from 'vitest'
import { farveHref } from './nav'

describe('farveHref', () => {
  it('pantone → /farve/:refId', () => {
    expect(farveHref({ kind: 'pantone', refId: 'abc' })).toBe('/farve/abc')
  })
  it('ral → /ral/:refId', () => {
    expect(farveHref({ kind: 'ral', refId: 'r1' })).toBe('/ral/r1')
  })
  it('source → /folie/:refId', () => {
    expect(farveHref({ kind: 'source', refId: 'v9' })).toBe('/folie/v9')
  })
  it('lokal → null (ingen selvstændig side i V1)', () => {
    expect(farveHref({ kind: 'lokal', refId: 'x' })).toBeNull()
  })
})
