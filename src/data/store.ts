// Storage bag et interface (SMU_APP_STANDARD §3). To adaptere:
//   localStore    — dev-fallback (seed + localStorage), bruges uden Supabase-keys
//   supabaseStore — den rigtige, delte backend
// UI'et kender kun dette interface.
import type {
  AktivitetItem,
  CmykVaerdier,
  CreatePrintopskriftInput,
  CurrentUser,
  ImportIssue,
  Match,
  MatchEnriched,
  MatchStatus,
  MatchType,
  Material,
  MaterialColor,
  NodeType,
  OnyxColorManagement,
  OnyxMedia,
  OnyxMediaGroup,
  OnyxNiveau,
  OnyxPrinter,
  OnyxPrintmode,
  Printopskrift,
  PrintopskriftFeltforslag,
  PrintopskriftView,
  ProductionContext,
  FarveValg,
  ReferenceColor,
  ReferenceFarve,
  RelationView,
  SourceBibliotek,
  SourceFolie,
  VerificationHistory,
} from '../lib/types'

export interface SearchResult {
  references: { ref: ReferenceColor; matchCount: number; statuses: MatchStatus[] }[]
  materialColors: { mc: MaterialColor; material: Material | null; matches: Match[] }[]
}

export interface CreateMatchInput {
  reference_color_id: string | null
  material_color_id: string | null
  match_type: MatchType
  note?: string | null
  reference_antaget?: boolean
}

export interface UpdateMatchInput {
  note?: string | null
  match_type?: MatchType
  material_color_id?: string | null
  reference_antaget?: boolean
}

export interface SetStatusInput {
  status: MatchStatus
  metode?: string | null
  kommentar?: string | null
}

export interface ProductionInput {
  printer?: string | null
  blaekset?: string | null
  mediegruppe?: string | null
  medie?: string | null
  printmode?: string | null
  profil?: string | null
  quick_set?: string | null
  outputopskrift?: string | null
  note?: string | null
}

export interface CreateMaterialColorInput {
  material_id: string | null
  kode: string
  navn?: string | null
  ral_kode?: string | null
  note?: string | null
}

export interface Stats {
  referenceCount: number
  matchCount: number
  forslag: number
  under_test: number
  verificeret: number
  afvist: number
  issuesOpen: number
}

export interface FarveStore {
  readonly mode: 'local' | 'supabase'

  search(query: string): Promise<SearchResult>

  getReference(id: string): Promise<ReferenceColor | null>
  findReferenceByCode(code: string): Promise<ReferenceColor | null>

  // ── V1.5 cockpit (genbruger created_by/updated_by — ingen ny tracking) ──
  /** Mit seneste arbejde: farvematches + printopskrifter jeg har oprettet/redigeret. */
  mitSenesteArbejde(userId: string, limit: number): Promise<AktivitetItem[]>
  /** Seneste aktivitet i Color på tværs af kolleger. */
  senesteAktivitet(limit: number): Promise<AktivitetItem[]>

  // ── Referencebiblioteker (RAL Classic m.fl.) — samme niveau som Pantone ──
  /** Søg RAL Classic på kode ("3020", "RAL 3020") eller navn. [] uden Supabase. */
  searchRal(query: string): Promise<FarveValg[]>
  /** Hent én referencefarve (RAL) til dens farveside. null uden Supabase. */
  getRalFarve(refId: string): Promise<ReferenceFarve | null>
  /** Alle RAL Classic-farver til browsing. [] uden Supabase. */
  listRalFarver(): Promise<ReferenceFarve[]>

  getMatchesForReference(refId: string): Promise<MatchEnriched[]>
  getMatch(id: string): Promise<MatchEnriched | null>
  createMatch(input: CreateMatchInput, user: CurrentUser): Promise<Match>
  updateMatch(id: string, patch: UpdateMatchInput, user: CurrentUser): Promise<Match>
  setStatus(id: string, input: SetStatusInput, user: CurrentUser): Promise<Match>

  upsertProduction(matchId: string, input: ProductionInput, user: CurrentUser): Promise<ProductionContext>
  getVerificationHistory(matchId: string): Promise<VerificationHistory[]>

  listMaterials(): Promise<Material[]>
  listMaterialColors(materialId?: string): Promise<MaterialColor[]>
  createMaterialColor(input: CreateMaterialColorInput, user: CurrentUser): Promise<MaterialColor>

  listMatches(filter?: { status?: MatchStatus; needsReview?: boolean }): Promise<MatchEnriched[]>
  recentMatches(limit: number): Promise<MatchEnriched[]>
  recentVerified(limit: number): Promise<MatchEnriched[]>
  pendingProposals(limit: number): Promise<MatchEnriched[]>
  listImportIssues(): Promise<ImportIssue[]>
  stats(): Promise<Stats>

  // ── V1.2: palette-neutral knude/relation-flow ──────────────────────────
  /** Søg aktive Source-foliefarver via læsekontrakten. [] uden Supabase. */
  searchSourceFolie(query: string): Promise<SourceFolie[]>
  /** Hent én Source-foliefarve (også udgået) via stabil variant-ID. */
  getSourceFolie(variantId: string): Promise<SourceFolie | null>
  /** Relationer for en farve (opretter ingen knude). */
  getRelationsForColor(kind: NodeType, refId: string): Promise<RelationView[]>
  /** Opret relation (status 'forslag') mellem to farver; lazy find-or-create af knuder. */
  createRelationMellem(
    a: { kind: NodeType; refId: string },
    b: { kind: NodeType; refId: string },
    note: string | null,
    user: CurrentUser,
  ): Promise<{ id: string }>

  // ── V1.3: palette-browsing + printopskrifter + CMYK-søgning ────────────
  /** Source-biblioteker/serier til browsing. [] uden Supabase. */
  listBiblioteker(): Promise<SourceBibliotek[]>
  /** Aktive swatches i en serie (fx "751C"). [] uden Supabase. */
  listSerieVarianter(serie: string): Promise<SourceFolie[]>
  /** Printopskrifter for en farve. */
  getPrintopskrifterForColor(kind: NodeType, refId: string): Promise<Printopskrift[]>
  /** Hent én printopskrift + dens målfarve (til genåbning). null hvis ukendt. */
  getPrintopskrift(id: string): Promise<PrintopskriftView | null>
  /** Opret printopskrift (status 'forslag') for en farve; lazy find-or-create af knude. */
  createPrintopskrift(
    color: { kind: NodeType; refId: string },
    input: CreatePrintopskriftInput,
    user: CurrentUser,
  ): Promise<{ id: string }>
  /** Rediger en eksisterende printopskrift. Bevarer id, node_id, status, verificering og historik. */
  updatePrintopskrift(id: string, input: CreatePrintopskriftInput, user: CurrentUser): Promise<Printopskrift>
  /** Append-only historik for en printopskrift (nyeste først). */
  getPrintopskriftHistorik(id: string): Promise<VerificationHistory[]>
  /** Datalist-forslag til fri-tekst-felter (printmedie/laminat) fra faktiske data. */
  printopskriftFeltforslag(): Promise<PrintopskriftFeltforslag>

  // ── ONYX-stamdatakatalog (afhængige dropdowns) ──
  onyxPrintere(): Promise<OnyxPrinter[]>
  onyxMediaGroups(printerId: string): Promise<OnyxMediaGroup[]>
  onyxMedier(mediaGroupId: string): Promise<OnyxMedia[]>
  onyxPrintmodes(mediaId: string): Promise<OnyxPrintmode[]>
  onyxColorManagement(): Promise<OnyxColorManagement[]>
  /** Opret (eller find eksisterende) katalogværdi på et niveau. Kræver bruger+. */
  onyxOpret(niveau: OnyxNiveau, parentId: string | null, navn: string, user: CurrentUser): Promise<{ id: string; navn: string }>
  /** Alle printopskrifter (Canon/ONYX-området), nyeste først. */
  listPrintopskrifter(): Promise<PrintopskriftView[]>
  /** EKSAKT CMYK-søgning i registrerede printopskrifter. */
  searchPrintopskriftByCmyk(cmyk: CmykVaerdier): Promise<PrintopskriftView[]>
  /** EKSAKT CMYK-opslag i Pantone-reference (CP) — referenceinfo, ikke opskrift. */
  searchReferenceByCmyk(cmyk: CmykVaerdier): Promise<ReferenceColor[]>
}
