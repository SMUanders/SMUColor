import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { getStore } from '../data'
import type { MatchEnriched } from '../lib/types'
import { STATUS_META } from '../lib/status'
import { formatCmyk, formatLab } from '../lib/color'
import { Spinner } from '../components/common'

/**
 * Printvenligt fysisk referenceark. Skærmfarver er kun vejledende — den fysiske
 * folie-/printprøve tapes på arket. Ny printer/medie/profil = ny test/record;
 * arket overskriver aldrig en tidligere test.
 */
export default function ReferenceSheet() {
  const { matchId } = useParams<{ matchId: string }>()
  const store = getStore()
  const [match, setMatch] = useState<MatchEnriched | null | undefined>(undefined)
  const [qr, setQr] = useState<string | null>(null)

  useEffect(() => {
    if (!matchId) return
    store.getMatch(matchId).then(setMatch)
    const url = `${window.location.origin}/match/${matchId}`
    import('qrcode')
      .then((m) => m.default.toDataURL(url, { margin: 1, width: 150 }))
      .then(setQr)
      .catch(() => setQr(null))
  }, [matchId, store])

  if (match === undefined) return <Spinner label="Indlæser…" />
  if (match === null) return <div style={{ padding: 24 }}>Matchet blev ikke fundet.</div>

  const ref = match.reference
  const mc = match.materialColor
  const prod = match.production
  const idag = new Date().toLocaleDateString('da-DK', { day: '2-digit', month: 'long', year: 'numeric' })
  const ansvarlig = match.verified_by_navn ?? match.created_by_navn ?? '—'

  return (
    <div className="ark-root">
      {/* Skærm-kontroller (skjules ved print) */}
      <div className="no-print" style={{ maxWidth: 800, margin: '0 auto', padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link to={`/match/${matchId}`} className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <ArrowLeft size={15} /> Tilbage
        </Link>
        <button className="smu-btn-primary" onClick={() => window.print()} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Printer size={16} /> Udskriv
        </button>
      </div>

      <div className="ark">
        <header className="ark-head">
          <div>
            <div className="ark-title">SMU Color — Referenceark</div>
            <div className="ark-sub">Fysisk farve-/produktionsprøve. Skærmfarver er kun vejledende.</div>
          </div>
          <div className="ark-qr">
            {qr ? <img src={qr} alt="QR til digital post" width={92} height={92} /> : <div className="ark-qr-fallback" />}
            <div className="ark-id">SMU Color-ID<br /><b>{matchId}</b></div>
          </div>
        </header>

        <section className="ark-grid">
          <Field label="Status" value={STATUS_META[match.status].label} />
          <Field label="Dato" value={idag} />
          <Field label="Ansvarlig" value={ansvarlig} />
          {ref && <Field label="Pantone C (reference)" value={ref.pantone_name} />}
          {ref && <Field label="Lab (målt spot)" value={formatLab(ref.lab_l, ref.lab_a, ref.lab_b)} />}
          {ref?.cp_name && <Field label="CP (CMYK-reference)" value={`${ref.cp_name}  ·  CMYK ${formatCmyk(ref.cmyk_c ?? 0, ref.cmyk_m ?? 0, ref.cmyk_y ?? 0, ref.cmyk_k ?? 0)}`} />}
          {mc && <Field label="Materialefarve" value={`${match.material?.navn ?? ''} ${mc.kode}${mc.navn ? ' · ' + mc.navn : ''}${mc.ral_kode ? ' · RAL ' + mc.ral_kode : ''}`.trim()} />}
          {prod?.printer && <Field label="Printer" value={prod.printer} />}
          {prod?.medie && <Field label="Medie / materiale" value={prod.medie} />}
          {prod?.mediegruppe && <Field label="Mediegruppe" value={prod.mediegruppe} />}
          {prod?.printmode && <Field label="Printmode" value={prod.printmode} />}
          {prod?.profil && <Field label="Profil" value={prod.profil} />}
          {prod?.quick_set && <Field label="Quick Set" value={prod.quick_set} />}
          {prod?.outputopskrift && <Field label="Outputopskrift" value={prod.outputopskrift} full />}
          {match.note && <Field label="Noter" value={match.note} full />}
        </section>

        {/* Fysiske prøvefelter — tape/klæb folie eller printprøve her */}
        <section className="ark-samples">
          {['REFERENCEPRØVE', 'TESTPRØVE', 'GODKENDT PRØVE'].map((t) => (
            <div key={t} className="ark-sample">
              <div className="ark-sample-label">{t}</div>
              <div className="ark-sample-box" />
            </div>
          ))}
        </section>

        <footer className="ark-foot">
          Den fysiske prøve er facit ved printerskift, medieskift og profilændring. En ny produktionskontekst = en ny test/record — overskriv aldrig en tidligere prøve.
        </footer>
      </div>
    </div>
  )
}

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'ark-field ark-field-full' : 'ark-field'}>
      <div className="ark-field-label">{label}</div>
      <div className="ark-field-value">{value}</div>
    </div>
  )
}
