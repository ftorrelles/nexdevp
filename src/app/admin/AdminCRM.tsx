'use client'

import React, { useState } from 'react'
import { Lead, AdminUser, UserRole } from '@/lib/supabase'
import { AdminNav } from './AdminNav'
import { LeadQuotes } from './LeadQuotes'

type EstadoFilter = 'todos' | 'nuevo' | 'contactado' | 'calificado' | 'cerrado'

const EMPTY_LEAD = { nombre: '', email: '', telefono: '', tipo_negocio: '', mensaje: '' }

const ESTADO_OPTIONS: Lead['estado'][] = ['nuevo', 'contactado', 'calificado', 'cerrado']

const ESTADO_COLORS: Record<string, string> = {
  nuevo: 'text-nex-green bg-nex-green/10',
  contactado: 'text-blue-400 bg-blue-400/10',
  calificado: 'text-yellow-400 bg-yellow-400/10',
  cerrado: 'text-nex-grey bg-white/5',
}

const NOTAS_MAX = 300

const FILTER_TABS: { label: string; value: EstadoFilter }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Nuevos', value: 'nuevo' },
  { label: 'Contactados', value: 'contactado' },
  { label: 'Calificados', value: 'calificado' },
  { label: 'Cerrados', value: 'cerrado' },
]

function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface Props {
  leads: Lead[]
  role: UserRole
  currentUserId: string
  vendorUsers: AdminUser[]
}

export function AdminCRM({ leads: initialLeads, role, vendorUsers }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [filter, setFilter] = useState<EstadoFilter>('todos')
  const [updating, setUpdating] = useState<string | null>(null)
  const [editingNota, setEditingNota] = useState<string | null>(null)
  const [notaValue, setNotaValue] = useState('')
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [addingLead,  setAddingLead]  = useState(false)
  const [newLead,     setNewLead]     = useState(EMPTY_LEAD)
  const [savingLead,  setSavingLead]  = useState(false)

  const isOwner = role === 'owner'
  const canSeeAll = role === 'owner' || role === 'supervisor'

  const total = leads.length
  const nuevos = leads.filter((l) => l.estado === 'nuevo').length
  const calificados = leads.filter((l) => l.estado === 'calificado').length
  const convertidos = leads.filter((l) => l.estado === 'calificado' || l.estado === 'cerrado').length
  const conversion = total > 0 ? Math.round((convertidos / total) * 100) : 0

  const filtered = filter === 'todos' ? leads : leads.filter((l) => l.estado === filter)

  async function handleEstadoChange(id: string, estado: Lead['estado']) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      })
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, estado } : l)))
      }
    } finally {
      setUpdating(null)
    }
  }

  async function handleAssign(id: string, assigned_to: string | null) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to }),
      })
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, assigned_to } : l)))
      }
    } finally {
      setUpdating(null)
    }
  }

  async function handleAddLead() {
    if (!newLead.nombre || !newLead.email) return
    setSavingLead(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newLead, canal: 'vendedor' }),
      })
      if (res.ok) {
        const { id } = await res.json()
        const created: Lead = {
          id,
          ...newLead,
          canal: 'vendedor',
          estado: 'nuevo',
          created_at: new Date().toISOString(),
          assigned_to: undefined,
          notas: undefined,
          mensaje: newLead.mensaje || undefined,
        }
        setLeads(prev => [created, ...prev])
        setNewLead(EMPTY_LEAD)
        setAddingLead(false)
      }
    } finally {
      setSavingLead(false)
    }
  }

  function startEditNota(lead: Lead) {
    setEditingNota(lead.id!)
    setNotaValue(lead.notas ?? '')
  }

  async function saveNota(id: string) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas: notaValue }),
      })
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, notas: notaValue } : l)))
      }
    } finally {
      setUpdating(null)
      setEditingNota(null)
    }
  }

  const tableHeaders = [
    'Fecha', 'Nombre', 'Email', 'Teléfono', 'Tipo Negocio', 'Canal', 'Contactar', 'Estado', 'Notas',
    ...(isOwner ? ['Asignado a'] : []),
  ]

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role={role} currentPath="/admin" />

      <main className="px-6 py-8 max-w-7xl mx-auto">
        {canSeeAll && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total leads', value: total },
              { label: 'Nuevos', value: nuevos },
              { label: 'Calificados', value: calificados },
              { label: 'Conversión', value: `${conversion}%`, sub: `${convertidos} de ${total}` },
            ].map((stat) => (
              <div key={stat.label} className="bg-nex-dark border border-white/10 rounded-xl p-5">
                <p className="font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey mb-1">
                  {stat.label}
                </p>
                <p className="font-jost font-bold text-3xl text-nex-white">{stat.value}</p>
                {'sub' in stat && stat.sub && (
                  <p className="font-dm-mono text-[10px] text-nex-grey mt-1">{stat.sub}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add lead manually */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={[
                  'font-jost text-sm px-4 py-2 rounded-lg border transition-colors',
                  filter === tab.value
                    ? 'bg-nex-green text-nex-black border-nex-green font-bold'
                    : 'bg-nex-dark text-nex-grey border-white/10 hover:border-white/30',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setAddingLead(v => !v)}
            className="font-jost text-sm font-bold bg-nex-green text-nex-black px-4 py-2 rounded-lg hover:bg-nex-green/90 transition-colors shrink-0"
          >
            + Agregar lead
          </button>
        </div>

        {addingLead && (
          <div className="bg-nex-dark border border-nex-green/30 rounded-xl p-5 mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-dm-mono text-xs text-nex-green uppercase tracking-[0.15em]">Nuevo lead manual</p>
              <span className="font-dm-mono text-[10px] text-nex-grey border border-white/10 rounded-full px-2 py-0.5">canal: vendedor · 20% comisión</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'nombre',       label: 'Nombre *',      type: 'text'  },
                { key: 'email',        label: 'Email *',       type: 'email' },
                { key: 'telefono',     label: 'Teléfono',      type: 'text'  },
                { key: 'tipo_negocio', label: 'Tipo de negocio', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block font-jost text-xs text-nex-grey mb-1">{label}</label>
                  <input
                    type={type}
                    value={newLead[key as keyof typeof newLead] ?? ''}
                    onChange={e => setNewLead(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full bg-nex-black border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block font-jost text-xs text-nex-grey mb-1">Mensaje / contexto</label>
                <textarea
                  rows={2}
                  value={newLead.mensaje}
                  onChange={e => setNewLead(prev => ({ ...prev, mensaje: e.target.value }))}
                  className="w-full bg-nex-black border border-white/10 rounded-lg px-3 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setAddingLead(false); setNewLead(EMPTY_LEAD) }} className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleAddLead}
                disabled={savingLead || !newLead.nombre || !newLead.email}
                className="font-jost text-sm font-bold bg-nex-green text-nex-black px-5 py-2 rounded-lg disabled:opacity-40 hover:bg-nex-green/90 transition-colors"
              >
                {savingLead ? 'Guardando…' : 'Guardar lead'}
              </button>
            </div>
          </div>
        )}


        <div className="bg-nex-dark border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-jost">
              <thead>
                <tr className="border-b border-white/10">
                  {tableHeaders.map((col) => (
                    <th
                      key={col}
                      className="text-left font-dm-mono text-[10px] tracking-[0.15em] uppercase text-nex-grey px-4 py-3"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={tableHeaders.length} className="px-4 py-8 text-center text-nex-grey">
                      No hay leads en esta categoría.
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead) => (
                    <React.Fragment key={lead.id}>
                      <tr
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => setExpanded(expanded === lead.id ? null : lead.id!)}
                      >
                        <td className="px-4 py-3 text-nex-grey text-xs whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            <svg
                              width="10" height="10" viewBox="0 0 10 10"
                              className={`text-nex-grey transition-transform duration-200 ${expanded === lead.id ? 'rotate-90' : ''}`}
                              fill="none" stroke="currentColor" strokeWidth="1.5"
                            >
                              <path d="M3 2l4 3-4 3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {formatDate(lead.created_at)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-nex-white font-medium">{lead.nombre}</td>
                        <td className="px-4 py-3 text-nex-grey">{lead.email || '—'}</td>
                        <td className="px-4 py-3 text-nex-grey">{lead.telefono || '—'}</td>
                        <td className="px-4 py-3 text-nex-grey">{lead.tipo_negocio || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="font-dm-mono text-[10px] tracking-[0.1em] uppercase text-nex-grey">
                            {lead.canal ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {lead.telefono && (
                              <a
                                href={`https://wa.me/${lead.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${lead.nombre}, te contactamos desde nexdevp.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="WhatsApp"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-center w-7 h-7 rounded bg-nex-green/10 hover:bg-nex-green/20 text-nex-green transition-colors"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                              </a>
                            )}
                            {lead.email && (
                              <a
                                href={`mailto:${lead.email}?subject=nexdevp — seguimiento&body=Hola ${lead.nombre},%0D%0A%0D%0ATe contactamos desde nexdevp.`}
                                title="Email"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-center w-7 h-7 rounded bg-blue-400/10 hover:bg-blue-400/20 text-blue-400 transition-colors"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <rect width="20" height="16" x="2" y="4" rx="2" />
                                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.estado ?? 'nuevo'}
                            disabled={updating === lead.id}
                            onChange={(e) => handleEstadoChange(lead.id!, e.target.value as Lead['estado'])}
                            className={[
                              'font-dm-mono text-[10px] tracking-[0.1em] uppercase rounded px-2 py-1 border-0 outline-none cursor-pointer disabled:opacity-50',
                              ESTADO_COLORS[lead.estado ?? 'nuevo'] ?? ESTADO_COLORS.nuevo,
                            ].join(' ')}
                          >
                            {ESTADO_OPTIONS.map((opt) => (
                              <option key={opt} value={opt} className="bg-nex-dark text-nex-white">
                                {opt}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                          {editingNota === lead.id ? (
                            <div className="flex flex-col gap-1">
                              <textarea
                                value={notaValue}
                                onChange={(e) => setNotaValue(e.target.value.slice(0, NOTAS_MAX))}
                                rows={3}
                                className="w-full bg-nex-black border border-white/20 rounded px-2 py-1 text-xs text-nex-white resize-none outline-none focus:border-nex-green/60 transition-colors"
                                autoFocus
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-nex-grey">{notaValue.length}/{NOTAS_MAX}</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => saveNota(lead.id!)}
                                    disabled={updating === lead.id}
                                    className="text-[10px] font-dm-mono uppercase tracking-wider px-2 py-1 bg-nex-green text-nex-black rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    onClick={() => setEditingNota(null)}
                                    className="text-[10px] font-dm-mono uppercase tracking-wider px-2 py-1 bg-white/10 text-nex-grey rounded hover:bg-white/20 transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditNota(lead)}
                              className="w-full text-left text-xs text-nex-grey hover:text-nex-white transition-colors group"
                            >
                              {lead.notas ? (
                                <span className="line-clamp-2">{lead.notas}</span>
                              ) : (
                                <span className="opacity-0 group-hover:opacity-60 italic transition-opacity">
                                  + agregar nota
                                </span>
                              )}
                            </button>
                          )}
                        </td>
                        {isOwner && (
                          <td className="px-4 py-3 min-w-[160px]" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={lead.assigned_to ?? ''}
                              disabled={updating === lead.id}
                              onChange={(e) => handleAssign(lead.id!, e.target.value || null)}
                              className="font-dm-mono text-[10px] tracking-[0.1em] uppercase bg-transparent border border-white/10 rounded px-2 py-1 text-nex-grey outline-none cursor-pointer hover:border-white/30 transition-colors disabled:opacity-50 w-full"
                            >
                              <option value="" className="bg-nex-dark text-nex-grey">Sin asignar</option>
                              {vendorUsers.map((u) => (
                                <option key={u.id} value={u.id} className="bg-nex-dark text-nex-white">
                                  {u.email}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}
                      </tr>
                      {expanded === lead.id && (
                        <tr key={`${lead.id}-expanded`} className="border-b border-white/5 bg-white/[0.015]">
                          <td colSpan={tableHeaders.length} className="px-6 py-4">
                            <p className="font-dm-mono text-[10px] tracking-[0.15em] uppercase text-nex-green mb-2">
                              Mensaje
                            </p>
                            <p className="text-sm text-nex-grey leading-relaxed whitespace-pre-wrap">
                              {lead.mensaje || <span className="italic opacity-50">Sin mensaje</span>}
                            </p>
                            <LeadQuotes leadId={lead.id!} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
