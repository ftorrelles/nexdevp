'use client'

import { useState } from 'react'
import type { QuoteSize } from '@/lib/supabase'

interface CatalogItem {
  id:            string
  name:          string
  tipo:          string
  product:       string
  size:          QuoteSize
  default_hours: number
  description:   string | null
}

const SIZE_STYLES: Record<QuoteSize, string> = {
  S:  'text-emerald-400 border-emerald-400/40',
  M:  'text-blue-400   border-blue-400/40',
  L:  'text-orange-400 border-orange-400/40',
  XL: 'text-purple-400 border-purple-400/40',
}

const SIZES: QuoteSize[] = ['S', 'M', 'L', 'XL']

const EMPTY: Omit<CatalogItem, 'id'> = {
  name: '', tipo: 'Desarrollo', product: '', size: 'M', default_hours: 20, description: null,
}

export function CatalogEditor({ initialItems, canEdit }: { initialItems: CatalogItem[]; canEdit: boolean }) {
  const [items,   setItems]   = useState<CatalogItem[]>(initialItems)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft,   setDraft]   = useState<Partial<CatalogItem>>({})
  const [adding,  setAdding]  = useState(false)
  const [newItem, setNewItem] = useState<Omit<CatalogItem, 'id'>>(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [filter,  setFilter]  = useState('')

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
    if (!confirm('¿Eliminar este ítem del catálogo?')) return
    const res = await fetch(`/api/cotizador/catalog/${id}`, { method: 'DELETE' })
    if (res.ok) setItems(prev => prev.filter(x => x.id !== id))
  }

  async function handleAdd() {
    if (!newItem.name || !newItem.product) return
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

  const visible = filter
    ? items.filter(i =>
        i.name.toLowerCase().includes(filter.toLowerCase()) ||
        i.tipo.toLowerCase().includes(filter.toLowerCase()) ||
        i.product.toLowerCase().includes(filter.toLowerCase())
      )
    : items

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Filtrar ítems…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="flex-1 max-w-xs bg-nex-dark border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white placeholder:text-nex-grey focus:outline-none focus:border-nex-green/50 transition-colors"
        />
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
              disabled={saving || !newItem.name || !newItem.product}
              className="font-jost text-sm font-bold bg-nex-green text-nex-black py-1.5 px-4 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-nex-dark border border-white/10 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 text-[10px] font-dm-mono uppercase tracking-[0.1em] text-nex-grey px-4 py-2.5 border-b border-white/5">
          <span>Nombre</span>
          <span className="text-center px-3">Talla</span>
          <span className="text-right px-3">Horas</span>
          <span className="px-3">Tipo · Producto</span>
          {canEdit && <span />}
        </div>

        {visible.length === 0 && (
          <p className="font-jost text-sm text-nex-grey text-center py-10">Sin resultados.</p>
        )}

        {visible.map(item => (
          editing === item.id ? (
            <div key={item.id} className="border-b border-white/5 px-4 py-4 space-y-3 bg-nex-black/40">
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
            <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 items-center border-b border-white/5 px-4 py-3 hover:bg-white/[0.02] transition-colors">
              <span className="font-jost text-sm text-nex-white truncate pr-3">{item.name}</span>
              <span className={['font-dm-mono text-[10px] font-bold border rounded px-1.5 text-center', SIZE_STYLES[item.size]].join(' ')}>
                {item.size}
              </span>
              <span className="font-dm-mono text-xs text-nex-grey text-right px-3">{item.default_hours}h</span>
              <span className="font-jost text-xs text-nex-grey px-3 hidden sm:block">{item.tipo} · {item.product}</span>
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
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div className="col-span-2 sm:col-span-3">
        <label className="block font-jost text-xs text-nex-grey mb-1">Nombre</label>
        <input
          type="text"
          value={item.name ?? ''}
          onChange={e => onChange({ name: e.target.value })}
          className="w-full bg-nex-black border border-white/10 rounded-lg px-3 py-1.5 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
        />
      </div>
      <div>
        <label className="block font-jost text-xs text-nex-grey mb-1">Tipo</label>
        <select
          value={item.tipo ?? ''}
          onChange={e => onChange({ tipo: e.target.value })}
          className="w-full bg-nex-black border border-white/10 rounded-lg px-3 py-1.5 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
        >
          {['Desarrollo', 'Marketing Digital', 'IA & Automatización', 'Paquete'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-jost text-xs text-nex-grey mb-1">Producto</label>
        <input
          type="text"
          value={item.product ?? ''}
          onChange={e => onChange({ product: e.target.value })}
          className="w-full bg-nex-black border border-white/10 rounded-lg px-3 py-1.5 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
        />
      </div>
      <div>
        <label className="block font-jost text-xs text-nex-grey mb-1">Talla</label>
        <select
          value={item.size ?? 'M'}
          onChange={e => onChange({ size: e.target.value as QuoteSize })}
          className="w-full bg-nex-black border border-white/10 rounded-lg px-3 py-1.5 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
        >
          {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block font-jost text-xs text-nex-grey mb-1">Horas base</label>
        <input
          type="number"
          min={1}
          value={item.default_hours ?? 0}
          onChange={e => onChange({ default_hours: parseInt(e.target.value) || 0 })}
          className="w-full bg-nex-black border border-white/10 rounded-lg px-3 py-1.5 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
        />
      </div>
      <div className="col-span-2">
        <label className="block font-jost text-xs text-nex-grey mb-1">Descripción (opcional)</label>
        <input
          type="text"
          value={item.description ?? ''}
          onChange={e => onChange({ description: e.target.value || null })}
          className="w-full bg-nex-black border border-white/10 rounded-lg px-3 py-1.5 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
        />
      </div>
    </div>
  )
}
