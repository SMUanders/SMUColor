// Storage bag et interface (SMU_APP_STANDARD §3). To adaptere:
//   localStore    — dev-fallback (seed + localStorage), bruges uden Supabase-keys
//   supabaseStore — den rigtige, delte backend
// UI'et kender kun dette interface.
import type {
  CurrentUser,
  ImportIssue,
  Match,
  MatchEnriched,
  MatchStatus,
  MatchType,
  Material,
  MaterialColor,
  ProductionContext,
  ReferenceColor,
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
  recentVerified(limit: number): Promise<MatchEnriched[]>
  pendingProposals(limit: number): Promise<MatchEnriched[]>
  listImportIssues(): Promise<ImportIssue[]>
  stats(): Promise<Stats>
}
