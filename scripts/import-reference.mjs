// ============================================================
// REPRODUCERBAR REFERENCEIMPORT — Pantone (Corel PANTONE+ V5)
//
//   ANKER (sandhed):  kilder/PantonePlusSolidCoated_V5.xml   (C = spotfarver, målt Lab)
//   CMYK-REFERENCE:   kilder/PantonePlusColorBridgeCoated_V5.xml (CP = Pantones CMYK-proces)
//
//   -> src/data/seed/reference-colors.json
//   -> supabase/seed/0001_reference_colors_seed.sql
//
// Grafikers pointe (korrekt): "PANTONE 186 C" (spot) er standarden/målet.
// "PANTONE 186 CP" (Color Bridge) er Pantones CMYK-gengivelse — allerede en
// reference, ikke sandheden. Vi ankrer derfor på C-farven (med rigtige spot-
// Lab-værdier) og hænger CP's CMYK på som en tydeligt mærket reference.
// ============================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { uuid5, sqlStr, sqlNum, sqlBool } from './lib/ids.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const SOLID_FILE = join(ROOT, 'kilder', 'PantonePlusSolidCoated_V5.xml')
const BRIDGE_FILE = join(ROOT, 'kilder', 'PantonePlusColorBridgeCoated_V5.xml')
const SOLID_PATH = 'Spot/PANTONE/PANTONE+/PantonePlusSolidCoated.xml'
const BRIDGE_PATH = 'Process/PANTONE/PANTONE+/PantonePlusColorBridgeCoated.xml'

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

// --- Palette-XML-parser (regex; ingen deps) ---
function parsePalette(path) {
  const xml = readFileSync(path, 'utf8')
  const nameM = xml.match(/<palette\s+name="([^"]+)"/)
  const paletteName = nameM ? nameM[1] : ''
  const csRe = /<cs\s+name="([^"]+)"\s+fixedID="(\d+)"[^>]*>([\s\S]*?)<\/cs>/g
  const out = []
  let m
  while ((m = csRe.exec(xml))) {
    const name = m[1]
    const fixedID = Number(m[2])
    const body = m[3]
    const grab = (space) => {
      const mm = body.match(new RegExp(`cs="${space}"\\s+tints="([^"]+)"`))
      return mm ? mm[1] : null
    }
    out.push({ name, fixedID, cmyk: grab('CMYK'), lab: grab('LAB'), rgb: grab('RGB'), adobe: grab('AdobeRGB') })
  }
  return { paletteName, colors: out }
}

const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d

// Corel LAB (0..1) -> rigtig CIE L*a*b*  (verificeret mod primærfarver)
function corelLabToReal(raw) {
  const [l, a, b] = raw.split(',').map(Number)
  return { l: round(l * 100, 1), a: round(a * 255 - 128, 1), b: round(b * 255 - 128, 1) }
}
// Corel RGB (0..1) -> 0..255 + hex
function corelRgb(raw) {
  const [r, g, b] = raw.split(',').map((x) => Math.round(Number(x) * 255))
  const hex = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase()
  return { r, g, b, hex }
}
// Corel CMYK (0..1) -> procent
function corelCmyk(raw) {
  const [c, m, y, k] = raw.split(',').map((x) => round(Number(x) * 100, 0))
  return { c, m, y, k }
}

// "PANTONE 186 C" -> "186" ; "PANTONE Warm Red C" -> "Warm Red"
function toCode(name) {
  return name.replace(/^PANTONE\s+/i, '').replace(/\s+CP$/i, '').replace(/\s+C$/i, '').trim()
}

const solid = parsePalette(SOLID_FILE)
const bridge = parsePalette(BRIDGE_FILE)
const SOLID_SHA = sha256(SOLID_FILE)
const BRIDGE_SHA = sha256(BRIDGE_FILE)

// Byg CP-opslag: kode -> Color Bridge-post (CMYK-reference)
const cpByCode = new Map()
for (const c of bridge.colors) {
  if (!/\sCP$/i.test(c.name)) continue
  cpByCode.set(toCode(c.name).toUpperCase(), c)
}

const colors = []
const seen = new Set()
let joined = 0
let spotOnly = 0

for (const s of solid.colors) {
  if (seen.has(s.name)) continue
  seen.add(s.name)
  const code = toCode(s.name)
  const lab = corelLabToReal(s.lab)
  const rgb = corelRgb(s.rgb)
  const cp = cpByCode.get(code.toUpperCase()) || null
  let cmyk = null
  let cpHex = null
  if (cp) {
    joined++
    cmyk = corelCmyk(cp.cmyk)
    cpHex = corelRgb(cp.rgb).hex
  } else {
    spotOnly++
  }

  colors.push({
    id: uuid5(`refcolor|${s.name}`),
    pantone_name: s.name, // anker: spotfarven "PANTONE 186 C"
    cp_name: cp ? cp.name : null, // CMYK-reference "PANTONE 186 CP"
    pantone_code: code,
    fixed_id: s.fixedID,
    process: false,
    // Spot (C) — standard/sandhed
    lab_l: lab.l, lab_a: lab.a, lab_b: lab.b,
    srgb_r: rgb.r, srgb_g: rgb.g, srgb_b: rgb.b, hex: rgb.hex,
    // Color Bridge (CP) — CMYK-procesreference
    cmyk_c: cmyk ? cmyk.c : null,
    cmyk_m: cmyk ? cmyk.m : null,
    cmyk_y: cmyk ? cmyk.y : null,
    cmyk_k: cmyk ? cmyk.k : null,
    cp_hex: cpHex,
    // Råværdier (sporbarhed)
    lab_corel_raw: s.lab,
    srgb_corel_raw: s.rgb,
    adobe_rgb_corel_raw: s.adobe,
    cmyk_corel_raw: cp ? cp.cmyk : null,
    // Kilder
    source: 'Corel PANTONE+ Solid Coated V5',
    source_version: solid.paletteName, // "PANTONE+ Solid Coated-V5"
    source_file: SOLID_PATH,
    source_sha256: SOLID_SHA,
    cp_source_version: cp ? bridge.paletteName : null, // "PANTONE+ COLOR BRIDGE Coated-V5"
    cp_source_file: cp ? BRIDGE_PATH : null,
    cp_source_sha256: cp ? BRIDGE_SHA : null,
  })
}

// --- JSON-seed ---
const seedDir = join(ROOT, 'src', 'data', 'seed')
mkdirSync(seedDir, { recursive: true })
writeFileSync(join(seedDir, 'reference-colors.json'), JSON.stringify(colors))

// --- SQL-seed (idempotent) ---
const sqlDir = join(ROOT, 'supabase', 'seed')
mkdirSync(sqlDir, { recursive: true })
const cols = [
  'id', 'pantone_name', 'cp_name', 'pantone_code', 'fixed_id', 'process',
  'lab_l', 'lab_a', 'lab_b', 'srgb_r', 'srgb_g', 'srgb_b', 'hex',
  'cmyk_c', 'cmyk_m', 'cmyk_y', 'cmyk_k', 'cp_hex',
  'lab_corel_raw', 'srgb_corel_raw', 'adobe_rgb_corel_raw', 'cmyk_corel_raw',
  'source', 'source_version', 'source_file', 'source_sha256',
  'cp_source_version', 'cp_source_file', 'cp_source_sha256',
]
const lines = []
lines.push('-- Genereret af scripts/import-reference.mjs — ret ikke i hånden.')
lines.push('-- ANKER: PANTONE Solid Coated (C, spot/sandhed). CMYK-REFERENCE: Color Bridge (CP).')
lines.push('-- Idempotent: ON CONFLICT (pantone_name) DO NOTHING.')
lines.push('begin;')
for (const c of colors) {
  const vals = [
    sqlStr(c.id), sqlStr(c.pantone_name), sqlStr(c.cp_name), sqlStr(c.pantone_code), sqlNum(c.fixed_id), sqlBool(c.process),
    sqlNum(c.lab_l), sqlNum(c.lab_a), sqlNum(c.lab_b), sqlNum(c.srgb_r), sqlNum(c.srgb_g), sqlNum(c.srgb_b), sqlStr(c.hex),
    sqlNum(c.cmyk_c), sqlNum(c.cmyk_m), sqlNum(c.cmyk_y), sqlNum(c.cmyk_k), sqlStr(c.cp_hex),
    sqlStr(c.lab_corel_raw), sqlStr(c.srgb_corel_raw), sqlStr(c.adobe_rgb_corel_raw), sqlStr(c.cmyk_corel_raw),
    sqlStr(c.source), sqlStr(c.source_version), sqlStr(c.source_file), sqlStr(c.source_sha256),
    sqlStr(c.cp_source_version), sqlStr(c.cp_source_file), sqlStr(c.cp_source_sha256),
  ]
  lines.push(`insert into farve_reference_colors (${cols.join(', ')}) values (${vals.join(', ')}) on conflict (pantone_name) do nothing;`)
}
lines.push('commit;')
writeFileSync(join(sqlDir, '0001_reference_colors_seed.sql'), lines.join('\n') + '\n')

console.log('REFERENCEIMPORT — PANTONE+ V5 (C-anker + CP CMYK-reference)')
console.log('  Spotfarver (C) importeret     :', colors.length, `(${solid.paletteName})`)
console.log('  Med Color Bridge CMYK (CP)    :', joined)
console.log('  Kun spot (ingen CP-CMYK)      :', spotOnly)
console.log('  -> src/data/seed/reference-colors.json')
console.log('  -> supabase/seed/0001_reference_colors_seed.sql')
