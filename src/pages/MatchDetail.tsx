import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { getStore } from '../data'
import { useAuth } from '../context/AuthContext'
import type { MatchEnriched, VerificationHistory } from '../lib/types'
import { Swatch } from '../components/Swatch'
import { StatusBadge } from '../components/StatusBadge'
import { MatchCard } from '../components/MatchCard'
import { ErrorState, SectionTitle, Spinner } from '../components/common'
import { STATUS_META } from '../lib/status'

/**
 * Read-only matchdetalje — åben for alle brugere med aktiv Color-adgang
 * (RLS: `har_app_adgang('color')`). Viser reference, match/materiale, status,
 * produktionskontekst, verifikationsoplysninger, note og historik. Kun redaktør
 * får handlingen "Rediger / verificér" (→ /match/:id/rediger, beskyttet af
 * RequireRedaktoer + RLS `har_app_rolle('color','redaktoer')`).
 *
 * Statusvisningen gør det tydeligt, at forslag/under test IKKE er verificeret:
 * MatchCard viser kun verifikationsboksen når status er `verificeret`, og
 * STATUS_META bærer hint-teksten for ikke-verificerede matches.
 */
export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>()
  const store = getStore()
  const { user } = useAuth()
  const canEdit = Boolean(user?.erRedaktoer)

  const [match, setMatch] = useState<MatchEnriched | null | undefined>(undefined)
  const [history, setHistory] = useState<VerificationHistory[]>([])

  useEffect(() => {
    if (!matchId) return
    setMatch(undefined)
    store.getMatch(matchId).then(setMatch)
    store.getVerificationHistory(matchId).then(setHistory)
  }, [matchId, store])

  if (match === undefined) return <Spinner label="Indlæser match…" />
  if (match === null) return <ErrorState title="Matchet blev ikke fundet" />

  const backHref = match.reference_color_id ? `/farve/${match.reference_color_id}` : '/'
  const meta = STATUS_META[match.status]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link to={backHref} className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={15} /> Tilbage
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Match</h1>
        <StatusBadge status={match.status} />
        {canEdit && (
          <Link
            to={`/match/${match.id}/rediger`}
            className="smu-btn-secondary"
            style={{ marginLeft: 'auto', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Pencil size={14} /> Rediger / verificér
          </Link>
        )}
      </div>

      {/* Status-hint: gør forslag/under test tydeligt forskellig fra verificeret. */}
      {meta.hint && (
        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 16px' }}>
          {meta.hint}
        </p>
      )}

      {/* Reference-kontekst (hvis matchet har en Pantone-reference) */}
      {match.reference && (
        <Link
          to={`/farve/${match.reference.id}`}
          className="smu-card smu-clickable"
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, marginBottom: 14, textDecoration: 'none', color: 'inherit' }}
        >
          <Swatch hex={match.reference.hex} size={44} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--color-text-muted)' }}>Reference</div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{match.reference.pantone_name}</div>
          </div>
        </Link>
      )}

      {/* Selve matchet — samme kort som på farvedetaljen, her uden redigér-knap (canEdit=false). */}
      <MatchCard match={match} canEdit={false} />

      {/* Historik (read-only, append-only) */}
      <section style={{ marginTop: 24 }}>
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
    case 'status_skiftet': return 'Status skiftet'
    case 'opdateret': return 'Opdateret'
    default: return h.handling
  }
}
