import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { getStore } from '../data'
import type { SearchResult } from '../data/store'
import type { SourceFolie } from '../lib/types'
import { Swatch } from '../components/Swatch'
import { FarveValgRow } from '../components/FarveValgRow'
import { folieToValg } from '../lib/folie'
import { EmptyState, SectionTitle, Spinner } from '../components/common'

const EKSEMPLER = ['186', '751-031', 'ORACAL 751C 031', 'rød']

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

  const aktiv = query.trim().length > 0
  const hasResults = Boolean(result && (result.references.length > 0 || folier.length > 0))

  return (
    <div>
      {/* Hero — søgning er den klare indgang */}
      <div style={{ maxWidth: 680, margin: aktiv ? '4px auto 0' : '10vh auto 0', textAlign: 'center', transition: 'margin 0.2s' }}>
        {!aktiv && (
          <>
            <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 6px', letterSpacing: -0.3 }}>Find en farve</h1>
            <p style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 22px' }}>
              Søg på Pantone, folie, produktkode eller farvenavn.
            </p>
          </>
        )}

        <div style={{ position: 'relative', textAlign: 'left' }}>
          <Search size={20} style={{ position: 'absolute', left: 16, top: 17, color: 'var(--color-text-muted)' }} />
          <input
            ref={inputRef}
            className="smu-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="fx 186 · PANTONE 300 · 751-031 · ORACAL 751C 031 · rød"
            style={{ padding: '16px 46px', fontSize: 17, borderRadius: 14 }}
            aria-label="Find en farve"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Ryd"
              style={{ position: 'absolute', right: 14, top: 15, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {!aktiv && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
            {EKSEMPLER.map((e) => (
              <button
                key={e}
                onClick={() => setQuery(e)}
                className="smu-badge smu-badge-grey"
                style={{ cursor: 'pointer', border: 'none', fontSize: 12.5, padding: '6px 12px' }}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {aktiv && (
        <div style={{ maxWidth: 860, margin: '24px auto 0' }}>
          {searching && !result && <Spinner label="Søger…" />}

          {result && !hasResults && !searching && (
            <EmptyState icon={Search} title={`Ingen træf på “${query.trim()}”`}>
              Prøv et Pantone-nummer (fx 186), en foliekode (fx 751-031) eller et farvenavn.
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
        </div>
      )}
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
      {result.references.length > 0 && (
        <section>
          <SectionTitle>Pantone</SectionTitle>
          <div className="smu-card" style={{ overflow: 'hidden' }}>
            {result.references.map(({ ref }, i) => (
              <div
                key={ref.id}
                className="smu-clickable"
                onClick={() => onOpenRef(ref.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderTop: i ? '1px solid var(--color-border-soft)' : undefined }}
              >
                <Swatch hex={ref.hex} size={44} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{ref.pantone_name}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    Spot {ref.hex}
                    {ref.cmyk_c != null && ` · CP CMYK ${Math.round(ref.cmyk_c)}/${Math.round(ref.cmyk_m!)}/${Math.round(ref.cmyk_y!)}/${Math.round(ref.cmyk_k!)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {folier.length > 0 && (
        <section>
          <SectionTitle>Folier</SectionTitle>
          <div className="smu-card" style={{ overflow: 'hidden' }}>
            {folier.map((f, i) => (
              <FarveValgRow key={f.source_variant_id} valg={folieToValg(f)} border={i > 0} onClick={() => onOpenFolie(f.source_variant_id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
