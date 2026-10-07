// Supabase-adapter — den rigtige, delte backend. Samme interface som localStore.
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  CmykVaerdier,
  CreatePrintopskriftInput,
  CurrentUser,
  FarveValg,
  ImportIssue,
  Match,
  MatchEnriched,
  MatchStatus,
  Material,
  MaterialColor,
  NodeType,
  Printopskrift,
  PrintopskriftView,
  ProductionContext,
  ReferenceColor,
  ReferenceFarve,
  RelationView,
  SourceBibliotek,
  SourceFolie,
  VerificationHistory,
} from '../lib/types'

import { folieToValg, parseFolieQuery } from '../lib/folie'

// DB-knude: type = 'reference' | 'source' | 'lokal'. Referencefarver (Pantone
// OG RAL) hænger på reference_farve_id → farve_reference_farver. Pantone-rækken
// peger videre via pantone_color_id (backing); RAL har inline kode/navn/hex.
interface NodeRow {
  id: string
  type: 'reference' | 'source' | 'lokal'
  reference_farve_id: string | null
  source_variant_id: string | null
  material_color_id: string | null
}
// Kun materiale-baserede knuder slås op direkte på deres egen kolonne.
const NODE_COL: Record<'source' | 'lokal', 'source_variant_id' | 'material_color_id'> = {
  source: 'source_variant_id',
  lokal: 'material_color_id',
}

/** Række fra farve_reference_farver med indlejret bibliotek + Pantone-backing. */
interface RefFarveRow {
  id: string
  kode: string
  navn: string
  hex: string | null
  pantone_color_id: string | null
  kilde?: string | null
  kilde_version?: string | null
  bibliotek?: { kode: string; navn: string } | null
  pantone?: { id: string; pantone_name: string; cp_name: string | null; hex: string | null } | null
}
const REF_FARVE_SELECT =
  'id,kode,navn,hex,pantone_color_id,kilde,kilde_version,' +
  'bibliotek:farve_reference_biblioteker(kode,navn),' +
  'pantone:farve_reference_colors(id,pantone_name,cp_name,hex)'

/**
 * Referencefarve-række → palette-neutralt FarveValg. Pantone-backet række giver
 * et 'pantone'-valg (refId = pantone_color_id, hex = målt spot = sandhed). Ellers
 * et 'ral'-valg (refId = reference_farve_id, hex = VEJLEDENDE digital farve).
 */
function refRowToValg(row: RefFarveRow): FarveValg {
  if (row.pantone) {
    return { kind: 'pantone', refId: row.pantone.id, titel: row.pantone.pantone_name, undertekst: row.pantone.cp_name, hex: row.pantone.hex, vejledende: false, aktiv: true }
  }
  return { kind: 'ral', refId: row.id, titel: row.navn, undertekst: row.bibliotek?.navn ?? 'Reference', hex: row.hex, vejledende: true, aktiv: true }
}
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

  async recentMatches(limit: number): Promise<MatchEnriched[]> {
    const { data } = await this.sb.from(T.matches).select('*').eq('slettet', false).order('updated_at', { ascending: false }).limit(limit)
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

  // ── V1.2: Source folie + knuder/relationer ──────────────────────────────

  async searchSourceFolie(query: string): Promise<SourceFolie[]> {
    const q = query.trim()
    if (!q) return []
    const { serie, kode, rest } = parseFolieQuery(q)
    const term = kode || rest || serie || q
    const { data, error } = await this.sb.rpc('farve_source_foliefarver', { _soeg: term, _variant_id: null, _limit: 80 })
    if (error) return []
    let list = (data as SourceFolie[]) ?? []
    if (serie) {
      const s = serie.replace(/\s+/g, '')
      list = list.filter(
        (f) => (f.serie ?? '').replace(/\s+/g, '').toLowerCase().includes(s) || (f.produkt_navn ?? '').toLowerCase().includes(s),
      )
    }
    if (kode) {
      const k = kode
      list = list.filter((f) => f.kode.toLowerCase().includes(k))
      // Eksakt kode-match først (præcist produkt/kode-match prioriteres).
      list = list.slice().sort((a, b) => Number(b.kode.toLowerCase() === k) - Number(a.kode.toLowerCase() === k))
    }
    return list.slice(0, 40)
  }

  async getSourceFolie(variantId: string): Promise<SourceFolie | null> {
    const { data, error } = await this.sb.rpc('farve_source_foliefarver', { _soeg: null, _variant_id: variantId, _limit: 1 })
    if (error) return null
    return ((data as SourceFolie[] | null)?.[0]) ?? null
  }

  private async nodeToFarveValg(node: NodeRow): Promise<FarveValg> {
    if (node.type === 'reference' && node.reference_farve_id) {
      const { data } = await this.sb.from('farve_reference_farver').select(REF_FARVE_SELECT).eq('id', node.reference_farve_id).maybeSingle()
      if (data) return refRowToValg(data as unknown as RefFarveRow)
      return { kind: 'ral', refId: node.reference_farve_id, titel: 'Reference', undertekst: null, hex: null, vejledende: true, aktiv: false }
    }
    if (node.type === 'source' && node.source_variant_id) {
      const f = await this.getSourceFolie(node.source_variant_id)
      if (f) return folieToValg(f)
      return { kind: 'source', refId: node.source_variant_id, titel: 'Udgået folie', undertekst: null, hex: null, vejledende: true, aktiv: false }
    }
    if (node.material_color_id) {
      const { data } = await this.sb.from(T.mc).select('*').eq('id', node.material_color_id).maybeSingle()
      const mc = data as MaterialColor | null
      return { kind: 'lokal', refId: node.material_color_id, titel: mc?.kode ?? 'Lokal', undertekst: mc?.navn ?? (mc?.ral_kode ? `RAL ${mc.ral_kode}` : null), hex: mc?.hex ?? null, vejledende: false, aktiv: true }
    }
    return { kind: 'lokal', refId: '', titel: 'Ukendt', aktiv: false }
  }

  /**
   * Oversæt (palette-kind, refId) → reference_farve_id for referencefarver.
   * pantone: find (create=false) eller materialisér lazy via RPC (create=true)
   * identitetsrækken for Pantone-farven. ral: refId ER reference_farve_id.
   */
  private async refFarveId(kind: 'pantone' | 'ral', refId: string, create: boolean): Promise<string | null> {
    if (kind === 'ral') return refId
    if (create) {
      const { data, error } = await this.sb.rpc('farve_reference_farve_for_pantone', { _pantone_color_id: refId })
      if (error) throw error
      return (data as string) ?? null
    }
    const { data } = await this.sb.from('farve_reference_farver').select('id').eq('pantone_color_id', refId).eq('slettet', false).maybeSingle()
    return data ? (data as { id: string }).id : null
  }

  private async findNodeId(kind: NodeType, refId: string): Promise<string | null> {
    if (kind === 'pantone' || kind === 'ral') {
      const rfId = await this.refFarveId(kind, refId, false)
      if (!rfId) return null
      const { data } = await this.sb.from('farve_noder').select('id').eq('type', 'reference').eq('reference_farve_id', rfId).eq('slettet', false).maybeSingle()
      return data ? (data as { id: string }).id : null
    }
    const { data } = await this.sb.from('farve_noder').select('id').eq('type', kind).eq(NODE_COL[kind], refId).eq('slettet', false).maybeSingle()
    return data ? (data as { id: string }).id : null
  }

  async getRelationsForColor(kind: NodeType, refId: string): Promise<RelationView[]> {
    const nodeId = await this.findNodeId(kind, refId)
    if (!nodeId) return []
    const { data: rels } = await this.sb
      .from('farve_relationer')
      .select('*')
      .or(`fra_node_id.eq.${nodeId},til_node_id.eq.${nodeId}`)
      .eq('slettet', false)
      .order('created_at', { ascending: false })
    const list = (rels as { id: string; status: MatchStatus; note: string | null; created_at: string; fra_node_id: string; til_node_id: string }[] | null) ?? []
    if (list.length === 0) return []
    const otherIds = [...new Set(list.map((r) => (r.fra_node_id === nodeId ? r.til_node_id : r.fra_node_id)))]
    const { data: others } = await this.sb.from('farve_noder').select('*').in('id', otherIds)
    const valgMap = new Map<string, FarveValg>()
    for (const n of (others as NodeRow[] | null) ?? []) valgMap.set(n.id, await this.nodeToFarveValg(n))
    return list.map((r) => {
      const otherId = r.fra_node_id === nodeId ? r.til_node_id : r.fra_node_id
      return { id: r.id, status: r.status, note: r.note, created_at: r.created_at, modpart: valgMap.get(otherId) ?? { kind: 'lokal', refId: '', titel: 'Ukendt', aktiv: false } }
    })
  }

  private async findOrCreateNode(kind: NodeType, refId: string, user: CurrentUser): Promise<string> {
    const existing = await this.findNodeId(kind, refId)
    if (existing) return existing
    const row: Record<string, unknown> = { created_by: user.id, created_by_navn: user.navn, updated_by: user.id }
    if (kind === 'pantone' || kind === 'ral') {
      // Pantone: materialisér identitetsrækken lazy (RPC); RAL: refId er allerede reference_farve_id.
      const rfId = await this.refFarveId(kind, refId, true)
      if (!rfId) throw new Error('Kunne ikke bestemme referencefarve.')
      // Dobbelttjek efter lazy-oprettelse (Pantone kan nu have fået sin knude).
      const after = await this.sb.from('farve_noder').select('id').eq('type', 'reference').eq('reference_farve_id', rfId).eq('slettet', false).maybeSingle()
      if (after.data) return (after.data as { id: string }).id
      row.type = 'reference'
      row.reference_farve_id = rfId
    } else {
      row.type = kind
      row[NODE_COL[kind]] = refId
    }
    const { data, error } = await this.sb.from('farve_noder').insert(row).select('id').single()
    if (error) throw error
    return (data as { id: string }).id
  }

  // ── Referencebiblioteker (RAL Classic m.fl.) ────────────────────────────

  private _ralBibId: string | null | undefined
  private async ralBibliotekId(): Promise<string | null> {
    if (this._ralBibId !== undefined) return this._ralBibId
    const { data } = await this.sb.from('farve_reference_biblioteker').select('id').eq('kode', 'ral_classic').maybeSingle()
    this._ralBibId = data ? (data as { id: string }).id : null
    return this._ralBibId
  }

  async searchRal(query: string): Promise<FarveValg[]> {
    const q = query.trim()
    if (!q) return []
    const bibId = await this.ralBibliotekId()
    if (!bibId) return []
    const digits = q.match(/\d{3,4}/)?.[0] ?? null
    const text = q.replace(/^\s*ral\s*/i, '').replace(/[%_]/g, '').trim()
    let qb = this.sb.from('farve_reference_farver').select(REF_FARVE_SELECT).eq('bibliotek_id', bibId).eq('slettet', false).limit(60)
    if (digits) qb = qb.or(`kode.eq.${digits},navn.ilike.%${text}%`)
    else qb = qb.ilike('navn', `%${text}%`)
    const { data, error } = await qb
    if (error) return []
    const rows = ((data as unknown as RefFarveRow[]) ?? []).slice()
    // Eksakt kode-match først (fx "3020" → RAL 3020 øverst).
    if (digits) rows.sort((a, b) => Number(b.kode === digits) - Number(a.kode === digits))
    return rows.slice(0, 40).map(refRowToValg)
  }

  async getRalFarve(refId: string): Promise<ReferenceFarve | null> {
    const { data } = await this.sb.from('farve_reference_farver').select(REF_FARVE_SELECT).eq('id', refId).eq('slettet', false).maybeSingle()
    if (!data) return null
    const r = data as unknown as RefFarveRow
    return {
      id: r.id,
      bibliotek_kode: r.bibliotek?.kode ?? '',
      bibliotek_navn: r.bibliotek?.navn ?? 'Reference',
      kode: r.kode,
      navn: r.navn,
      hex: r.hex,
      kilde: r.kilde ?? null,
      kilde_version: r.kilde_version ?? null,
    }
  }

  async listRalFarver(): Promise<ReferenceFarve[]> {
    const bibId = await this.ralBibliotekId()
    if (!bibId) return []
    const { data } = await this.sb.from('farve_reference_farver').select(REF_FARVE_SELECT).eq('bibliotek_id', bibId).eq('slettet', false).order('kode').limit(1000)
    return ((data as unknown as RefFarveRow[]) ?? []).map((r) => ({
      id: r.id,
      bibliotek_kode: r.bibliotek?.kode ?? 'ral_classic',
      bibliotek_navn: r.bibliotek?.navn ?? 'RAL Classic',
      kode: r.kode,
      navn: r.navn,
      hex: r.hex,
      kilde: r.kilde ?? null,
      kilde_version: r.kilde_version ?? null,
    }))
  }

  async createRelationMellem(
    a: { kind: NodeType; refId: string },
    b: { kind: NodeType; refId: string },
    note: string | null,
    user: CurrentUser,
  ): Promise<{ id: string }> {
    if (a.kind === b.kind && a.refId === b.refId) throw new Error('Vælg to forskellige farver.')
    const fra = await this.findOrCreateNode(a.kind, a.refId, user)
    const til = await this.findOrCreateNode(b.kind, b.refId, user)
    if (fra === til) throw new Error('Vælg to forskellige farver.')
    const { data, error } = await this.sb
      .from('farve_relationer')
      .insert({ fra_node_id: fra, til_node_id: til, status: 'forslag', note: note ?? null, created_by: user.id, created_by_navn: user.navn, updated_by: user.id })
      .select('id')
      .single()
    if (error) {
      if (/duplicate key|unique|par_uq/i.test(error.message)) {
        throw new Error('Der findes allerede en relation mellem de to farver.')
      }
      throw error
    }
    return { id: (data as { id: string }).id }
  }

  // ── V1.3: palette-browsing + printopskrifter + CMYK ─────────────────────

  async listBiblioteker(): Promise<SourceBibliotek[]> {
    const { data, error } = await this.sb.rpc('farve_source_biblioteker')
    if (error) return []
    return (data as SourceBibliotek[]) ?? []
  }

  async listSerieVarianter(serie: string): Promise<SourceFolie[]> {
    const { data, error } = await this.sb.rpc('farve_source_serie_varianter', { _serie: serie, _limit: 500 })
    if (error) return []
    return (data as SourceFolie[]) ?? []
  }

  private async enrichOpskrifter(list: Printopskrift[]): Promise<PrintopskriftView[]> {
    if (list.length === 0) return []
    const nodeIds = [...new Set(list.map((o) => o.node_id))]
    const { data: nodes } = await this.sb.from('farve_noder').select('*').in('id', nodeIds)
    const valgMap = new Map<string, FarveValg>()
    for (const n of (nodes as NodeRow[] | null) ?? []) valgMap.set(n.id, await this.nodeToFarveValg(n))
    return list.map((o) => ({ opskrift: o, maalfarve: valgMap.get(o.node_id) ?? { kind: 'lokal', refId: '', titel: 'Ukendt', aktiv: false } }))
  }

  async getPrintopskrifterForColor(kind: NodeType, refId: string): Promise<Printopskrift[]> {
    const nodeId = await this.findNodeId(kind, refId)
    if (!nodeId) return []
    const { data } = await this.sb.from('farve_printopskrift').select('*').eq('node_id', nodeId).eq('slettet', false).order('created_at', { ascending: false })
    return (data as Printopskrift[]) ?? []
  }

  async createPrintopskrift(color: { kind: NodeType; refId: string }, input: CreatePrintopskriftInput, user: CurrentUser): Promise<{ id: string }> {
    const nodeId = await this.findOrCreateNode(color.kind, color.refId, user)
    const kanal = input.cmyk ? { C: input.cmyk.c, M: input.cmyk.m, Y: input.cmyk.y, K: input.cmyk.k } : null
    const row = {
      node_id: nodeId,
      printer: input.printer ?? 'Canon Colorado M-series',
      medie: input.medie ?? null,
      printmode: input.printmode ?? null,
      profil_quickset: input.profil_quickset ?? null,
      kanalvaerdier: kanal,
      cmyk_c: input.cmyk?.c ?? null,
      cmyk_m: input.cmyk?.m ?? null,
      cmyk_y: input.cmyk?.y ?? null,
      cmyk_k: input.cmyk?.k ?? null,
      outputopskrift: input.outputopskrift ?? null,
      note: input.note ?? null,
      status: 'forslag' as MatchStatus,
      created_by: user.id,
      created_by_navn: user.navn,
      updated_by: user.id,
    }
    const { data, error } = await this.sb.from('farve_printopskrift').insert(row).select('id').single()
    if (error) throw error
    return { id: (data as { id: string }).id }
  }

  async listPrintopskrifter(): Promise<PrintopskriftView[]> {
    const { data } = await this.sb.from('farve_printopskrift').select('*').eq('slettet', false).order('created_at', { ascending: false }).limit(200)
    return this.enrichOpskrifter((data as Printopskrift[]) ?? [])
  }

  async searchPrintopskriftByCmyk(cmyk: CmykVaerdier): Promise<PrintopskriftView[]> {
    const { data } = await this.sb
      .from('farve_printopskrift')
      .select('*')
      .eq('slettet', false)
      .eq('cmyk_c', cmyk.c)
      .eq('cmyk_m', cmyk.m)
      .eq('cmyk_y', cmyk.y)
      .eq('cmyk_k', cmyk.k)
      .order('created_at', { ascending: false })
      .limit(50)
    return this.enrichOpskrifter((data as Printopskrift[]) ?? [])
  }

  async searchReferenceByCmyk(cmyk: CmykVaerdier): Promise<ReferenceColor[]> {
    const { data } = await this.sb
      .from(T.ref)
      .select('*')
      .eq('cmyk_c', cmyk.c)
      .eq('cmyk_m', cmyk.m)
      .eq('cmyk_y', cmyk.y)
      .eq('cmyk_k', cmyk.k)
      .limit(30)
    return (data as ReferenceColor[]) ?? []
  }
}
