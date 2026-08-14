// Lokal dev-adapter: seed-data + localStorage. Bruges KUN når Supabase ikke er
// konfigureret (lokal udvikling / demo). Aldrig den endelige dataløsning.
import type {
  CurrentUser,
  ImportIssue,
  Match,
  MatchEnriched,
  MatchStatus,
  Material,
  MaterialColor,
  ProductionContext,
  ReferenceColor,
  VerificationHistory,
} from '../lib/types'
import { scoreMaterialColor, scoreReference } from '../lib/search'
import type {
  CreateMatchInput,
  CreateMaterialColorInput,
  FarveStore,
  ProductionInput,
  SearchResult,
  SetStatusInput,
  Stats,
  UpdateMatchInput,
} from './store'

const LS_KEY = 'smu-color-dev-v1'

interface Mutable {
  materials: Material[]
  materialColors: MaterialColor[]
  matches: Match[]
  production: ProductionContext[]
  history: VerificationHistory[]
  issues: ImportIssue[]
}

function now(): string {
  return new Date().toISOString()
}
function uid(): string {
  return crypto.randomUUID()
}

export class LocalStore implements FarveStore {
  readonly mode = 'local' as const
  private references: ReferenceColor[] = []
  private data: Mutable = {
    materials: [],
    materialColors: [],
    matches: [],
    production: [],
    history: [],
    issues: [],
  }
  private ready: Promise<void>

  constructor() {
    this.ready = this.init()
  }

  private async init() {
    // Reference (read-only) altid fra seed.
    const ref = (await import('./seed/reference-colors.json')).default as unknown as ReferenceColor[]
    this.references = ref

    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_KEY) : null
    if (saved) {
      this.data = JSON.parse(saved)
      return
    }
    // Første kørsel: seed SMU-viden fra genererede filer.
    const [materials, materialColors, matches, issues] = await Promise.all([
      import('./seed/materials.json'),
      import('./seed/material-colors.json'),
      import('./seed/matches.json'),
      import('./seed/import-issues.json'),
    ])
    this.data = {
      materials: materials.default as unknown as Material[],
      materialColors: materialColors.default as unknown as MaterialColor[],
      matches: matches.default as unknown as Match[],
      production: [],
      history: [],
      issues: issues.default as unknown as ImportIssue[],
    }
    this.persist()
  }

  private persist() {
    if (typeof localStorage !== 'undefined') localStorage.setItem(LS_KEY, JSON.stringify(this.data))
  }

  private enrich(m: Match): MatchEnriched {
    const reference = m.reference_color_id
      ? this.references.find((r) => r.id === m.reference_color_id) ?? null
      : null
    const materialColor = m.material_color_id
      ? this.data.materialColors.find((c) => c.id === m.material_color_id) ?? null
      : null
    const material = materialColor?.material_id
      ? this.data.materials.find((x) => x.id === materialColor.material_id) ?? null
      : null
    const production = this.data.production.find((p) => p.match_id === m.id && !p.slettet) ?? null
    return { ...m, reference, materialColor, material, production }
  }

  private liveMatches(): Match[] {
    return this.data.matches.filter((m) => !m.slettet)
  }

  async search(query: string): Promise<SearchResult> {
    await this.ready
    const q = query.trim()
    if (!q) return { references: [], materialColors: [] }

    const refs = this.references
      .map((ref) => ({ ref, score: scoreReference(ref, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.ref.pantone_name.localeCompare(b.ref.pantone_name))
      .slice(0, 40)
      .map(({ ref }) => {
        const ms = this.liveMatches().filter((m) => m.reference_color_id === ref.id)
        return { ref, matchCount: ms.length, statuses: [...new Set(ms.map((m) => m.status))] }
      })

    const mcs = this.data.materialColors
      .filter((c) => !c.slettet)
      .map((mc) => ({ mc, score: scoreMaterialColor(mc, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.mc.kode.localeCompare(b.mc.kode))
      .slice(0, 40)
      .map(({ mc }) => ({
        mc,
        material: this.data.materials.find((x) => x.id === mc.material_id) ?? null,
        matches: this.liveMatches().filter((m) => m.material_color_id === mc.id),
      }))

    return { references: refs, materialColors: mcs }
  }

  async getReference(id: string): Promise<ReferenceColor | null> {
    await this.ready
    return this.references.find((r) => r.id === id) ?? null
  }

  async findReferenceByCode(code: string): Promise<ReferenceColor | null> {
    await this.ready
    const c = code.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
    return (
      this.references.find((r) => r.pantone_code.toLowerCase().replace(/[^a-z0-9]/g, '') === c) ?? null
    )
  }

  async getMatchesForReference(refId: string): Promise<MatchEnriched[]> {
    await this.ready
    return this.liveMatches()
      .filter((m) => m.reference_color_id === refId)
      .map((m) => this.enrich(m))
  }

  async getMatch(id: string): Promise<MatchEnriched | null> {
    await this.ready
    const m = this.data.matches.find((x) => x.id === id && !x.slettet)
    return m ? this.enrich(m) : null
  }

  async createMatch(input: CreateMatchInput, user: CurrentUser): Promise<Match> {
    await this.ready
    const t = now()
    const m: Match = {
      id: uid(),
      reference_color_id: input.reference_color_id,
      material_color_id: input.material_color_id,
      match_type: input.match_type,
      status: 'forslag',
      reference_antaget: input.reference_antaget ?? false,
      note: input.note ?? null,
      source: 'manuel',
      source_file: null,
      source_sheet: null,
      source_row: null,
      source_value_raw: null,
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
      created_by: user.id,
      created_by_navn: user.navn,
      updated_by: user.id,
      created_at: t,
      updated_at: t,
      slettet: false,
    }
    this.data.matches.push(m)
    this.addHistory(m.id, { handling: 'oprettet', til_status: 'forslag' }, user)
    this.persist()
    return m
  }

  async updateMatch(id: string, patch: UpdateMatchInput, user: CurrentUser): Promise<Match> {
    await this.ready
    const m = this.data.matches.find((x) => x.id === id)
    if (!m) throw new Error('Match ikke fundet')
    if (patch.note !== undefined) m.note = patch.note
    if (patch.match_type !== undefined) m.match_type = patch.match_type
    if (patch.material_color_id !== undefined) m.material_color_id = patch.material_color_id
    if (patch.reference_antaget !== undefined) m.reference_antaget = patch.reference_antaget
    m.updated_by = user.id
    m.updated_at = now()
    this.addHistory(m.id, { handling: 'opdateret' }, user)
    this.persist()
    return m
  }

  async setStatus(id: string, input: SetStatusInput, user: CurrentUser): Promise<Match> {
    await this.ready
    const m = this.data.matches.find((x) => x.id === id)
    if (!m) throw new Error('Match ikke fundet')
    const fra = m.status
    m.status = input.status
    m.updated_by = user.id
    m.updated_at = now()

    if (input.status === 'verificeret') {
      // Verifikation er en menneskelig handling — gem hvem + hvornår automatisk.
      m.verified_by = user.id
      m.verified_by_navn = user.navn
      m.verified_at = now()
      m.verification_method = input.metode ?? null
      m.verification_comment = input.kommentar ?? null
      m.reference_antaget = false // bekræftet af et menneske
    } else if (input.status === 'afvist') {
      m.verification_comment = input.kommentar ?? m.verification_comment
    }

    const handling =
      input.status === 'verificeret' ? 'verificeret' : input.status === 'afvist' ? 'afvist' : 'status_skiftet'
    this.addHistory(
      m.id,
      { handling, fra_status: fra, til_status: input.status, metode: input.metode ?? null, kommentar: input.kommentar ?? null },
      user,
    )
    this.persist()
    return m
  }

  private addHistory(
    matchId: string,
    p: Partial<VerificationHistory> & { handling: string },
    user: CurrentUser,
  ) {
    this.data.history.push({
      id: uid(),
      match_id: matchId,
      handling: p.handling,
      fra_status: p.fra_status ?? null,
      til_status: p.til_status ?? null,
      metode: p.metode ?? null,
      kommentar: p.kommentar ?? null,
      udfoert_af: user.id,
      udfoert_af_navn: user.navn,
      created_at: now(),
    })
  }

  async upsertProduction(
    matchId: string,
    input: ProductionInput,
    user: CurrentUser,
  ): Promise<ProductionContext> {
    await this.ready
    let pc = this.data.production.find((p) => p.match_id === matchId && !p.slettet)
    if (!pc) {
      pc = {
        id: uid(),
        match_id: matchId,
        printer: input.printer ?? 'Canon Colorado M-series',
        blaekset: null,
        mediegruppe: null,
        medie: null,
        printmode: null,
        profil: null,
        quick_set: null,
        outputopskrift: null,
        note: null,
        slettet: false,
      }
      this.data.production.push(pc)
    }
    pc.printer = input.printer ?? pc.printer
    pc.blaekset = input.blaekset ?? pc.blaekset
    pc.mediegruppe = input.mediegruppe ?? pc.mediegruppe
    pc.medie = input.medie ?? pc.medie
    pc.printmode = input.printmode ?? pc.printmode
    pc.profil = input.profil ?? pc.profil
    pc.quick_set = input.quick_set ?? pc.quick_set
    pc.outputopskrift = input.outputopskrift ?? pc.outputopskrift
    pc.note = input.note ?? pc.note
    this.addHistory(matchId, { handling: 'opdateret', kommentar: 'Produktionskontekst opdateret' }, user)
    this.persist()
    return pc
  }

  async getVerificationHistory(matchId: string): Promise<VerificationHistory[]> {
    await this.ready
    return this.data.history
      .filter((h) => h.match_id === matchId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }

  async listMaterials(): Promise<Material[]> {
    await this.ready
    return this.data.materials.filter((m) => !m.slettet)
  }

  async listMaterialColors(materialId?: string): Promise<MaterialColor[]> {
    await this.ready
    return this.data.materialColors.filter(
      (c) => !c.slettet && (!materialId || c.material_id === materialId),
    )
  }

  async createMaterialColor(input: CreateMaterialColorInput): Promise<MaterialColor> {
    await this.ready
    const mc: MaterialColor = {
      id: uid(),
      material_id: input.material_id,
      kode: input.kode,
      navn: input.navn ?? null,
      ral_kode: input.ral_kode ?? null,
      apa_kode: null,
      legacy_pantone_raw: null,
      hex: null,
      note: input.note ?? null,
      source_file: null,
      source_sheet: null,
      source_row: null,
      source_value_raw: null,
      slettet: false,
    }
    this.data.materialColors.push(mc)
    this.persist()
    return mc
  }

  async listMatches(filter?: { status?: MatchStatus; needsReview?: boolean }): Promise<MatchEnriched[]> {
    await this.ready
    return this.liveMatches()
      .filter((m) => (!filter?.status || m.status === filter.status))
      .filter((m) => (filter?.needsReview === undefined || m.needs_review === filter.needsReview))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .map((m) => this.enrich(m))
  }

  async recentVerified(limit: number): Promise<MatchEnriched[]> {
    await this.ready
    return this.liveMatches()
      .filter((m) => m.status === 'verificeret')
      .sort((a, b) => (b.verified_at ?? '').localeCompare(a.verified_at ?? ''))
      .slice(0, limit)
      .map((m) => this.enrich(m))
  }

  async pendingProposals(limit: number): Promise<MatchEnriched[]> {
    await this.ready
    return this.liveMatches()
      .filter((m) => m.status === 'forslag' || m.status === 'under_test')
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, limit)
      .map((m) => this.enrich(m))
  }

  async listImportIssues(): Promise<ImportIssue[]> {
    await this.ready
    return this.data.issues.filter((i) => !i.resolved)
  }

  async stats(): Promise<Stats> {
    await this.ready
    const live = this.liveMatches()
    const by = (s: MatchStatus) => live.filter((m) => m.status === s).length
    return {
      referenceCount: this.references.length,
      matchCount: live.length,
      forslag: by('forslag'),
      under_test: by('under_test'),
      verificeret: by('verificeret'),
      afvist: by('afvist'),
      issuesOpen: this.data.issues.filter((i) => !i.resolved).length,
    }
  }
}
