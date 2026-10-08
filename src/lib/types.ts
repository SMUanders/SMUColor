// Domænetyper for SMU Color.
// Bevidst opdelt: ReferenceColor (ekstern Color Bridge) ≠ SMU-viden (Match).

export type MatchStatus = 'forslag' | 'under_test' | 'verificeret' | 'afvist'
export type MatchType = 'folie' | 'print' | 'ral' | 'cmyk' | 'materiale' | 'andet'
export type MaterialKind = 'folie' | 'print' | 'ral' | 'cmyk' | 'andet'

/** Color Bridge-referencefarve. READ-ONLY reference — ikke et verificeret match. */
export interface ReferenceColor {
  id: string
  /** Anker/identitet: spotfarven, fx "PANTONE 186 C" (kundens mål/sandhed). */
  pantone_name: string
  /** Color Bridge-navnet = Pantones CMYK-procesreference, fx "PANTONE 186 CP". */
  cp_name: string | null
  pantone_code: string
  fixed_id: number
  process: boolean
  // Spot (C) — standard/sandhed
  lab_l: number
  lab_a: number
  lab_b: number
  srgb_r: number
  srgb_g: number
  srgb_b: number
  hex: string
  // Color Bridge (CP) — CMYK-procesreference (null hvis ingen bridge-post)
  cmyk_c: number | null
  cmyk_m: number | null
  cmyk_y: number | null
  cmyk_k: number | null
  cp_hex: string | null
  // Råværdier
  lab_corel_raw: string
  srgb_corel_raw: string
  adobe_rgb_corel_raw: string
  cmyk_corel_raw: string | null
  // Kilder
  source: string
  source_version: string
  source_file: string
  source_sha256: string
  cp_source_version: string | null
  cp_source_file: string | null
  cp_source_sha256: string | null
}

export interface Material {
  id: string
  kind: MaterialKind
  producent: string | null
  serie: string | null
  navn: string
  anvendelse: string | null
  bredde: string | null
  holdbarhed: string | null
  anbefalet_laminat: string | null
  note: string | null
  source_file: string | null
  source_sheet: string | null
  source_row: number | null
  source_value_raw: string | null
  slettet: boolean
}

export interface MaterialColor {
  id: string
  material_id: string | null
  kode: string
  navn: string | null
  ral_kode: string | null
  apa_kode: string | null
  legacy_pantone_raw: string | null
  hex: string | null
  note: string | null
  source_file: string | null
  source_sheet: string | null
  source_row: number | null
  source_value_raw: string | null
  slettet: boolean
}

/** Selvstændigt domæneobjekt: relation reference ↔ materiale, med status. */
export interface Match {
  id: string
  reference_color_id: string | null
  material_color_id: string | null
  match_type: MatchType
  status: MatchStatus
  /** true = referencen er ANTAGET (fx fra legacy-tal), ikke bekræftet. */
  reference_antaget: boolean
  note: string | null
  source: string
  source_file: string | null
  source_sheet: string | null
  source_row: number | null
  source_value_raw: string | null
  needs_review: boolean
  verified_by: string | null
  verified_by_navn: string | null
  verified_at: string | null
  verification_method: string | null
  verification_comment: string | null
  measured_lab_l: number | null
  measured_lab_a: number | null
  measured_lab_b: number | null
  delta_e: number | null
  instrument?: string | null
  fysisk_reference?: string | null
  photo_url?: string | null
  created_by: string | null
  created_by_navn: string | null
  updated_by?: string | null
  created_at: string
  updated_at: string
  slettet: boolean
}

export interface ProductionContext {
  id: string
  match_id: string
  printer: string | null
  blaekset: string | null
  mediegruppe: string | null
  medie: string | null
  printmode: string | null
  profil: string | null
  quick_set: string | null
  outputopskrift: string | null
  note: string | null
  slettet: boolean
}

export interface VerificationHistory {
  id: string
  match_id: string
  handling: string
  fra_status: MatchStatus | null
  til_status: MatchStatus | null
  metode: string | null
  kommentar: string | null
  udfoert_af: string | null
  udfoert_af_navn: string | null
  created_at: string
}

export interface ImportIssue {
  id: string
  source_file: string | null
  source_sheet: string | null
  source_row: number | null
  kind: string | null
  raw_data: string | null
  reason: string | null
  resolved: boolean
  created_at: string
}

/** Enriched match til visning (joins). */
export interface MatchEnriched extends Match {
  reference?: ReferenceColor | null
  materialColor?: MaterialColor | null
  material?: Material | null
  production?: ProductionContext | null
}

/** Aktuel bruger (fra Supabase Auth + profiler). */
export interface CurrentUser {
  id: string
  email: string
  navn: string
  erRedaktoer: boolean
}

// ── V1.2: palette-neutral knude/relation-model ──────────────────────────────
// 'pantone' og 'ral' er begge REFERENCEFARVER (farve_noder.type = 'reference' i
// DB) — UI'et skelner kun, fordi de har hver sin side/opslagsvej. 'source' =
// materiale-folie, 'lokal' = material_color.
export type NodeType = 'pantone' | 'ral' | 'source' | 'lokal'

/**
 * En generisk referencefarve (RAL Classic m.fl.) — samme niveau som Pantone.
 * hex er en VEJLEDENDE digital farve og aldrig et verificeret fysisk match.
 */
export interface ReferenceFarve {
  id: string
  bibliotek_kode: string
  bibliotek_navn: string
  kode: string
  navn: string
  hex: string | null
  kilde: string | null
  kilde_version: string | null
}

/**
 * Source-foliefarve læst via kontrakten (farve_source_foliefarver).
 * ALDRIG kopieret eller lagret i Color — kun vist/valgt.
 */
export interface SourceFolie {
  source_variant_id: string
  producent: string | null
  serie: string | null
  produkt_navn: string | null
  kode: string
  variant_navn: string | null
  farvegruppe: string | null
  finish: string | null
  aktiv: boolean
  producent_farvenavn: string | null
  digital_srgb: string | null
  digital_lab: string | null
  har_digital_farve: boolean
  digital_vejledende: boolean
}

/** En farve til visning/valg i V1.2 (uanset palette). */
export interface FarveValg {
  kind: NodeType
  /** Stabil kilde-id: pantone→reference_color_id · ral→reference_farve_id · source→source_variant_id · lokal→material_color_id */
  refId: string
  titel: string
  undertekst?: string | null
  hex?: string | null
  /** true = hex er en VEJLEDENDE producentfarve (ikke fysisk sandhed). */
  vejledende?: boolean
  /** source: false = udgået (må vises, men ikke vælges til nye relationer). */
  aktiv?: boolean
}

/** En relation set fra en bestemt farve — modparten vises. */
export interface RelationView {
  id: string
  status: MatchStatus
  note: string | null
  created_at: string
  modpart: FarveValg
}

/** Et Source-bibliotek/serie til palette-browsing (via kontrakt). */
export interface SourceBibliotek {
  producent: string | null
  produktlinje: string | null
  produkt_navn: string | null
  serie: string | null
  kategori_kode: string | null
  antal_varianter: number
  m_digital_farve: number
}

export interface CmykVaerdier {
  c: number
  m: number
  y: number
  k: number
}

/** Color-ejet printopskrift (farve → produktionsviden). Flere pr. farve. */
export interface Printopskrift {
  id: string
  node_id: string
  printer: string | null
  medie: string | null
  printmode: string | null
  profil_quickset: string | null
  kanalvaerdier: Record<string, number> | null
  cmyk_c: number | null
  cmyk_m: number | null
  cmyk_y: number | null
  cmyk_k: number | null
  outputopskrift: string | null
  note: string | null
  status: MatchStatus
  verified_by_navn: string | null
  verified_at: string | null
  verification_method: string | null
  verification_comment: string | null
  created_by_navn?: string | null
  created_at: string
  updated_at?: string
}

/** Et element i cockpittets "Mit seneste arbejde" / "Seneste aktivitet". */
export interface AktivitetItem {
  slags: 'farvematch' | 'printopskrift'
  id: string
  titel: string
  undertekst: string | null
  hex: string | null
  status: MatchStatus
  /** Hvor elementet åbnes. */
  href: string
  /** Hvem der oprettede/ændrede (til "Seneste aktivitet"). */
  af: string | null
  /** updated_at (ISO) til sortering/visning. */
  tidspunkt: string
}

export interface CreatePrintopskriftInput {
  printer: string | null
  medie: string | null
  printmode: string | null
  profil_quickset: string | null
  cmyk: CmykVaerdier | null
  outputopskrift: string | null
  note: string | null
}

/** En printopskrift + dens målfarve (til Canon-området og CMYK-søgning). */
export interface PrintopskriftView {
  opskrift: Printopskrift
  maalfarve: FarveValg
}
