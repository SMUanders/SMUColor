// Deterministiske UUID'er (RFC 4122 v5) så seed-id'er er stabile på tværs af
// kørsler og identiske i både lokal JSON-seed og SQL-seed. Stabile id'er gør
// det muligt for SMU OS senere at REFERERE til farve-/matchdata uden kopier.
import { createHash } from 'node:crypto'

// Fast namespace-UUID for SMU Color (tilfældigt valgt, konstant).
const NS = 'a1f0c3e2-7b4d-5a96-9c21-0d5e8f2b6a11'

function hexToBytes(hex) {
  const clean = hex.replace(/-/g, '')
  const out = Buffer.alloc(16)
  for (let i = 0; i < 16; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16)
  return out
}

export function uuid5(name) {
  const nsBytes = hexToBytes(NS)
  const hash = createHash('sha1')
  hash.update(nsBytes)
  hash.update(Buffer.from(String(name), 'utf8'))
  const h = hash.digest()
  const b = Buffer.from(h.subarray(0, 16))
  b[6] = (b[6] & 0x0f) | 0x50 // version 5
  b[8] = (b[8] & 0x3f) | 0x80 // variant RFC4122
  const hex = b.toString('hex')
  return `${hex.substr(0, 8)}-${hex.substr(8, 4)}-${hex.substr(12, 4)}-${hex.substr(16, 4)}-${hex.substr(20, 12)}`
}

export function sqlStr(v) {
  if (v === null || v === undefined || v === '') return 'NULL'
  return `'${String(v).replace(/'/g, "''")}'`
}

export function sqlNum(v) {
  if (v === null || v === undefined || v === '' || Number.isNaN(Number(v))) return 'NULL'
  return String(Number(v))
}

export function sqlBool(v) {
  return v ? 'true' : 'false'
}
