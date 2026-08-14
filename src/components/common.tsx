import type { ReactNode } from 'react'
import { Loader2, type LucideIcon } from 'lucide-react'

export function Spinner({ label }: { label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-muted)', padding: '32px 0', justifyContent: 'center' }}>
      <Loader2 size={20} className="smu-spin" />
      {label && <span style={{ fontWeight: 700 }}>{label}</span>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="smu-card" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      <Icon size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 12 }} />
      <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-text)', marginBottom: 6 }}>{title}</div>
      {children && <div style={{ fontWeight: 600, fontSize: 14, maxWidth: 460, margin: '0 auto' }}>{children}</div>}
    </div>
  )
}

export function ErrorState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="smu-card" style={{ padding: '32px 24px', textAlign: 'center', borderColor: 'var(--color-red-soft)' }}>
      <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-red-deep)', marginBottom: 6 }}>{title}</div>
      {children && <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-muted)' }}>{children}</div>}
    </div>
  )
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 12px' }}>
      <h2 style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: 0 }}>
        {children}
      </h2>
      {right}
    </div>
  )
}
