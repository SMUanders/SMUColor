// ============================================================
// FORSIGTIG LEGACY-IMPORT — Tegnestueplan2023.xlsx
//   Ark "Farve konveteringsskema"  -> Oracal-folie + FORSLAG-matches
//   Ark "Folie"                     -> folie-materialeviden
//
//   -> src/data/seed/materials.json
//   -> src/data/seed/material-colors.json
//   -> src/data/seed/matches.json
//   -> src/data/seed/import-issues.json
//   -> supabase/seed/0002_legacy_seed.sql
//
// PRINCIP: legacy-data er IKKE verificeret. Alt importeres som
// status 'forslag' med fuld sporbarhed (fil/ark/række/råværdi).
// Tvetydige rækker linkes IKKE til en reference — de logges til
// manuel gennemgang. Intet importeres nogensinde som verificeret.
// ============================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { openWorkbook } from './lib/xlsx.mjs'
import { uuid5, sqlStr, sqlBool } from './lib/ids.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SOURCE_FILE = 'Tegnestueplan2023.xlsx'
const XLSX_PATH = join(ROOT, 'kilder', SOURCE_FILE)
const IMPORT_TS = '2026-08-14T12:00:00.000Z' // fast, så seed er reproducerbar

// --- Reference-opslag: pantone_code -> reference_color_id (kun CP-farver) ---
const refColors = JSON.parse(readFileSync(join(ROOT, 'src/data/seed/reference-colors.json'), 'utf8'))
// Legacy-tal (fx 4008) er Pantone-numre → slå op på spotfarven (C-ankeret).
// En kobling er stadig kun et FORSLAG (legacy brugte solid-numre uden suffiks).
const refByCode = new Map()
for (const c of refColors) {
  refByCode.set(c.pantone_code.toUpperCase(), c)
}

const wb = openWorkbook(XLSX_PATH)

const materials = []
const materialColors = []
const matches = []
const issues = []

// Materialefamilier for Oracal-serier
function ensureOracalSerie(serie) {
  const id = uuid5(`material|folie|Oracal|${serie}`)
  if (!materials.find((m) => m.id === id)) {
    materials.push({
      id,
      kind: 'folie',
      producent: 'Oracal',
      serie: String(serie),
      navn: `Oracal ${serie}`,
      anvendelse: null,
      bredde: null,
      holdbarhed: null,
      anbefalet_laminat: null,
      note: 'Skærefolie-serie. Farver importeret fra Tegnestueplan2023.xlsx.',
      source_file: SOURCE_FILE,
      source_sheet: 'Farve konveteringsskema',
      source_row: null,
      source_value_raw: null,
      slettet: false,
    })
  }
  return id
}

// ---------- Ark 1: Farve konveteringsskema ----------
const konv = wb.readSheet('Farve konveteringsskema')
let resolved = 0
let unresolvedCount = 0
const seenCodes = new Map()

for (const row of konv) {
  const kodeRaw = row.cells[1]
  const navn = row.cells[2]
  const pantoneRaw = row.cells[3]
  const ral = row.cells[4]
  const apa = row.cells[5]
  if (!kodeRaw || kodeRaw === 'Oracal Kode') continue

  // Normalisér Oracal-kode: "751 - 595" -> "751-595"
  const kodeNorm = kodeRaw.replace(/\s+/g, '').replace(/[–—]/g, '-')
  const serie = (kodeNorm.match(/^(\d{3})/) || [])[1] || 'ukendt'
  const materialId = ensureOracalSerie(serie)

  // Registrér dubletter til info-log
  seenCodes.set(kodeNorm, (seenCodes.get(kodeNorm) || 0) + 1)

  const mcId = uuid5(`matcolor|${SOURCE_FILE}|konv|${row.rowNum}`)
  materialColors.push({
    id: mcId,
    material_id: materialId,
    kode: kodeNorm,
    navn: navn || null,
    ral_kode: ral || null,
    apa_kode: apa || null,
    legacy_pantone_raw: pantoneRaw || null,
    hex: null,
    note: null,
    source_file: SOURCE_FILE,
    source_sheet: 'Farve konveteringsskema',
    source_row: row.rowNum,
    source_value_raw: [kodeRaw, navn, pantoneRaw, ral, apa].filter(Boolean).join(' | '),
    slettet: false,
  })

  // Forsøg at opløse Pantone-reference (legacy bruger solid-tal, ikke CP —
  // en kobling til CP er derfor en ANTAGELSE, aldrig verificeret).
  const norm = String(pantoneRaw || '').replace(/\s+/g, '').replace(/C$/i, '').toUpperCase()
  const ref = refByCode.get(norm)

  if (ref) {
    resolved++
    matches.push({
      id: uuid5(`match|${SOURCE_FILE}|konv|${row.rowNum}`),
      reference_color_id: ref.id,
      material_color_id: mcId,
      match_type: 'folie',
      status: 'forslag',
      reference_antaget: true,
      note: `Foreslået foliematch fra tegnestueplanen. Reference antaget ud fra legacy-tal "${pantoneRaw}" → spotfarven ${ref.pantone_name}${ref.cp_name ? ` (Color Bridge CP-reference: ${ref.cp_name})` : ''}. Ikke verificeret.`,
      source: 'import_legacy',
      source_file: SOURCE_FILE,
      source_sheet: 'Farve konveteringsskema',
      source_row: row.rowNum,
      source_value_raw: `${kodeNorm} ↔ Pantone ${pantoneRaw}`,
      needs_review: false,
      verified_by: null,
      verified_by_navn: null,
      verified_at: null,
      verification_method: null,
      verification_comment: null,
      measured_lab_l: null,
      measured_lab_a: null,
      measured_lab_b: null,
      delta_e: null,
      created_by: null,
      created_by_navn: 'Legacy-import',
      created_at: IMPORT_TS,
      updated_at: IMPORT_TS,
      slettet: false,
    })
  } else {
    unresolvedCount++
    issues.push({
      id: uuid5(`issue|${SOURCE_FILE}|konv|${row.rowNum}`),
      source_file: SOURCE_FILE,
      source_sheet: 'Farve konveteringsskema',
      source_row: row.rowNum,
      kind: 'pantone_uopløst',
      raw_data: `${kodeNorm} "${navn}" → Pantone "${pantoneRaw}" (RAL ${ral || '-'})`,
      reason: `Pantone-værdi "${pantoneRaw}" matcher ingen Color Bridge CP-farve (muligt RAL-tal i Pantone-kolonnen, metallic, eller solid-kun). Folien er gemt; matchet skal oprettes manuelt.`,
      resolved: false,
      created_at: IMPORT_TS,
    })
  }
}

// Log dubletkoder til manuel gennemgang
for (const [kode, n] of seenCodes) {
  if (n > 1) {
    issues.push({
      id: uuid5(`issue|${SOURCE_FILE}|dublet|${kode}`),
      source_file: SOURCE_FILE,
      source_sheet: 'Farve konveteringsskema',
      source_row: null,
      kind: 'dublet_kode',
      raw_data: `Oracal-kode "${kode}" optræder ${n} gange med forskellige navne.`,
      reason: 'Samme foliekode bruges til flere farver i legacy — tjek hvilken der er korrekt.',
      resolved: false,
      created_at: IMPORT_TS,
    })
  }
}

// ---------- Ark 2: Folie (materialeviden) ----------
const folie = wb.readSheet('Folie')
let folieCount = 0
for (const row of folie) {
  const navn = row.cells[1]
  if (!navn || navn === 'Folie') continue
  folieCount++
  materials.push({
    id: uuid5(`material|folie-produkt|${row.rowNum}`),
    kind: 'folie',
    producent: navn.split(/\s+/)[0] || null,
    serie: null,
    navn,
    anvendelse: row.cells[2] || null,
    bredde: row.cells[3] || null,
    holdbarhed: row.cells[4] || null,
    anbefalet_laminat: row.cells[5] || null,
    note: row.cells[6] || null,
    source_file: SOURCE_FILE,
    source_sheet: 'Folie',
    source_row: row.rowNum,
    source_value_raw: Object.values(row.cells).join(' | '),
    slettet: false,
  })
}

// ---------- Skriv JSON ----------
const seedDir = join(ROOT, 'src', 'data', 'seed')
mkdirSync(seedDir, { recursive: true })
writeFileSync(join(seedDir, 'materials.json'), JSON.stringify(materials))
writeFileSync(join(seedDir, 'material-colors.json'), JSON.stringify(materialColors))
writeFileSync(join(seedDir, 'matches.json'), JSON.stringify(matches))
writeFileSync(join(seedDir, 'import-issues.json'), JSON.stringify(issues))

// ---------- Skriv SQL ----------
const sqlDir = join(ROOT, 'supabase', 'seed')
mkdirSync(sqlDir, { recursive: true })
const L = []
L.push('-- Genereret af scripts/import-legacy.mjs — ret ikke i hånden.')
L.push('-- LEGACY (Tegnestueplan2023.xlsx). Alt er FORSLAG, aldrig verificeret.')
L.push('-- Idempotent: ON CONFLICT (id) DO NOTHING.')
L.push('begin;')
for (const m of materials) {
  L.push(
    `insert into farve_materials (id, kind, producent, serie, navn, anvendelse, bredde, holdbarhed, anbefalet_laminat, note, source_file, source_sheet, source_row, source_value_raw, slettet) values (` +
      [sqlStr(m.id), sqlStr(m.kind), sqlStr(m.producent), sqlStr(m.serie), sqlStr(m.navn), sqlStr(m.anvendelse), sqlStr(m.bredde), sqlStr(m.holdbarhed), sqlStr(m.anbefalet_laminat), sqlStr(m.note), sqlStr(m.source_file), sqlStr(m.source_sheet), m.source_row == null ? 'NULL' : m.source_row, sqlStr(m.source_value_raw), sqlBool(m.slettet)].join(', ') +
      `) on conflict (id) do nothing;`,
  )
}
for (const mc of materialColors) {
  L.push(
    `insert into farve_material_colors (id, material_id, kode, navn, ral_kode, apa_kode, legacy_pantone_raw, hex, note, source_file, source_sheet, source_row, source_value_raw, slettet) values (` +
      [sqlStr(mc.id), sqlStr(mc.material_id), sqlStr(mc.kode), sqlStr(mc.navn), sqlStr(mc.ral_kode), sqlStr(mc.apa_kode), sqlStr(mc.legacy_pantone_raw), sqlStr(mc.hex), sqlStr(mc.note), sqlStr(mc.source_file), sqlStr(mc.source_sheet), mc.source_row, sqlStr(mc.source_value_raw), sqlBool(mc.slettet)].join(', ') +
      `) on conflict (id) do nothing;`,
  )
}
for (const m of matches) {
  L.push(
    `insert into farve_matches (id, reference_color_id, material_color_id, match_type, status, reference_antaget, note, source, source_file, source_sheet, source_row, source_value_raw, needs_review, created_by_navn, created_at, updated_at, slettet) values (` +
      [sqlStr(m.id), sqlStr(m.reference_color_id), sqlStr(m.material_color_id), sqlStr(m.match_type), sqlStr(m.status), sqlBool(m.reference_antaget), sqlStr(m.note), sqlStr(m.source), sqlStr(m.source_file), sqlStr(m.source_sheet), m.source_row, sqlStr(m.source_value_raw), sqlBool(m.needs_review), sqlStr(m.created_by_navn), sqlStr(m.created_at), sqlStr(m.updated_at), sqlBool(m.slettet)].join(', ') +
      `) on conflict (id) do nothing;`,
  )
}
for (const i of issues) {
  L.push(
    `insert into farve_import_issues (id, source_file, source_sheet, source_row, kind, raw_data, reason, resolved, created_at) values (` +
      [sqlStr(i.id), sqlStr(i.source_file), sqlStr(i.source_sheet), i.source_row == null ? 'NULL' : i.source_row, sqlStr(i.kind), sqlStr(i.raw_data), sqlStr(i.reason), sqlBool(i.resolved), sqlStr(i.created_at)].join(', ') +
      `) on conflict (id) do nothing;`,
  )
}
L.push('commit;')
writeFileSync(join(sqlDir, '0002_legacy_seed.sql'), L.join('\n') + '\n')

// ---------- Rapport ----------
console.log('LEGACY-IMPORT — Tegnestueplan2023.xlsx')
console.log('  Materialefamilier          :', materials.length, `(Oracal-serier + ${folieCount} folie-produkter)`)
console.log('  Materialefarver (Oracal)   :', materialColors.length)
console.log('  FORSLAG-matches oprettet   :', matches.length, '(alle status=forslag, reference antaget)')
console.log('  Pantone opløst -> reference:', resolved)
console.log('  Uopløste (kun folie gemt)  :', unresolvedCount)
console.log('  Import-issues logget       :', issues.length)
console.log('  -> src/data/seed/{materials,material-colors,matches,import-issues}.json')
console.log('  -> supabase/seed/0002_legacy_seed.sql')
