import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Palette, Printer, Search, X } from 'lucide-react'
import { getStore } from '../data'
import type { SearchResult } from '../data/store'
import type { PrintopskriftView, ReferenceColor, SourceBibliotek, SourceFolie } from '../lib/types'
import { Swatch } from '../components/Swatch'
import { FarveValgRow } from '../components/FarveValgRow'
import { StatusBadge } from '../components/StatusBadge'
import { folieToValg } from '../lib/folie'
import { formatCmyk, parseCmyk } from '../lib/cmyk'
import { EmptyState, SectionTitle, Spinner } from '../components/common'

const EKSEMPLER = ['186', '751-031', 'ORACAL 751C 031', 'C0 M100 Y80 K5']

interface Fund {
  result: SearchResult | null
  folier: SourceFolie[]
  opskrifter: PrintopskriftView[]
  refCmyk: ReferenceColor[]
  cmyk: boolean
}
const TOMT: Fund = { result: null, folier: [], opskrifter: [], refCmyk: [], cmyk: false }

export default function Home() {
  const store = getStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [fund, setFund] = useState<Fund>(TOMT)
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setFund(TOMT)
      setSearching(false)
      return
    }
    setSearching(true)
    const cmyk = parseCmyk(q)
    const t = setTimeout(async () => {
      if (cmyk) {
        const [opskrifter, refCmyk] = await Promise.all([store.searchPrintopskriftByCmyk(cmyk), store.searchReferenceByCmyk(cmyk)])
        setFund({ result: null, folier: [], opskrifter, refCmyk, cmyk: true })
      } else {
        const [result, folier] = await Promise.all([store.search(q), store.searchSourceFolie(q)])
        setFund({ result, folier, opskrifter: [], refCmyk: [], cmyk: false })
      }
      setSearching(false)
    }, 150)
    return () => clearTimeout(t)
  }, [query, store])

  const aktiv = query.trim().length > 0
  const hasResults = fund.cmyk
    ? fund.opskrifter.length > 0 || fund.refCmyk.length > 0
    : Boolean(fund.result && (fund.result.references.length > 0 || fund.folier.length > 0))

  return (
    <div>
      {/* Hero — global søgning */}
      <div style={{ maxWidth: 680, margin: aktiv ? '4px auto 0' : '7vh auto 0', textAlign: 'center', transition: 'margin 0.2s' }}>
        {!aktiv && (
          <>
            <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 6px', letterSpacing: -0.3 }}>SMU Color</h1>
            <p style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 22px' }}>
              Find, sammenlign og reproducér farver.
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
            placeholder="Søg farve eller produktionsviden — fx 751-031, PANTONE 186, C0 M100 Y80 K5"
            style={{ padding: '16px 46px', fontSize: 16.5, borderRadius: 14 }}
            aria-label="Søg i alle farver og produktionsviden"
          />
          {query && (
            <button onClick={() => { setQuery(''); inputRef.current?.focus() }} aria-label="Ryd" style={{ position: 'absolute', right: 14, top: 15, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              <X size={20} />
            </button>
          )}
        </div>
        {!aktiv && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
            {EKSEMPLER.map((e) => (
              <button key={e} onClick={() => setQuery(e)} className="smu-badge smu-badge-grey" style={{ cursor: 'pointer', border: 'none', fontSize: 12.5, padding: '6px 12px' }}>
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {aktiv ? (
        <div style={{ maxWidth: 860, margin: '24px auto 0' }}>
          {searching && !hasResults && <Spinner label="Søger…" />}
          {!searching && !hasResults && (
            <EmptyState icon={Search} title={`Ingen træf på “${query.trim()}”`}>
              Prøv et Pantone-nummer, en foliekode (751-031) eller eksakte CMYK-værdier (C0 M100 Y80 K5).
            </EmptyState>
          )}
          {hasResults && <Resultater fund={fund} navigate={navigate} />}
        </div>
      ) : (
        <div style={{ maxWidth: 900, margin: '40px auto 0' }}>
          <Forside navigate={navigate} />
        </div>
      )}
    </div>
  )
}

function Resultater({ fund, navigate }: { fund: Fund; navigate: (to: string) => void }) {
  if (fund.cmyk) {
    return (
      <div style={{ display: 'grid', gap: 22 }}>
        <section>
          <SectionTitle>Printopskrifter · SMU produktionsviden</SectionTitle>
          {fund.opskrifter.length === 0 ? (
            <div className="smu-card" style={{ padding: '16px', fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>Ingen registreret printopskrift med disse værdier.</div>
          ) : (
            <div className="smu-card" style={{ overflow: 'hidden' }}>
              {fund.opskrifter.map((v, i) => (
                <div key={v.opskrift.id} className="smu-clickable" onClick={() => navigate(v.maalfarve.kind === 'pantone' ? `/farve/${v.maalfarve.refId}` : `/folie/${v.maalfarve.refId}`)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: i ? '1px solid var(--color-border-soft)' : undefined, cursor: 'pointer' }}>
                  <Swatch hex={v.maalfarve.hex} size={40} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{v.maalfarve.titel}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      {formatCmyk({ c: v.opskrift.cmyk_c, m: v.opskrift.cmyk_m, y: v.opskrift.cmyk_y, k: v.opskrift.cmyk_k })}
                      {v.opskrift.medie ? ` · ${v.opskrift.medie}` : ''}
                    </div>
                  </div>
                  <StatusBadge status={v.opskrift.status} />
                </div>
              ))}
            </div>
          )}
        </section>

        {fund.refCmyk.length > 0 && (
          <section>
            <SectionTitle>Pantone reference-CMYK</SectionTitle>
            <div className="smu-card" style={{ overflow: 'hidden' }}>
              {fund.refCmyk.map((r, i) => (
                <div key={r.id} className="smu-clickable" onClick={() => navigate(`/farve/${r.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: i ? '1px solid var(--color-border-soft)' : undefined }}>
                  <Swatch hex={r.hex} size={40} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{r.pantone_name}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Color Bridge CMYK-reference — ikke en verificeret opskrift</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      {fund.result && fund.result.references.length > 0 && (
        <section>
          <SectionTitle>Pantone</SectionTitle>
          <div className="smu-card" style={{ overflow: 'hidden' }}>
            {fund.result.references.map(({ ref }, i) => (
              <div key={ref.id} className="smu-clickable" onClick={() => navigate(`/farve/${ref.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderTop: i ? '1px solid var(--color-border-soft)' : undefined }}>
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

      {fund.folier.length > 0 && (
        <section>
          <SectionTitle>Folier</SectionTitle>
          <div className="smu-card" style={{ overflow: 'hidden' }}>
            {fund.folier.map((f, i) => (
              <FarveValgRow key={f.source_variant_id} valg={folieToValg(f)} border={i > 0} onClick={() => navigate(`/folie/${f.source_variant_id}`)} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Forside({ navigate }: { navigate: (to: string) => void }) {
  const store = getStore()
  const [biblioteker, setBiblioteker] = useState<SourceBibliotek[] | null>(null)

  useEffect(() => {
    store.listBiblioteker().then(setBiblioteker)
  }, [store])

  // Grupper serier pr. produktlinje (fx ORACAL → 651/751C/970…).
  const grupper = new Map<string, SourceBibliotek[]>()
  for (const b of biblioteker ?? []) {
    const key = b.produktlinje ?? 'Andet'
    const arr = grupper.get(key) ?? []
    arr.push(b)
    grupper.set(key, arr)
  }

  return (
    <div style={{ display: 'grid', gap: 28 }}>
      <section>
        <SectionTitle>Farvebiblioteker</SectionTitle>
        {biblioteker === null ? (
          <Spinner />
        ) : grupper.size === 0 ? (
          <div className="smu-card" style={{ padding: '16px', fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>
            Kræver login mod det delte projekt (Source-biblioteker vises ikke i lokal dev).
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {[...grupper.entries()].map(([linje, series]) => (
              <div key={linje} className="smu-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Palette size={16} style={{ color: 'var(--color-text-muted)' }} />
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{linje}</span>
                  {series[0]?.producent && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>· {series[0].producent}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {series.map((s) => (
                    <button key={s.serie ?? ''} onClick={() => navigate(`/bibliotek/${encodeURIComponent(s.serie ?? '')}`)} className="smu-btn-secondary" style={{ fontSize: 13 }}>
                      {s.serie} <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>· {s.antal_varianter}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Produktion</SectionTitle>
        <Link to="/produktion" className="smu-card smu-clickable" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, textDecoration: 'none', color: 'inherit' }}>
          <span style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-navy-soft, var(--color-grey-soft))', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Printer size={20} style={{ color: 'var(--color-navy, var(--color-grey-deep))' }} />
          </span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Canon Colorado / ONYX</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)' }}>Hvordan reproducerer vi farven? Printopskrifter og CMYK-søgning.</div>
          </div>
        </Link>
      </section>
    </div>
  )
}
