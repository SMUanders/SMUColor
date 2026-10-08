import { useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Save } from 'lucide-react'
import { getStore } from '../data'
import { useAuth } from '../context/AuthContext'
import type { FarveValg } from '../lib/types'
import { FarveVaelger } from '../components/FarveVaelger'
import { FarveValgtKort } from '../components/FarveValgtKort'
import { farveHref } from '../lib/nav'
import { SectionTitle } from '../components/common'

export default function RelationNy() {
  const store = getStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const state = (useLocation().state ?? {}) as { fra?: FarveValg }

  const [a, setA] = useState<FarveValg | null>(state.fra ?? null)
  const [b, setB] = useState<FarveValg | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)

  const klar = useMemo(() => Boolean(a && b && !(a.kind === b.kind && a.refId === b.refId)), [a, b])

  async function gem() {
    if (!a || !b || !user) return
    setSaving(true)
    setError(null)
    try {
      await store.createRelationMellem({ kind: a.kind, refId: a.refId }, { kind: b.kind, refId: b.refId }, note.trim() || null, user)
      navigate(farveHref(a) ?? '/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunne ikke gemme farvematchet.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link to="/" className="smu-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
        <ArrowLeft size={15} /> Tilbage
      </Link>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 18px' }}>Opret farvematch</h1>

      {error && (
        <div style={{ background: 'var(--color-red-soft)', color: 'var(--color-red-deep)', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <section style={{ marginBottom: 20 }}>
        <SectionTitle>1 · Første farve</SectionTitle>
        {a ? <FarveValgtKort valg={a} onRyd={() => setA(null)} /> : <FarveVaelger onPick={setA} />}
      </section>

      <section style={{ marginBottom: 20 }}>
        <SectionTitle>2 · Anden farve</SectionTitle>
        {b ? <FarveValgtKort valg={b} onRyd={() => setB(null)} /> : a ? <FarveVaelger onPick={setB} /> : <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', padding: '4px 2px' }}>Vælg den første farve først.</div>}
      </section>

      <section style={{ marginBottom: 24 }}>
        <SectionTitle>3 · Note (valgfri)</SectionTitle>
        <textarea ref={noteRef} className="smu-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Fri note om farvematchet…" />
      </section>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="smu-btn-primary" onClick={gem} disabled={!klar || saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Save size={16} /> {saving ? 'Gemmer…' : 'Gem som forslag'}
        </button>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: 'var(--color-text-muted)' }}>
          <Check size={14} /> Gemmes som forslag — ikke verificeret
        </span>
      </div>
    </div>
  )
}
