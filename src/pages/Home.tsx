import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, CircleDashed, Layers, Search, X } from 'lucide-react'
import { getStore } from '../data'
import type { SearchResult } from '../data/store'
import type { MatchEnriched, MatchStatus } from '../lib/types'
import { Swatch } from '../components/Swatch'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState, SectionTitle, Spinner } from '../components/common'
import { STATUS_ORDER } from '../lib/status'

function orderStatuses(statuses: MatchStatus[]): MatchStatus[] {
  return STATUS_ORDER.filter((s) => statuses.includes(s))
}

export default function Home() {
  const store = getStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResult(null)
      setSearching(false)
      return
    }
    setSearching(true)
    const t = setTimeout(async () => {
      const r = await store.search(q)
      setResult(r)
      setSearching(false)
    }, 140)
    return () => clearTimeout(t)
  }, [query, store])

  const hasResults = result && (result.references.length > 0 || result.materialColors.length > 0)

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

        {result && hasResults && <Results result={result} onOpenRef={(id) => navigate(`/farve/${id}`)} />}

        {!query.trim() && <HomeOverview />}
      </div>
    </div>
  )
}

function Results({ result, onOpenRef }: { result: SearchResult; onOpenRef: (id: string) => void }) {
  return (
    <div style={{ display: 'grid', gap: 22 }}>
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
  const [verified, setVerified] = useState<MatchEnriched[] | null>(null)
  const [pending, setPending] = useState<MatchEnriched[] | null>(null)

  useEffect(() => {
    store.recentVerified(5).then(setVerified)
    store.pendingProposals(5).then(setPending)
  }, [store])

  const loading = verified === null || pending === null
  const empty = useMemo(() => !loading && verified!.length === 0 && pending!.length === 0, [loading, verified, pending])

  if (loading) return <Spinner label="Indlæser…" />
  if (empty) {
    return (
      <EmptyState icon={Search} title="Søg efter en farve for at komme i gang">
        Skriv et Pantone-nummer, en foliekode eller et farvenavn i feltet ovenfor.
      </EmptyState>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 22, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <MiniList title="Senest verificeret" icon={<CheckCircle2 size={14} />} items={verified!} emptyText="Ingen verificerede matches endnu." />
      <MiniList title="Forslag der afventer" icon={<CircleDashed size={14} />} items={pending!} emptyText="Ingen forslag i kø." />
    </div>
  )
}

function MiniList({ title, items, emptyText }: { title: string; icon: React.ReactNode; items: MatchEnriched[]; emptyText: string }) {
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <div className="smu-card" style={{ overflow: 'hidden' }}>
        {items.length === 0 ? (
          <div style={{ padding: '18px 16px', fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>{emptyText}</div>
        ) : (
          items.map((m, i) => (
            <Link
              key={m.id}
              to={m.reference_color_id ? `/farve/${m.reference_color_id}` : `/match/${m.id}`}
              className="smu-clickable"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', textDecoration: 'none', color: 'inherit', borderTop: i ? '1px solid var(--color-border-soft)' : undefined }}
            >
              <Swatch hex={m.reference?.hex} size={38} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{m.reference?.pantone_name ?? 'Uden reference'}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.materialColor ? `${m.material?.navn ?? ''} ${m.materialColor.kode}`.trim() : m.match_type}
                </div>
              </div>
              <StatusBadge status={m.status} />
            </Link>
          ))
        )}
      </div>
    </section>
  )
}
