import { Link } from 'react-router-dom'
import { AlertTriangle, FileClock, Pencil, Printer, User } from 'lucide-react'
import type { MatchEnriched, MatchType } from '../lib/types'
import { StatusBadge } from './StatusBadge'

const TYPE_LABEL: Record<MatchType, string> = {
  folie: 'Foliematch',
  print: 'Printmatch',
  ral: 'RAL-match',
  cmyk: 'CMYK-match',
  materiale: 'Materialematch',
  andet: 'Match',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
      <span style={{ fontWeight: 700, color: 'var(--color-text-muted)', minWidth: 108 }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  )
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('da-DK', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function MatchCard({ match, canEdit }: { match: MatchEnriched; canEdit: boolean }) {
  const mc = match.materialColor
  const prod = match.production
  const isVerified = match.status === 'verificeret'

  return (
    <div
      className="smu-card"
      style={{ overflow: 'hidden', borderColor: isVerified ? 'var(--color-teal-soft)' : undefined }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--color-border-soft)', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 800, fontSize: 15 }}>{TYPE_LABEL[match.match_type]}</span>
        <StatusBadge status={match.status} />
        {match.needs_review && (
          <span className="smu-badge smu-badge-orange" title="Kræver manuel gennemgang">
            <AlertTriangle size={11} /> Til gennemgang
          </span>
        )}
        {canEdit && (
          <Link to={`/match/${match.id}`} className="smu-btn-secondary" style={{ marginLeft: 'auto', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Pencil size={14} /> {isVerified || match.status === 'afvist' ? 'Rediger' : 'Rediger / verificér'}
          </Link>
        )}
      </div>

      <div style={{ padding: 16, display: 'grid', gap: 14 }}>
        {/* Materiale */}
        {mc && (
          <div style={{ display: 'grid', gap: 4 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>
              {match.material?.navn ? `${match.material.navn} ` : ''}{mc.kode}
              {mc.navn && <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}> · {mc.navn}</span>}
            </div>
            {(mc.ral_kode || mc.apa_kode) && (
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                {mc.ral_kode && `RAL ${mc.ral_kode}`}{mc.ral_kode && mc.apa_kode ? ' · ' : ''}{mc.apa_kode && `APA ${mc.apa_kode}`}
              </div>
            )}
          </div>
        )}

        {/* Antaget reference */}
        {match.reference_antaget && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--color-orange-soft)', color: 'var(--color-orange-deep)', borderRadius: 8, padding: '9px 12px' }}>
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>
              Referencen er <b>antaget</b> (fx fra et legacy-tal), ikke bekræftet. Verificér for at gøre den til Signmeup-viden.
            </span>
          </div>
        )}

        {/* Produktionskontekst */}
        {prod && (
          <div style={{ background: 'var(--color-row-bg)', borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--color-text-muted)', marginBottom: 8 }}>
              <Printer size={14} /> Produktion
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              {prod.printer && <Row label="Printer" value={prod.printer} />}
              {prod.medie && <Row label="Medie" value={prod.medie} />}
              {prod.mediegruppe && <Row label="Mediegruppe" value={prod.mediegruppe} />}
              {prod.printmode && <Row label="Printmode" value={prod.printmode} />}
              {prod.profil && <Row label="Profil" value={prod.profil} />}
              {prod.quick_set && <Row label="Quick Set" value={prod.quick_set} />}
              {prod.outputopskrift && <Row label="Outputopskrift" value={prod.outputopskrift} />}
              {prod.note && <Row label="Note" value={prod.note} />}
            </div>
          </div>
        )}

        {/* Verifikation */}
        {isVerified && (
          <div style={{ background: 'var(--color-teal-soft)', borderRadius: 10, padding: 12, display: 'grid', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--color-teal-deep)', marginBottom: 4 }}>
              <User size={14} /> Verificeret
            </div>
            <Row label="Verificeret af" value={match.verified_by_navn ?? '—'} />
            <Row label="Dato" value={fmtDate(match.verified_at)} />
            {match.verification_method && <Row label="Metode / kilde" value={match.verification_method} />}
            {match.verification_comment && <Row label="Kommentar" value={match.verification_comment} />}
          </div>
        )}

        {match.status === 'afvist' && match.verification_comment && (
          <div style={{ background: 'var(--color-red-soft)', color: 'var(--color-red-deep)', borderRadius: 8, padding: '9px 12px', fontSize: 12.5, fontWeight: 700 }}>
            Afvist: {match.verification_comment}
          </div>
        )}

        {/* Manuel note vises; auto-genereret legacy-boilerplate skjules (provenance står i Kilde-linjen). */}
        {match.note && match.source !== 'import_legacy' && (
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)' }}>{match.note}</div>
        )}

        {/* Kilde / sporbarhed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border-soft)', paddingTop: 10 }}>
          <FileClock size={13} />
          {match.source === 'import_legacy'
            ? `Kilde: ${match.source_file}${match.source_row ? ` · række ${match.source_row}` : ''}`
            : `Oprettet af ${match.created_by_navn ?? 'ukendt'}`}
        </div>
      </div>
    </div>
  )
}
