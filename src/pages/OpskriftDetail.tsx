import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { getStore } from '../data'
import { useAuth } from '../context/AuthContext'
import type { PrintopskriftView, VerificationHistory } from '../lib/types'
import { Swatch } from '../components/Swatch'
import { StatusBadge } from '../components/StatusBadge'
import { formatCmyk } from '../lib/cmyk'
import { farveHref } from '../lib/nav'
import { ErrorState, SectionTitle, Spinner } from '../components/common'
import { STATUS_META } from '../lib/status'

function harCmyk(o: PrintopskriftView['opskrift']): boolean {
  return o.cmyk_c != null && o.cmyk_m != null && o.cmyk_y != null && o.cmyk_k != null
}

/** Ekstra kanaler ud over CMYK (fx fremtidige spots) — vises kun hvis de findes. */
function ekstraKanaler(kanal: Record<string, number> | null): [string, number][] {
  if (!kanal) return []
  return Object.entries(kanal).filter(([k]) => !['C', 'M', 'Y', 'K'].includes(k))
}

export default function OpskriftDetail() {
  const { id } = useParams<{ id: string }>()
  const store = getStore()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canEdit = Boolean(user?.erRedaktoer)

  const [view, setView] = useState<PrintopskriftView | null | undefined>(undefined)
  const [history, setHistory] = useState<VerificationHistory[]>([])

  useEffect(() => {
    if (!id) return
    setView(undefined)
    setHistory([])
    store.getPrintopskrift(id).then(setView)
    store.getPrintopskriftHistorik(id).then(setHistory)
  }, [id, store])

  if (view === undefined) return <Spinner label="Indlæser printopskrift…" />
  if (view === null || !id) return <ErrorState title="Printopskriften blev ikke fundet" />

  const o = view.opskrift
  const farve = view.maalfarve
  const farveUrl = farveHref(farve)
  const meta = STATUS_META[o.status]
  const ekstra = ekstraKanaler(o.kanalvaerdier)

  const felter: [string, string][] = [
    ['Printer', o.printer ?? '—'],
    ['Medie', o.medie ?? '—'],
    ['Printmode', o.printmode ?? '—'],
    ['Profil / Quick Set', o.profil_quickset ?? '—'],
    ['CMYK', harCmyk(o) ? formatCmyk({ c: o.cmyk_c, m: o.cmyk_m, y: o.cmyk_y, k: o.cmyk_k }) : '—'],
  ]
  if (ekstra.length) felter.push(['Ekstra kanaler', ekstra.map(([k, v]) => `${k} ${v}`).join(' · ')])

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link to={farveUrl ?? '/'} className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={15} /> Tilbage til farven
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Printopskrift</h1>
        <StatusBadge status={o.status} />
        {canEdit && (
          <Link to={`/opskrift/${o.id}/rediger`} className="smu-btn-secondary" style={{ marginLeft: 'auto', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Pencil size={14} /> Rediger
          </Link>
        )}
      </div>

      {meta.hint && (
        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 16px' }}>{meta.hint}</p>
      )}

      {/* Hvilken farve opskriften tilhører */}
      <div
        className={farveUrl ? 'smu-card smu-clickable' : 'smu-card'}
        onClick={farveUrl ? () => navigate(farveUrl) : undefined}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, marginBottom: 14, cursor: farveUrl ? 'pointer' : 'default' }}
      >
        <Swatch hex={farve.hex} size={44} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--color-text-muted)' }}>Målfarve</div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{farve.titel}</div>
        </div>
      </div>

      {/* Alle registrerede felter */}
      <div className="smu-card" style={{ overflow: 'hidden' }}>
        {felter.map(([label, val], i) => (
          <div key={label} style={{ display: 'flex', gap: 12, padding: '11px 16px', borderTop: i ? '1px solid var(--color-border-soft)' : undefined }}>
            <div style={{ minWidth: 150, fontSize: 12.5, fontWeight: 700, color: 'var(--color-text-muted)' }}>{label}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{val}</div>
          </div>
        ))}
      </div>

      {o.outputopskrift && (
        <section style={{ marginTop: 18 }}>
          <SectionTitle>Rå outputopskrift</SectionTitle>
          <div className="smu-card" style={{ padding: 14, fontSize: 13, fontWeight: 600, whiteSpace: 'pre-wrap' }}>{o.outputopskrift}</div>
        </section>
      )}

      {o.note && (
        <section style={{ marginTop: 18 }}>
          <SectionTitle>Note</SectionTitle>
          <div className="smu-card" style={{ padding: 14, fontSize: 13, fontWeight: 600, whiteSpace: 'pre-wrap' }}>{o.note}</div>
        </section>
      )}

      {/* Verificering — kun når faktisk verificeret */}
      {o.status === 'verificeret' && (
        <section style={{ marginTop: 18 }}>
          <SectionTitle>Verificering</SectionTitle>
          <div className="smu-card" style={{ padding: 14, display: 'grid', gap: 6, fontSize: 13, fontWeight: 600 }}>
            <div>Verificeret af {o.verified_by_navn ?? 'ukendt'}{o.verified_at ? ` · ${new Date(o.verified_at).toLocaleDateString('da-DK')}` : ''}</div>
            {o.verification_method && <div style={{ color: 'var(--color-text-muted)' }}>Metode: {o.verification_method}</div>}
            {o.verification_comment && <div style={{ color: 'var(--color-text-muted)' }}>{o.verification_comment}</div>}
          </div>
        </section>
      )}

      {/* Historik (read-only, append-only) */}
      <section style={{ marginTop: 18 }}>
        <SectionTitle>Historik</SectionTitle>
        <div className="smu-card" style={{ padding: history.length ? 12 : '16px', overflow: 'hidden' }}>
          {history.length === 0 ? (
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>Ingen hændelser endnu.</div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {history.map((h) => (
                <div key={h.id} style={{ display: 'flex', gap: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  <span style={{ minWidth: 132, color: 'var(--color-text)' }}>
                    {new Date(h.created_at).toLocaleString('da-DK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>
                    <b style={{ color: 'var(--color-text)' }}>{handlingLabel(h)}</b>
                    {h.til_status && ` → ${STATUS_META[h.til_status].label}`} · {h.udfoert_af_navn ?? 'ukendt'}
                    {h.kommentar && ` · ${h.kommentar}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function handlingLabel(h: VerificationHistory): string {
  switch (h.handling) {
    case 'oprettet': return 'Oprettet'
    case 'verificeret': return 'Verificeret'
    case 'afvist': return 'Afvist'
    case 'genaabnet': return 'Genåbnet'
    case 'status_skiftet': return 'Status skiftet'
    case 'opdateret': return 'Opdateret'
    default: return h.handling
  }
}
