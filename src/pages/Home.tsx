import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Layers, Palette, Plus, Search, X } from 'lucide-react'
import { getStore } from '../data'
import { useAuth } from '../context/AuthContext'
import type { SearchResult, Stats } from '../data/store'
import type { FarveValg, MatchEnriched, MatchStatus, SourceFolie } from '../lib/types'
import { Swatch } from '../components/Swatch'
import { StatusBadge } from '../components/StatusBadge'
import { FarveValgRow } from '../components/FarveValgRow'
import { EmptyState, SectionTitle, Spinner } from '../components/common'
import { STATUS_ORDER } from '../lib/status'

function folieToValg(f: SourceFolie): FarveValg {
  return {
    kind: 'source',
    refId: f.source_variant_id,
    titel: `${f.producent ?? ''} ${f.serie ?? ''} ${f.kode}`.replace(/\s+/g, ' ').trim(),
    undertekst: f.producent_farvenavn ?? f.variant_navn,
    hex: f.digital_srgb,
    vejledende: true,
    aktiv: f.aktiv,
  }
}

function orderStatuses(statuses: MatchStatus[]): MatchStatus[] {
  return STATUS_ORDER.filter((s) => statuses.includes(s))
}

export default function Home() {
  const store = getStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [folier, setFolier] = useState<SourceFolie[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResult(null)
      setFolier([])
      setSearching(false)
      return
    }
    setSearching(true)
    const t = setTimeout(async () => {
      const [r, f] = await Promise.all([store.search(q), store.searchSourceFolie(q)])
      setResult(r)
      setFolier(f)
      setSearching(false)
    }, 140)
    return () => clearTimeout(t)
  }, [query, store])

  const hasResults = Boolean(result && (result.references.length > 0 || result.materialColors.length > 0 || folier.length > 0))

  return (
    <div>
      {/* Søgefelt — det primære element */}
      <div style={{ maxWidth: 720, margin: '8px auto 0' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: 16, top: 16, color: 'var(--color-text-muted)' }} />
          <input
            ref={inputRef}
            className="smu-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søg farve — fx 186, 186 CP, PANTONE 300, RAL 3020, 751-031, rød…"
            style={{ padding: '15px 44px', fontSize: 17, borderRadius: 12 }}
            aria-label="Søg farve"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              aria-label="Ryd"
              style={{ position: 'absolute', right: 12, top: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <X size={20} />
            </button>
          )}
        </div>
        <p style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)', marginTop: 10 }}>
          Color Bridge-reference + Signmeups egne folie-, print- og materialematches.
        </p>
      </div>

      <div style={{ maxWidth: 860, margin: '26px auto 0' }}>
        {searching && !result && <Spinner label="Søger…" />}

        {query.trim() && result && !hasResults && !searching && (
          <EmptyState icon={Search} title={`Ingen træf på “${query.trim()}”`}>
            Prøv et Pantone-nummer (fx 186), en foliekode (fx 751-031), RAL (fx 3020) eller et farvenavn.
          </EmptyState>
        )}

        {result && hasResults && (
          <Results
            result={result}
            folier={folier}
            onOpenRef={(id) => navigate(`/farve/${id}`)}
            onOpenFolie={(id) => navigate(`/folie/${id}`)}
          />
        )}

        {!query.trim() && <HomeOverview />}
      </div>
    </div>
  )
}

function Results({
  result,
  folier,
  onOpenRef,
  onOpenFolie,
}: {
  result: SearchResult
  folier: SourceFolie[]
  onOpenRef: (id: string) => void
  onOpenFolie: (id: string) => void
}) {
  return (
    <div style={{ display: 'grid', gap: 22 }}>
      {folier.length > 0 && (
        <section>
          <SectionTitle>Folier (Source)</SectionTitle>
          <div className="smu-card" style={{ overflow: 'hidden' }}>
            {folier.map((f, i) => (
              <FarveValgRow key={f.source_variant_id} valg={folieToValg(f)} border={i > 0} onClick={() => onOpenFolie(f.source_variant_id)} />
            ))}
          </div>
        </section>
      )}

      {result.references.length > 0 && (
        <section>
          <SectionTitle>Referencefarver (Color Bridge)</SectionTitle>
          <div className="smu-card" style={{ overflow: 'hidden' }}>
            {result.references.map(({ ref, matchCount, statuses }, i) => (
              <div
                key={ref.id}
                className="smu-clickable"
                onClick={() => onOpenRef(ref.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderTop: i ? '1px solid var(--color-border-soft)' : undefined }}
              >
                <Swatch hex={ref.hex} size={46} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{ref.pantone_name}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    Spot {ref.hex}
                    {ref.cmyk_c != null && ` · CP CMYK ${Math.round(ref.cmyk_c)}/${Math.round(ref.cmyk_m!)}/${Math.round(ref.cmyk_y!)}/${Math.round(ref.cmyk_k!)}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {matchCount === 0 ? (
                    <span className="smu-badge smu-badge-grey">Ingen SMU-match</span>
                  ) : (
                    orderStatuses(statuses).map((s) => <StatusBadge key={s} status={s} />)
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {result.materialColors.length > 0 && (
        <section>
          <SectionTitle>Materialefarver (folie / RAL)</SectionTitle>
          <div className="smu-card" style={{ overflow: 'hidden' }}>
            {result.materialColors.map(({ mc, material, matches }, i) => {
              const withRef = matches.find((m) => m.reference_color_id)
              const clickable = Boolean(withRef?.reference_color_id)
              return (
                <div
                  key={mc.id}
                  className={clickable ? 'smu-clickable' : undefined}
                  onClick={() => withRef?.reference_color_id && onOpenRef(withRef.reference_color_id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderTop: i ? '1px solid var(--color-border-soft)' : undefined, cursor: clickable ? 'pointer' : 'default' }}
                >
                  <span style={{ width: 46, height: 46, borderRadius: 10, background: 'var(--color-grey-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Layers size={20} style={{ color: 'var(--color-grey-deep)' }} />
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>
                      {material?.navn ? `${material.navn} ` : ''}{mc.kode}
                      {mc.navn && <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}> · {mc.navn}</span>}
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      {mc.ral_kode && `RAL ${mc.ral_kode} · `}
                      {mc.legacy_pantone_raw && `Pantone ${mc.legacy_pantone_raw} (legacy) · `}
                      {matches.length} match{matches.length === 1 ? '' : 'es'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {orderStatuses([...new Set(matches.map((m) => m.status))]).map((s) => (
                      <StatusBadge key={s} status={s} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function HomeOverview() {
  const store = getStore()
  const { user } = useAuth()
  const canEdit = Boolean(user?.erRedaktoer)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<MatchEnriched[] | null>(null)

  useEffect(() => {
    store.stats().then(setStats)
    store.recentMatches(10).then(setRecent)
  }, [store])

  if (stats === null || recent === null) return <Spinner label="Indlæser…" />

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Tælletal — altid fra faktiske data (store.stats), aldrig hardcodet. */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <StatCard icon={<Palette size={18} />} value={stats.referenceCount} label="Pantone-referencer" />
        <StatCard icon={<Layers size={18} />} value={stats.matchCount} label="Farvematches" />
        <StatCard icon={<CheckCircle2 size={18} />} value={stats.verificeret} label="Verificerede" accent />
      </div>

      {/* Primær handling — kun for redaktører (skriveret). */}
      {canEdit && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            to="/relation/ny"
            className="smu-btn-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7 }}
          >
            <Plus size={16} /> Opret farverelation
          </Link>
          <Link
            to="/match/ny"
            className="smu-btn-secondary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7 }}
          >
            Opret match (Pantone)
          </Link>
        </div>
      )}

      {/* Seneste 10 matches, uanset status — sorteret efter seneste ændring. */}
      <section>
        <SectionTitle>Seneste matches</SectionTitle>
        {recent.length === 0 ? (
          <EmptyState icon={Layers} title="Ingen farvematches endnu">
            {canEdit
              ? 'Opret det første match med knappen ovenfor, eller søg en farve for at komme i gang.'
              : 'Der er endnu ikke oprettet matches. Søg en farve ovenfor for at se referencer.'}
          </EmptyState>
        ) : (
          <div className="smu-card" style={{ overflow: 'hidden' }}>
            {recent.map((m, i) => (
              <Link
                key={m.id}
                to={`/match/${m.id}`}
                className="smu-clickable"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', textDecoration: 'none', color: 'inherit', borderTop: i ? '1px solid var(--color-border-soft)' : undefined }}
              >
                <Swatch hex={m.reference?.hex} size={40} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{m.reference?.pantone_name ?? 'Uden reference'}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.materialColor ? `${m.material?.navn ?? ''} ${m.materialColor.kode}`.trim() : 'Uden materiale'}
                  </div>
                </div>
                <StatusBadge status={m.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ icon, value, label, accent }: { icon: ReactNode; value: number; label: string; accent?: boolean }) {
  return (
    <div className="smu-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ color: accent ? 'var(--color-teal-deep)' : 'var(--color-text-muted)', display: 'inline-flex' }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 800, fontSize: 22, lineHeight: 1 }}>{value.toLocaleString('da-DK')}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )
}
