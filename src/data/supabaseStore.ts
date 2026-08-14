// Supabase-adapter — den rigtige, delte backend. Samme interface som localStore.
import type { SupabaseClient } from '@supabase/supabase-js'
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

const T = {
  ref: 'farve_reference_colors',
  materials: 'farve_materials',
  mc: 'farve_material_colors',
  matches: 'farve_matches',
  production: 'farve_production_context',
  history: 'farve_verification_history',
  issues: 'farve_import_issues',
} as const

export class SupabaseStore implements FarveStore {
  readonly mode = 'supabase' as const
  constructor(private sb: SupabaseClient) {}

  private async enrich(matches: Match[]): Promise<MatchEnriched[]> {
    if (matches.length === 0) return []
    const refIds = [...new Set(matches.map((m) => m.reference_color_id).filter(Boolean))] as string[]
    const mcIds = [...new Set(matches.map((m) => m.material_color_id).filter(Boolean))] as string[]
    const matchIds = matches.map((m) => m.id)

    const [refs, mcs, prod] = await Promise.all([
      refIds.length ? this.sb.from(T.ref).select('*').in('id', refIds) : Promise.resolve({ data: [] }),
      mcIds.length ? this.sb.from(T.mc).select('*').in('id', mcIds) : Promise.resolve({ data: [] }),
      this.sb.from(T.production).select('*').in('match_id', matchIds).eq('slettet', false),
    ])
    const refMap = new Map((refs.data as ReferenceColor[] | null ?? []).map((r) => [r.id, r]))
    const mcList = (mcs.data as MaterialColor[] | null) ?? []
    const mcMap = new Map(mcList.map((c) => [c.id, c]))
    const matIds = [...new Set(mcList.map((c) => c.material_id).filter(Boolean))] as string[]
    const mats = matIds.length ? await this.sb.from(T.materials).select('*').in('id', matIds) : { data: [] }
    const matMap = new Map(((mats.data as Material[] | null) ?? []).map((m) => [m.id, m]))
    const prodMap = new Map(
      ((prod.data as ProductionContext[] | null) ?? []).map((p) => [p.match_id, p]),
    )

    return matches.map((m) => {
      const materialColor = m.material_color_id ? mcMap.get(m.material_color_id) ?? null : null
      const material = materialColor?.material_id ? matMap.get(materialColor.material_id) ?? null : null
      return {
        ...m,
        reference: m.reference_color_id ? refMap.get(m.reference_color_id) ?? null : null,
        materialColor,
        material,
        production: prodMap.get(m.id) ?? null,
      }
    })
  }

  async search(query: string): Promise<SearchResult> {
    const q = query.trim()
    if (!q) return { references: [], materialColors: [] }
    const like = `%${q.replace(/[%_]/g, '')}%`

    const [refRes, mcRes] = await Promise.all([
      this.sb
        .from(T.ref)
        .select('*')
        .or(`pantone_name.ilike.${like},cp_name.ilike.${like},pantone_code.ilike.${like}`)
        .limit(120),
      this.sb
        .from(T.mc)
        .select('*')
        .eq('slettet', false)
        .or(`kode.ilike.${like},navn.ilike.${like},ral_kode.ilike.${like},legacy_pantone_raw.ilike.${like}`)
        .limit(120),
    ])

    const refCandidates = (refRes.data as ReferenceColor[] | null) ?? []
    const refs = refCandidates
      .map((ref) => ({ ref, score: scoreReference(ref, q) || 1 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)

    const refIds = refs.map((r) => r.ref.id)
    const matchAgg = refIds.length
      ? await this.sb.from(T.matches).select('reference_color_id,status').in('reference_color_id', refIds).eq('slettet', false)
      : { data: [] }
    const aggMap = new Map<string, MatchStatus[]>()
    for (const row of ((matchAgg.data as { reference_color_id: string; status: MatchStatus }[] | null) ?? [])) {
      const arr = aggMap.get(row.reference_color_id) ?? []
      arr.push(row.status)
      aggMap.set(row.reference_color_id, arr)
    }

    const mcCandidates = (mcRes.data as MaterialColor[] | null) ?? []
    const mcScored = mcCandidates
      .map((mc) => ({ mc, score: scoreMaterialColor(mc, q) || 1 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
    const mcIds = mcScored.map((x) => x.mc.id)
    const matIds = [...new Set(mcScored.map((x) => x.mc.material_id).filter(Boolean))] as string[]
    const [mcMatches, mats] = await Promise.all([
      mcIds.length ? this.sb.from(T.matches).select('*').in('material_color_id', mcIds).eq('slettet', false) : Promise.resolve({ data: [] }),
      matIds.length ? this.sb.from(T.materials).select('*').in('id', matIds) : Promise.resolve({ data: [] }),
    ])
    const matMap = new Map(((mats.data as Material[] | null) ?? []).map((m) => [m.id, m]))
    const mcMatchMap = new Map<string, Match[]>()
    for (const m of ((mcMatches.data as Match[] | null) ?? [])) {
      const arr = mcMatchMap.get(m.material_color_id as string) ?? []
      arr.push(m)
      mcMatchMap.set(m.material_color_id as string, arr)
    }

    return {
      references: refs.map(({ ref }) => {
        const statuses = aggMap.get(ref.id) ?? []
        return { ref, matchCount: statuses.length, statuses: [...new Set(statuses)] }
      }),
      materialColors: mcScored.map(({ mc }) => ({
        mc,
        material: mc.material_id ? matMap.get(mc.material_id) ?? null : null,
        matches: mcMatchMap.get(mc.id) ?? [],
      })),
    }
  }

  async getReference(id: string): Promise<ReferenceColor | null> {
    const { data } = await this.sb.from(T.ref).select('*').eq('id', id).maybeSingle()
    return (data as ReferenceColor) ?? null
  }

  async findReferenceByCode(code: string): Promise<ReferenceColor | null> {
    const { data } = await this.sb.from(T.ref).select('*').ilike('pantone_code', code.trim()).limit(1)
    return ((data as ReferenceColor[] | null)?.[0]) ?? null
  }

  async getMatchesForReference(refId: string): Promise<MatchEnriched[]> {
    const { data } = await this.sb.from(T.matches).select('*').eq('reference_color_id', refId).eq('slettet', false)
    return this.enrich((data as Match[]) ?? [])
  }

  async getMatch(id: string): Promise<MatchEnriched | null> {
    const { data } = await this.sb.from(T.matches).select('*').eq('id', id).eq('slettet', false).maybeSingle()
    if (!data) return null
    return (await this.enrich([data as Match]))[0]
  }

  async createMatch(input: CreateMatchInput, user: CurrentUser): Promise<Match> {
    const row = {
      reference_color_id: input.reference_color_id,
      material_color_id: input.material_color_id,
      match_type: input.match_type,
      status: 'forslag' as MatchStatus,
      reference_antaget: input.reference_antaget ?? false,
      note: input.note ?? null,
      source: 'manuel',
      created_by: user.id,
      created_by_navn: user.navn,
      updated_by: user.id,
    }
    const { data, error } = await this.sb.from(T.matches).insert(row).select('*').single()
    if (error) throw error
    await this.addHistory((data as Match).id, { handling: 'oprettet', til_status: 'forslag' }, user)
    return data as Match
  }

  async updateMatch(id: string, patch: UpdateMatchInput, user: CurrentUser): Promise<Match> {
    const { data, error } = await this.sb
      .from(T.matches)
      .update({ ...patch, updated_by: user.id })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    await this.addHistory(id, { handling: 'opdateret' }, user)
    return data as Match
  }

  async setStatus(id: string, input: SetStatusInput, user: CurrentUser): Promise<Match> {
    const current = await this.getMatch(id)
    if (!current) throw new Error('Match ikke fundet')
    const patch: Record<string, unknown> = { status: input.status, updated_by: user.id }
    if (input.status === 'verificeret') {
      patch.verified_by = user.id
      patch.verified_by_navn = user.navn
      patch.verified_at = new Date().toISOString()
      patch.verification_method = input.metode ?? null
      patch.verification_comment = input.kommentar ?? null
      patch.reference_antaget = false
    } else if (input.status === 'afvist') {
      patch.verification_comment = input.kommentar ?? current.verification_comment
    }
    const { data, error } = await this.sb.from(T.matches).update(patch).eq('id', id).select('*').single()
    if (error) throw error
    const handling =
      input.status === 'verificeret' ? 'verificeret' : input.status === 'afvist' ? 'afvist' : 'status_skiftet'
    await this.addHistory(
      id,
      { handling, fra_status: current.status, til_status: input.status, metode: input.metode ?? null, kommentar: input.kommentar ?? null },
      user,
    )
    return data as Match
  }

  private async addHistory(
    matchId: string,
    p: { handling: string; fra_status?: MatchStatus | null; til_status?: MatchStatus | null; metode?: string | null; kommentar?: string | null },
    user: CurrentUser,
  ) {
    await this.sb.from(T.history).insert({
      match_id: matchId,
      handling: p.handling,
      fra_status: p.fra_status ?? null,
      til_status: p.til_status ?? null,
      metode: p.metode ?? null,
      kommentar: p.kommentar ?? null,
      udfoert_af: user.id,
      udfoert_af_navn: user.navn,
    })
  }

  async upsertProduction(matchId: string, input: ProductionInput, user: CurrentUser): Promise<ProductionContext> {
    const existing = await this.sb.from(T.production).select('*').eq('match_id', matchId).eq('slettet', false).maybeSingle()
    let result: ProductionContext
    if (existing.data) {
      const { data, error } = await this.sb.from(T.production).update({ ...input, updated_by: user.id }).eq('id', (existing.data as ProductionContext).id).select('*').single()
      if (error) throw error
      result = data as ProductionContext
    } else {
      const { data, error } = await this.sb.from(T.production).insert({ match_id: matchId, printer: 'Canon Colorado M-series', ...input, created_by: user.id, updated_by: user.id }).select('*').single()
      if (error) throw error
      result = data as ProductionContext
    }
    await this.addHistory(matchId, { handling: 'opdateret', kommentar: 'Produktionskontekst opdateret' }, user)
    return result
  }

  async getVerificationHistory(matchId: string): Promise<VerificationHistory[]> {
    const { data } = await this.sb.from(T.history).select('*').eq('match_id', matchId).order('created_at', { ascending: false })
    return (data as VerificationHistory[]) ?? []
  }

  async listMaterials(): Promise<Material[]> {
    const { data } = await this.sb.from(T.materials).select('*').eq('slettet', false).order('navn')
    return (data as Material[]) ?? []
  }

  async listMaterialColors(materialId?: string): Promise<MaterialColor[]> {
    let q = this.sb.from(T.mc).select('*').eq('slettet', false)
    if (materialId) q = q.eq('material_id', materialId)
    const { data } = await q.order('kode')
    return (data as MaterialColor[]) ?? []
  }

  async createMaterialColor(input: CreateMaterialColorInput, user: CurrentUser): Promise<MaterialColor> {
    const { data, error } = await this.sb.from(T.mc).insert({ ...input, created_by: user.id, updated_by: user.id }).select('*').single()
    if (error) throw error
    return data as MaterialColor
  }

  async listMatches(filter?: { status?: MatchStatus; needsReview?: boolean }): Promise<MatchEnriched[]> {
    let q = this.sb.from(T.matches).select('*').eq('slettet', false)
    if (filter?.status) q = q.eq('status', filter.status)
    if (filter?.needsReview !== undefined) q = q.eq('needs_review', filter.needsReview)
    const { data } = await q.order('updated_at', { ascending: false }).limit(500)
    return this.enrich((data as Match[]) ?? [])
  }

  async recentVerified(limit: number): Promise<MatchEnriched[]> {
    const { data } = await this.sb.from(T.matches).select('*').eq('slettet', false).eq('status', 'verificeret').order('verified_at', { ascending: false }).limit(limit)
    return this.enrich((data as Match[]) ?? [])
  }

  async pendingProposals(limit: number): Promise<MatchEnriched[]> {
    const { data } = await this.sb.from(T.matches).select('*').eq('slettet', false).in('status', ['forslag', 'under_test']).order('updated_at', { ascending: false }).limit(limit)
    return this.enrich((data as Match[]) ?? [])
  }

  async listImportIssues(): Promise<ImportIssue[]> {
    const { data } = await this.sb.from(T.issues).select('*').eq('resolved', false).order('created_at', { ascending: false })
    return (data as ImportIssue[]) ?? []
  }

  private async countMatches(status?: MatchStatus): Promise<number> {
    let q = this.sb.from(T.matches).select('*', { count: 'exact', head: true }).eq('slettet', false)
    if (status) q = q.eq('status', status)
    const { count } = await q
    return count ?? 0
  }

  async stats(): Promise<Stats> {
    const [refCount, matchCount, forslag, under_test, verificeret, afvist, issues] = await Promise.all([
      this.sb.from(T.ref).select('*', { count: 'exact', head: true }).then((r) => r.count ?? 0),
      this.countMatches(),
      this.countMatches('forslag'),
      this.countMatches('under_test'),
      this.countMatches('verificeret'),
      this.countMatches('afvist'),
      this.sb.from(T.issues).select('*', { count: 'exact', head: true }).eq('resolved', false).then((r) => r.count ?? 0),
    ])
    return { referenceCount: refCount, matchCount, forslag, under_test, verificeret, afvist, issuesOpen: issues }
  }
}
