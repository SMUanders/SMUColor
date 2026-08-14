import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { getStore } from '../data'
import type { ImportIssue, MatchEnriched, MatchStatus } from '../lib/types'
import type { Stats } from '../data/store'
import { StatusBadge } from '../components/StatusBadge'
import { SectionTitle, Spinner } from '../components/common'
import { STATUS_META } from '../lib/status'

type Filter = MatchStatus | 'alle'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'alle', label: 'Alle' },
  { key: 'forslag', label: 'Forslag' },
  { key: 'under_test', label: 'Under test' },
  { key: 'verificeret', label: 'Verificeret' },
  { key: 'afvist', label: 'Afvist' },
]

export default function Admin() {
  const store = getStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [filter, setFilter] = useState<Filter>('forslag')
  const [matches, setMatches] = useState<MatchEnriched[] | null>(null)
  const [issues, setIssues] = useState<ImportIssue[] | null>(null)

  useEffect(() => {
    store.stats().then(setStats)
    store.listImportIssues().then(setIssues)
  }, [store])

  useEffect(() => {
    setMatches(null)
    store.listMatches(filter === 'alle' ? undefined : { status: filter }).then(setMatches)
  }, [filter, store])

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>Administration</h1>
      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-muted)', margin: '0 0 20px' }}>
        Overblik over matches og deres status samt legacy-rækker til gennemgang.
      </p>

      {/* Stat-kort */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 26 }}>
          <Stat label="Referencefarver" value={stats.referenceCount} />
          <Stat label="Forslag" value={stats.forslag} tone="grey" />
          <Stat label="Under test" value={stats.under_test} tone="orange" />
          <Stat label="Verificeret" value={stats.verificeret} tone="green" />
          <Stat label="Afvist" value={stats.afvist} tone="red" />
        </div>
      )}

      {/* Import-issues */}
      <section style={{ marginBottom: 28 }}>
        <SectionTitle>Legacy til gennemgang</SectionTitle>
        <div className="smu-card" style={{ overflow: 'hidden' }}>
          {issues === null ? (
            <Spinner />
          ) : issues.length === 0 ? (
            <div style={{ padding: '16px', fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>Ingen uafklarede legacy-rækker.</div>
          ) : (
            issues.map((i, idx) => (
              <div key={i.id} style={{ display: 'flex', gap: 10, padding: '11px 16px', borderTop: idx ? '1px solid var(--color-border-soft)' : undefined }}>
                <AlertTriangle size={16} style={{ color: 'var(--color-orange-deep)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13.5 }}>{i.raw_data}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    {i.reason} {i.source_row ? `(${i.source_file} · række ${i.source_row})` : `(${i.source_file})`}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Matches */}
      <section>
        <SectionTitle>Matches</SectionTitle>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button key={f.key} className={filter === f.key ? 'smu-btn-primary' : 'smu-btn-secondary'} onClick={() => setFilter(f.key)} style={{ fontSize: 13 }}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="smu-card" style={{ overflow: 'hidden' }}>
          {matches === null ? (
            <Spinner />
          ) : matches.length === 0 ? (
            <div style={{ padding: '16px', fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>Ingen matches i denne kategori.</div>
          ) : (
            matches.map((m, idx) => (
              <Link
                key={m.id}
                to={`/match/${m.id}`}
                className="smu-clickable"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', textDecoration: 'none', color: 'inherit', borderTop: idx ? '1px solid var(--color-border-soft)' : undefined }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>
                    {m.reference?.pantone_name ?? 'Uden reference'}
                    {m.materialColor && <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}> ↔ {m.material?.navn ?? ''} {m.materialColor.kode}</span>}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    {STATUS_META[m.status].label}
                    {m.reference_antaget && ' · reference antaget'}
                    {m.source === 'import_legacy' && ' · legacy'}
                  </div>
                </div>
                <StatusBadge status={m.status} />
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'grey' | 'orange' | 'green' | 'red' }) {
  const color =
    tone === 'green' ? 'var(--color-teal-deep)' :
    tone === 'orange' ? 'var(--color-orange-deep)' :
    tone === 'red' ? 'var(--color-red-deep)' :
    tone === 'grey' ? 'var(--color-grey-deep)' :
    'var(--color-text)'
  return (
    <div className="smu-card" style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
    </div>
  )
}
