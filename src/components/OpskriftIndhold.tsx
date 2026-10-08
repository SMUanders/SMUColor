import type { PrintopskriftView, VerificationHistory } from '../lib/types'
import { formatCmyk } from '../lib/cmyk'
import { SectionTitle } from './common'
import { STATUS_META } from '../lib/status'

function harCmyk(o: PrintopskriftView['opskrift']): boolean {
  return o.cmyk_c != null && o.cmyk_m != null && o.cmyk_y != null && o.cmyk_k != null
}

/** Ekstra kanaler ud over CMYK (fx spots) — vises kun hvis de findes. */
function ekstraKanaler(kanal: Record<string, number> | null): [string, number][] {
  if (!kanal) return []
  return Object.entries(kanal).filter(([k]) => !['C', 'M', 'Y', 'K'].includes(k))
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

/** Fælles indhold for en printopskrift (felter + output + note + verificering + historik). */
export function OpskriftIndhold({ view, history }: { view: PrintopskriftView; history: VerificationHistory[] }) {
  const o = view.opskrift
  const ekstra = ekstraKanaler(o.kanalvaerdier)

  const felter: [string, string][] = [['Printmedie', o.medie ?? '—']]
  if (o.laminat) felter.push(['Laminat', o.laminat])
  felter.push(['Printer', o.printer ?? '—'])
  if (o.media_group) felter.push(['Media Group', o.media_group])
  if (o.media_name) felter.push(['Media Name', o.media_name])
  felter.push(['Print Mode', o.printmode ?? '—'])
  if (o.color_management) felter.push(['Color Management', o.color_management])
  felter.push(['Profil / Quick Set', o.profil_quickset ?? '—'])
  felter.push(['CMYK', harCmyk(o) ? formatCmyk({ c: o.cmyk_c, m: o.cmyk_m, y: o.cmyk_y, k: o.cmyk_k }) : '—'])
  if (ekstra.length) felter.push(['Spots', ekstra.map(([k, v]) => `${k} ${v}`).join(' · ')])

  return (
    <>
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
    </>
  )
}
