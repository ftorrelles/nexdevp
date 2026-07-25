'use client'

import { useState } from 'react'
import type { QuoteSize, QuoteCategory, QuoteComplexity } from '@/lib/supabase'

interface CatalogItem {
  id:          string
  name:        string
  category:    QuoteCategory
  size:        QuoteSize
  base_hours:  number
  complexity:  QuoteComplexity | null
  description: string | null
  sort_order:  number
}

const SIZE_STYLES: Record<QuoteSize, string> = {
  S:  'text-emerald-400 border-emerald-400/40',
  M:  'text-blue-400   border-blue-400/40',
  L:  'text-orange-400 border-orange-400/40',
  XL: 'text-purple-400 border-purple-400/40',
}

const SIZES: QuoteSize[] = ['S', 'M', 'L', 'XL']

const CATEGORIES: { value: QuoteCategory; label: string; hint: string }[] = [
  { value: 'base',   label: 'Base',   hint: 'Trabajo técnico que siempre va' },
  { value: 'modulo', label: 'Módulo', hint: 'Una lógica funcional del producto' },
  { value: 'cierre', label: 'Cierre', hint: 'Pulido y validación con el cliente' },
  { value: 'addon',  label: 'Add-on', hint: 'Opcional, se ofrece en el resultado' },
]

const CATEGORY_STYLES: Record<QuoteCategory, string> = {
  base:   'text-nex-grey     border-nex-ink/20',
  modulo: 'text-nex-green    border-nex-green/40',
  cierre: 'text-amber-400    border-amber-400/40',
  addon:  'text-sky-400      border-sky-400/40',
}

const COMPLEXITIES: { value: QuoteComplexity; label: string }[] = [
  { value: 'simple',   label: 'Simple' },
  { value: 'estandar', label: 'Estándar' },
  { value: 'complejo', label: 'Complejo' },
  { value: 'critico',  label: 'Crítico' },
]

const EMPTY: Omit<CatalogItem, 'id'> = {
  name: '', category: 'modulo', size: 'M', base_hours: 16,
  complexity: null, description: null, sort_order: 999,
}

export function CatalogEditor({ initialItems, canEdit }: { initialItems: CatalogItem[]; canEdit: boolean }) {
  const [items,   setItems]   = useState<CatalogItem[]>(initialItems)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft,   setDraft]   = useState<Partial<CatalogItem>>({})
  const [adding,  setAdding]  = useState(false)
  const [newItem, setNewItem] = useState<Omit<CatalogItem, 'id'>>(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [filter,  setFilter]  = useState('')
  const [catFilter, setCatFilter] = useState<QuoteCategory | 'all'>('all')

  function startEdit(item: CatalogItem) {
    setEditing(item.id)
    setDraft({ ...item })
    setAdding(false)
  }

  function cancelEdit() { setEditing(null); setDraft({}) }

  async function saveEdit(id: string) {
    setSaving(true)
    const res = await fetch(`/api/cotizador/catalog/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    if (res.ok) {
      const { item } = await res.json()
      setItems(prev => prev.map(x => x.id === id ? item : x))
      setEditing(null)
      setDraft({})
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Retirar este ítem del catálogo? Los presupuestos ya guardados no cambian.')) return
    const res = await fetch(`/api/cotizador/catalog/${id}`, { method: 'DELETE' })
    if (res.ok) setItems(prev => prev.filter(x => x.id !== id))
  }

  async function handleAdd() {
    if (!newItem.name) return
    setSaving(true)
    const res = await fetch('/api/cotizador/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    })
    if (res.ok) {
      const { item } = await res.json()
      setItems(prev => [...prev, item])
      setNewItem(EMPTY)
      setAdding(false)
    }
    setSaving(false)
  }

  const visible = items.filter(i => {
    if (catFilter !== 'all' && i.category !== catFilter) return false
    if (!filter) return true
    const q = filter.toLowerCase()
    return i.name.toLowerCase().includes(q) || (i.description ?? '').toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Filtrar ítems…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-48 bg-nex-dark border border-nex-ink/10 rounded-lg px-3 py-2 text-sm text-nex-white placeholder:text-nex-grey focus:outline-none focus:border-nex-green/50 transition-colors"
          />
          <div className="flex gap-1">
            {([{ value: 'all' as const, label: 'Todos' }, ...CATEGORIES]).map(c => (
              <button
                key={c.value}
                onClick={() => setCatFilter(c.value)}
                className={[
                  'font-jost text-xs px-2.5 py-1.5 rounded-lg border transition-colors',
                  catFilter === c.value
                    ? 'border-nex-green bg-nex-green/10 text-nex-green'
                    : 'border-nex-ink/10 text-nex-grey hover:border-nex-ink/25',
                ].join(' ')}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        {canEdit && !adding && (
          <button
            onClick={() => { setAdding(true); setEditing(null) }}
            className="font-jost text-sm font-bold bg-nex-green text-nex-black py-2 px-4 rounded-lg hover:bg-nex-green/90 transition-colors"
          >
            + Agregar ítem
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-nex-dark border border-nex-green/30 rounded-xl p-5 space-y-3">
          <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.15em]">Nuevo ítem</p>
          <ItemForm item={newItem} onChange={d => setNewItem(prev => ({ ...prev, ...d }))} />
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setAdding(false)} className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors">Cancelar</button>
            <button
              onClick={handleAdd}
              disabled={saving || !newItem.name}
              className="font-jost text-sm font-bold bg-nex-green text-nex-black py-1.5 px-4 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-nex-dark border border-nex-ink/10 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 text-[10px] font-dm-mono uppercase tracking-[0.1em] text-nex-grey px-4 py-2.5 border-b border-nex-ink/5">
          <span>Nombre</span>
          <span className="text-center px-3">Rol</span>
          <span className="text-center px-3">Talla</span>
          <span className="text-right px-3">Horas</span>
          {canEdit && <span />}
        </div>

        {visible.length === 0 && (
          <p className="font-jost text-sm text-nex-grey text-center py-10">Sin resultados.</p>
        )}

        {visible.map(item => (
          editing === item.id ? (
            <div key={item.id} className="border-b border-nex-ink/5 px-4 py-4 space-y-3 bg-nex-black/40">
              <ItemForm item={draft as Omit<CatalogItem,'id'>} onChange={d => setDraft(prev => ({ ...prev, ...d }))} />
              <div className="flex justify-end gap-2">
                <button onClick={cancelEdit} className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors">Cancelar</button>
                <button
                  onClick={() => saveEdit(item.id)}
                  disabled={saving}
                  className="font-jost text-sm font-bold bg-nex-green text-nex-black py-1.5 px-4 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
                >
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 items-center border-b border-nex-ink/5 px-4 py-3 hover:bg-white/[0.02] transition-colors">
              <div className="pr-3 min-w-0">
                <p className="font-jost text-sm text-nex-white truncate">{item.name}</p>
                {item.description && (
                  <p className="font-jost text-[11px] text-nex-grey truncate">{item.description}</p>
                )}
              </div>
              <span className={['font-dm-mono text-[9px] uppercase border rounded px-1.5 py-0.5 text-center mx-3', CATEGORY_STYLES[item.category]].join(' ')}>
                {item.category}
              </span>
              <span className={['font-dm-mono text-[10px] font-bold border rounded px-1.5 text-center', SIZE_STYLES[item.size]].join(' ')}>
                {item.size}
              </span>
              <span className="font-dm-mono text-xs text-nex-white text-right px-3">{item.base_hours}h</span>
              {canEdit && (
                <div className="flex items-center gap-2 pl-3">
                  <button onClick={() => startEdit(item)} className="font-jost text-xs text-nex-grey hover:text-nex-white transition-colors">Editar</button>
                  <button onClick={() => handleDelete(item.id)} className="font-jost text-xs text-nex-grey hover:text-red-400 transition-colors">×</button>
                </div>
              )}
            </div>
          )
        ))}
      </div>

      <p className="font-jost text-xs text-nex-grey text-right">{visible.length} de {items.length} ítems</p>
    </div>
  )
}

function ItemForm({
  item,
  onChange,
}: {
  item: Partial<Omit<CatalogItem, 'id'>>
  onChange: (d: Partial<Omit<CatalogItem, 'id'>>) => void
}) {
  const inputClass =
    'w-full bg-nex-black border border-nex-ink/10 rounded-lg px-3 py-1.5 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors'

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="col-span-2 sm:col-span-4">
        <label className="block font-jost text-xs text-nex-grey mb-1">Nombre</label>
        <input
          type="text"
          value={item.name ?? ''}
          onChange={e => onChange({ name: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block font-jost text-xs text-nex-grey mb-1">Rol en el producto</label>
        <select
          value={item.category ?? 'modulo'}
          onChange={e => onChange({ category: e.target.value as QuoteCategory })}
          className={inputClass}
        >
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <p className="font-jost text-[10px] text-nex-grey/70 mt-1">
          {CATEGORIES.find(c => c.value === (item.category ?? 'modulo'))?.hint}
        </p>
      </div>
      <div>
        <label className="block font-jost text-xs text-nex-grey mb-1">Talla</label>
        <select
          value={item.size ?? 'M'}
          onChange={e => onChange({ size: e.target.value as QuoteSize })}
          className={inputClass}
        >
          {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <p className="font-jost text-[10px] text-nex-grey/70 mt-1">Solo etiqueta visual</p>
      </div>
      <div>
        <label className="block font-jost text-xs text-nex-grey mb-1">Horas base</label>
        <input
          type="number"
          min={1}
          value={item.base_hours ?? 0}
          onChange={e => onChange({ base_hours: parseInt(e.target.value) || 0 })}
          className={inputClass}
        />
        <p className="font-jost text-[10px] text-nex-grey/70 mt-1">Lo que realmente cuesta</p>
      </div>
      <div>
        <label className="block font-jost text-xs text-nex-grey mb-1">Complejidad</label>
        <select
          value={item.complexity ?? ''}
          onChange={e => onChange({ complexity: (e.target.value || null) as QuoteComplexity | null })}
          className={inputClass}
        >
          <option value="">—</option>
          {COMPLEXITIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <p className="font-jost text-[10px] text-nex-grey/70 mt-1">Solo módulos genéricos</p>
      </div>
      <div className="col-span-2 sm:col-span-4">
        <label className="block font-jost text-xs text-nex-grey mb-1">Descripción (opcional)</label>
        <input
          type="text"
          value={item.description ?? ''}
          onChange={e => onChange({ description: e.target.value || null })}
          className={inputClass}
        />
      </div>
    </div>
  )
}
