import { useEffect, useState } from 'react'
import { ArrowRight, Search, X } from 'lucide-react'
import { getStore } from '../data'
import type { FarveValg, ReferenceColor } from '../lib/types'
import { FarveValgRow } from './FarveValgRow'
import { folieToValg } from '../lib/folie'
import { Spinner } from './common'

function refToValg(r: ReferenceColor): FarveValg {
  return { kind: 'pantone', refId: r.id, titel: r.pantone_name, undertekst: r.cp_name, hex: r.hex, vejledende: false, aktiv: true }
}

const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--color-text-muted)', margin: '0 0 6px 2px' }

/** Søg + vælg én farve på tværs af paletter (Pantone, RAL, Source-folier). */
export function FarveVaelger({ onPick }: { onPick: (v: FarveValg) => void }) {
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
          placeholder="Søg Pantone, RAL eller folie — fx 186, RAL 3020, 751…"
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
