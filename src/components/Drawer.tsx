import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

/**
 * Højre side-drawer til farvens arbejdsrum. Åbnes/lukkes via URL (så direkte
 * links og browserens tilbage-knap virker) — denne komponent viser kun panelet.
 * Luk sker via backdrop-klik, Esc eller X → onClose (typisk fjern URL-param).
 */
export function Drawer({ open, title, onClose, children }: { open: boolean; title: ReactNode; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="smu-overlay" onClick={onClose} role="presentation">
      <div
        className="smu-drawer"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '16px 20px',
            background: 'var(--color-bg)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, flex: 1, minWidth: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Luk"
            className="smu-btn-ghost"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 6 }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}
