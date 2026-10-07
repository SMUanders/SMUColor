import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Save, Search, X } from 'lucide-react'
import { getStore } from '../data'
import { useAuth } from '../context/AuthContext'
import type { FarveValg, ReferenceColor } from '../lib/types'
import { Swatch } from '../components/Swatch'
import { FarveValgRow } from '../components/FarveValgRow'
import { folieToValg } from '../lib/folie'
import { farveHref } from '../lib/nav'
import { SectionTitle, Spinner } from '../components/common'

function refToValg(r: ReferenceColor): FarveValg {
  return { kind: 'pantone', refId: r.id, titel: r.pantone_name, undertekst: r.cp_name, hex: r.hex, vejledende: false, aktiv: true }
}

/** Søg + vælg én farve på tværs af paletter. Udgåede Source-folier vises, men kan ikke vælges. */
function FarveVaelger({ onPick }: { onPick: (v: FarveValg) => void }) {
  const store = getStore()
  const [q, setQ] = useState('')
  const [refs, setRefs] = useState<FarveValg[]>([])
  const [ral, setRal] = useState<FarveValg[]>([])
  const [folier, setFolier] = useState<FarveValg[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const query = q.trim()
    if (!query) {
      setRefs([])
      setRal([])
      setFolier([])
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      const [r, rl, f] = await Promise.all([store.search(query), store.searchRal(query), store.searchSourceFolie(query)])
      setRefs(r.references.slice(0, 15).map((x) => refToValg(x.ref)))
      setRal(rl.slice(0, 15))
      setFolier(f.map(folieToValg))
      setLoading(false)
    }, 160)
    return () => clearTimeout(t)
  }, [q, store])

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <Search size={17} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-muted)' }} />
        <input
          className="smu-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Søg Pantone eller folie — fx 186, 751, rød…"
          style={{ padding: '10px 36px' }}
        />
        {q && (
          <button onClick={() => setQ('')} aria-label="Ryd" style={{ position: 'absolute', right: 10, top: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={16} />
          </button>
        )}
      </div>
      {loading && <Spinner label="Søger…" />}
      {!loading && q.trim() && refs.length === 0 && ral.length === 0 && folier.length === 0 && (
        <div style={{ padding: 12, fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>Ingen træf.</div>
      )}
      {refs.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={labelStyle}>Pantone</div>
          <div className="smu-card" style={{ overflow: 'hidden' }}>
            {refs.map((v, i) => (
              <FarveValgRow key={v.refId} valg={v} border={i > 0} onClick={() => onPick(v)} right={<ArrowRight size={15} style={{ color: 'var(--color-text-muted)' }} />} />
            ))}
          </div>
        </div>
      )}
      {ral.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={labelStyle}>RAL Classic</div>
          <div className="smu-card" style={{ overflow: 'hidden' }}>
            {ral.map((v, i) => (
              <FarveValgRow key={v.refId} valg={v} border={i > 0} onClick={() => onPick(v)} right={<ArrowRight size={15} style={{ color: 'var(--color-text-muted)' }} />} />
            ))}
          </div>
        </div>
      )}
      {folier.length > 0 && (
        <div>
          <div style={labelStyle}>Folier (Source)</div>
          <div className="smu-card" style={{ overflow: 'hidden' }}>
            {folier.map((v, i) => {
              const udgaaet = v.aktiv === false
              return (
                <FarveValgRow
                  key={v.refId}
                  valg={v}
                  border={i > 0}
                  disabled={udgaaet}
                  onClick={udgaaet ? undefined : () => onPick(v)}
                  right={udgaaet ? <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>kan ikke vælges</span> : <ArrowRight size={15} style={{ color: 'var(--color-text-muted)' }} />}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ValgtKort({ valg, onRyd }: { valg: FarveValg; onRyd?: () => void }) {
  return (
    <div className="smu-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
      <Swatch hex={valg.hex} size={40} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>{valg.titel}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
          {valg.kind === 'pantone' ? 'Pantone' : valg.kind === 'ral' ? 'RAL Classic' : valg.kind === 'source' ? 'Source-folie' : 'Lokal'}
          {valg.undertekst ? ` · ${valg.undertekst}` : ''}
          {valg.vejledende && valg.hex ? ' · vejledende farve' : ''}
        </div>
      </div>
      {onRyd && (
        <button onClick={onRyd} className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          <X size={14} /> Skift
        </button>
      )}
    </div>
  )
}

export default function RelationNy() {
  const store = getStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const state = (useLocation().state ?? {}) as { fra?: FarveValg }

  const [a, setA] = useState<FarveValg | null>(state.fra ?? null)
  const [b, setB] = useState<FarveValg | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)

  const klar = useMemo(() => Boolean(a && b && !(a.kind === b.kind && a.refId === b.refId)), [a, b])

  async function gem() {
    if (!a || !b || !user) return
    setSaving(true)
    setError(null)
    try {
      await store.createRelationMellem({ kind: a.kind, refId: a.refId }, { kind: b.kind, refId: b.refId }, note.trim() || null, user)
      navigate(farveHref(a) ?? '/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunne ikke gemme farvematchet.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link to="/" className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={15} /> Tilbage
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 18px' }}>Opret farvematch</h1>

      {error && (
        <div style={{ background: 'var(--color-red-soft)', color: 'var(--color-red-deep)', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Trin 1 — første farve */}
      <section style={{ marginBottom: 20 }}>
        <SectionTitle>1 · Første farve</SectionTitle>
        {a ? <ValgtKort valg={a} onRyd={() => setA(null)} /> : <FarveVaelger onPick={setA} />}
      </section>

      {/* Trin 2 — anden farve */}
      <section style={{ marginBottom: 20 }}>
        <SectionTitle>2 · Anden farve</SectionTitle>
        {b ? <ValgtKort valg={b} onRyd={() => setB(null)} /> : a ? <FarveVaelger onPick={setB} /> : <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', padding: '4px 2px' }}>Vælg den første farve først.</div>}
      </section>

      {/* Trin 3 — note */}
      <section style={{ marginBottom: 24 }}>
        <SectionTitle>3 · Note (valgfri)</SectionTitle>
        <textarea ref={noteRef} className="smu-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Fri note om farvematchet…" />
      </section>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="smu-btn-primary" onClick={gem} disabled={!klar || saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Save size={16} /> {saving ? 'Gemmer…' : 'Gem som forslag'}
        </button>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--color-text-muted)' }}>
          <Check size={14} /> Gemmes som forslag — ikke verificeret
        </span>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--color-text-muted)', margin: '0 0 6px 2px' }
