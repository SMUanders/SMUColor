import { X } from 'lucide-react'
import type { FarveValg, NodeType } from '../lib/types'
import { Swatch } from './Swatch'

function kindLabel(k: NodeType): string {
  return k === 'pantone' ? 'Pantone' : k === 'ral' ? 'RAL Classic' : k === 'source' ? 'Source-folie' : 'Lokal'
}

/** Et valgt farvevalg vist som kort, evt. med "Skift"-knap. */
export function FarveValgtKort({ valg, onRyd }: { valg: FarveValg; onRyd?: () => void }) {
  return (
    <div className="smu-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
      <Swatch hex={valg.hex} size={40} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>{valg.titel}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
          {kindLabel(valg.kind)}
          {valg.undertekst ? ` · ${valg.undertekst}` : ''}
          {valg.vejledende && valg.hex ? ' · vejledende farve' : ''}
        </div>
      </div>
      {onRyd && (
        <button onClick={onRyd} className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
          <X size={14} /> Skift
        </button>
      )}
    </div>
  )
}
