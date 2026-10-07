import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Palette, Search, X } from 'lucide-react'
import { getStore } from '../data'
import type { ReferenceFarve } from '../lib/types'
import { EmptyState, Spinner } from '../components/common'

export default function RalBibliotek() {
  const store = getStore()
  const navigate = useNavigate()
  const [farver, setFarver] = useState<ReferenceFarve[] | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    store.listRalFarver().then(setFarver)
  }, [store])

  const vist = useMemo(() => {
    if (!farver) return null
    const t = q.trim().toLowerCase().replace(/^ral\s*/i, '')
    if (!t) return farver
    return farver.filter((f) => f.kode.toLowerCase().includes(t) || f.navn.toLowerCase().includes(t))
  }, [farver, q])

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      <Link to="/" className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={15} /> Tilbage
      </Link>

      <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 2px' }}>RAL Classic</h1>
      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 18px' }}>
        Referencebibliotek{farver ? ` · ${farver.length} farver` : ''} · digitale farver er vejledende
      </p>

      <div style={{ position: 'relative', marginBottom: 18 }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--color-text-muted)' }} />
        <input className="smu-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Søg RAL-kode eller navn — fx 3020 eller traffic red" style={{ padding: '11px 36px' }} />
        {q && (
          <button onClick={() => setQ('')} aria-label="Ryd" style={{ position: 'absolute', right: 10, top: 11, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {vist === null ? (
        <Spinner label="Indlæser RAL Classic…" />
      ) : vist.length === 0 ? (
        <EmptyState icon={Palette} title={q.trim() ? 'Ingen RAL-farver matcher' : 'RAL Classic er tom'}>
          {q.trim() ? 'Prøv en anden kode eller et andet navn.' : 'Kræver login mod det delte projekt (vises ikke i lokal dev).'}
        </EmptyState>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
          {vist.map((f) => (
            <button
              key={f.id}
              onClick={() => navigate(`/ral/${f.id}`)}
              className="smu-card smu-clickable"
              style={{ padding: 10, textAlign: 'left', cursor: 'pointer', background: 'var(--color-surface)' }}
            >
              <div
                style={{
                  height: 64,
                  borderRadius: 8,
                  background: f.hex || 'var(--color-grey-soft)',
                  border: '1px solid var(--color-border)',
                  marginBottom: 8,
                  display: 'grid',
                  placeItems: 'center',
                }}
                aria-label={f.hex ? `Vejledende farveprøve RAL ${f.kode}` : 'Ingen digital farve'}
              >
                {!f.hex && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)' }}>ingen farve</span>}
              </div>
              <div style={{ fontWeight: 800, fontSize: 13 }}>RAL {f.kode}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.navn.replace(/^RAL\s*\d+\s*/i, '') || f.navn}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
