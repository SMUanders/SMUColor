import { BookMarked, Info } from 'lucide-react'
import type { ReferenceColor } from '../lib/types'
import { formatCmyk, formatLab, formatRgb } from '../lib/color'
import { Swatch } from './Swatch'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  )
}

function BlockHeader({ children, tone }: { children: React.ReactNode; tone: 'spot' | 'cp' }) {
  const isSpot = tone === 'spot'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 18px',
        background: isSpot ? 'var(--color-teal-soft)' : 'var(--color-primary-soft)',
        color: isSpot ? 'var(--color-teal-deep)' : 'var(--color-primary-deep)',
        fontWeight: 800,
        fontSize: 12,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
      }}
    >
      <BookMarked size={15} />
      {children}
    </div>
  )
}

/**
 * To lag, tydeligt adskilt:
 *  1) Spotfarve (C) — standarden/målet (Pantones målte spotfarve). Ankeret.
 *  2) Color Bridge (CP) — Pantones CMYK-procesreference. Allerede en reference.
 * Ingen af dem er Signmeups verificerede produktionssandhed.
 */
export function ReferenceCard({ color: ref }: { color: ReferenceColor }) {
  const hasCp = ref.cmyk_c != null

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* 1) SPOTFARVE (C) — STANDARD */}
      <div className="smu-card" style={{ overflow: 'hidden' }}>
        <BlockHeader tone="spot">Spotfarve (C) — standard</BlockHeader>
        <div style={{ padding: 18, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Swatch hex={ref.hex} size={92} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16, flex: 1, minWidth: 220 }}>
            <Field label="Lab (målt)" value={formatLab(ref.lab_l, ref.lab_a, ref.lab_b)} />
            <Field label="RGB (sRGB)" value={formatRgb(ref.srgb_r, ref.srgb_g, ref.srgb_b)} />
            <Field label="HEX" value={ref.hex} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px 18px', borderTop: '1px solid var(--color-border-soft)', background: 'var(--color-row-bg)' }}>
          <Info size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)' }}>
            <b>{ref.pantone_name}</b> er spotfarve-standarden — kundens/tegnestuens mål. Kilde: {ref.source_version || ref.source}. Skærmfarven er kun visuel hjælp.
          </div>
        </div>
      </div>

      {/* 2) COLOR BRIDGE (CP) — CMYK-REFERENCE */}
      <div className="smu-card" style={{ overflow: 'hidden' }}>
        <BlockHeader tone="cp">Color Bridge (CP) — CMYK-reference{ref.cp_name ? ` · ${ref.cp_name}` : ''}</BlockHeader>
        {hasCp ? (
          <>
            <div style={{ padding: 18, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <Swatch hex={ref.cp_hex} size={92} label="CMYK-sim." />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16, flex: 1, minWidth: 220 }}>
                <Field label="CMYK" value={formatCmyk(ref.cmyk_c!, ref.cmyk_m!, ref.cmyk_y!, ref.cmyk_k!)} />
                {ref.cp_hex && <Field label="HEX (CMYK-sim.)" value={ref.cp_hex} />}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px 18px', borderTop: '1px solid var(--color-border-soft)', background: 'var(--color-row-bg)' }}>
              <Info size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                Dette er Pantones <b>CP</b> — deres CMYK-procesgengivelse af spotfarven. Altså <b>allerede en reference</b>, ikke sandheden
                og aldrig en universel opskrift. Signmeups verificerede produktionsmatch er sandheden.
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: '16px 18px', fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>
            Ingen Color Bridge CMYK-reference for denne spotfarve.
          </div>
        )}
      </div>
    </div>
  )
}
