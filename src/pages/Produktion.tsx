import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, Search, X } from 'lucide-react'
import { getStore } from '../data'
import type { FarveValg, PrintopskriftView } from '../lib/types'
import { Swatch } from '../components/Swatch'
import { StatusBadge } from '../components/StatusBadge'
import { formatCmyk, parseCmyk } from '../lib/cmyk'
import { farveHref } from '../lib/nav'
import { EmptyState, Spinner } from '../components/common'

function harCmyk(o: PrintopskriftView['opskrift']): boolean {
  return o.cmyk_c != null && o.cmyk_m != null && o.cmyk_y != null && o.cmyk_k != null
}

export default function Produktion() {
  const store = getStore()
  const navigate = useNavigate()
  const [alle, setAlle] = useState<PrintopskriftView[] | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    store.listPrintopskrifter().then(setAlle)
  }, [store])

  const cmyk = parseCmyk(q)
  const vist = useMemo(() => {
    if (!alle) return null
    if (!q.trim()) return alle
    if (cmyk) return alle.filter((v) => v.opskrift.cmyk_c === cmyk.c && v.opskrift.cmyk_m === cmyk.m && v.opskrift.cmyk_y === cmyk.y && v.opskrift.cmyk_k === cmyk.k)
    const t = q.trim().toLowerCase()
    return alle.filter((v) => `${v.maalfarve.titel} ${v.opskrift.medie ?? ''} ${v.opskrift.printmode ?? ''}`.toLowerCase().includes(t))
  }, [alle, q, cmyk])

  function openFarve(v: FarveValg) {
    const href = farveHref(v)
    if (href) navigate(href)
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <Link to="/" className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={15} /> Tilbage
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Printer size={22} />
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Canon Colorado / ONYX</h1>
      </div>
      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 18px' }}>
        Registrerede printopskrifter — hvordan vi reproducerer farver.
      </p>

      <div style={{ position: 'relative', marginBottom: 18 }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--color-text-muted)' }} />
        <input className="smu-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Søg CMYK (fx C0 M100 Y80 K5), medie eller farve…" style={{ padding: '11px 36px' }} />
        {q && (
          <button onClick={() => setQ('')} aria-label="Ryd" style={{ position: 'absolute', right: 10, top: 11, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {vist === null ? (
        <Spinner />
      ) : vist.length === 0 ? (
        <EmptyState icon={Printer} title={q.trim() ? 'Ingen printopskrifter matcher' : 'Ingen printopskrifter endnu'}>
          Opret en printopskrift fra en farves side.
        </EmptyState>
      ) : (
        <div className="smu-card" style={{ overflow: 'hidden' }}>
          {vist.map((v, i) => (
            <div
              key={v.opskrift.id}
              className="smu-clickable"
              onClick={() => openFarve(v.maalfarve)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: i ? '1px solid var(--color-border-soft)' : undefined, cursor: 'pointer' }}
            >
              <Swatch hex={v.maalfarve.hex} size={40} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{v.maalfarve.titel}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {harCmyk(v.opskrift) ? formatCmyk({ c: v.opskrift.cmyk_c, m: v.opskrift.cmyk_m, y: v.opskrift.cmyk_y, k: v.opskrift.cmyk_k }) : 'Opskrift'}
                  {v.opskrift.medie ? ` · ${v.opskrift.medie}` : ''}
                </div>
              </div>
              <StatusBadge status={v.opskrift.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
