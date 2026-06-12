'use client'

import React, { useState } from 'react'
import type { Career, CareerApplication, UserRole } from '@/lib/supabase'
import { AdminNav } from '../AdminNav'

interface Props {
  careers: Career[]
  applications: CareerApplication[]
  role: UserRole
  currentUserId: string
}

type TabType = 'applicants' | 'positions'
type ApplicationStatus = 'nuevo' | 'revisado' | 'aceptado' | 'rechazado'

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  nuevo: 'Nuevo',
  revisado: 'Revisado',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  nuevo: 'text-blue-400 bg-blue-400/10',
  revisado: 'text-yellow-400 bg-yellow-400/10',
  aceptado: 'text-nex-green bg-nex-green/10',
  rechazado: 'text-nex-grey bg-white/5',
}

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

const inputClass =
  'bg-nex-black border border-white/10 rounded-lg px-4 py-2 text-nex-white font-jost text-sm w-full focus:outline-none focus:border-nex-green/50 transition-colors placeholder:text-nex-grey/40'
const labelClass =
  'block font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey mb-1.5'

export function AdminApplicants({ careers: initialCareers, applications: initialApplications, role }: Props) {
  const [careers, setCareers] = useState<Career[]>(initialCareers)
  const [applications, setApplications] = useState<CareerApplication[]>(initialApplications)
  const [activeTab, setActiveTab] = useState<TabType>('applicants')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Modals state
  const [showForm, setShowForm] = useState(false)
  const [editingCareer, setEditingCareer] = useState<Career | null>(null)

  // Form fields
  const [form, setForm] = useState({
    title_es: '', title_en: '',
    department_es: '', department_en: '',
    location_es: '', location_en: '',
    type_es: '', type_en: '',
    description_es: '', description_en: '',
    requirements_es: '', requirements_en: '',
    responsibilities_es: '', responsibilities_en: '',
    active: true
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // Stats
  const totalApplicants = applications.length
  const newApplicants = applications.filter(a => a.estado === 'nuevo').length
  const activePositions = careers.filter(c => c.active).length

  // Reset form helper
  function resetForm() {
    setForm({
      title_es: '', title_en: '',
      department_es: '', department_en: '',
      location_es: '', location_en: '',
      type_es: '', type_en: '',
      description_es: '', description_en: '',
      requirements_es: '', requirements_en: '',
      responsibilities_es: '', responsibilities_en: '',
      active: true
    })
    setEditingCareer(null)
    setFormError('')
  }

  // Open Edit Career
  function startEdit(career: Career) {
    setEditingCareer(career)
    setForm({
      title_es: career.title_es,
      title_en: career.title_en,
      department_es: career.department_es,
      department_en: career.department_en,
      location_es: career.location_es,
      location_en: career.location_en,
      type_es: career.type_es,
      type_en: career.type_en,
      description_es: career.description_es,
      description_en: career.description_en,
      requirements_es: career.requirements_es ?? '',
      requirements_en: career.requirements_en ?? '',
      responsibilities_es: career.responsibilities_es ?? '',
      responsibilities_en: career.responsibilities_en ?? '',
      active: career.active ?? true
    })
    setShowForm(true)
  }

  // Create or Update Career Form Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    const url = editingCareer ? `/api/careers/${editingCareer.id}` : '/api/careers'
    const method = editingCareer ? 'PATCH' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || 'Error al guardar la posición')
        return
      }

      if (editingCareer) {
        setCareers(prev => prev.map(c => c.id === editingCareer.id ? { ...c, ...form } : c))
      } else {
        setCareers(prev => [data.career, ...prev])
      }

      setShowForm(false)
      resetForm()
    } catch {
      setFormError('Error de conexión')
    } finally {
      setFormLoading(false)
    }
  }

  // Delete Career
  async function handleDeleteCareer(id: string, name: string) {
    if (!confirm(`¿Eliminar la posición "${name}" y todos sus postulantes asociados?`)) return
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/careers/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCareers(prev => prev.filter(c => c.id !== id))
        // Also cascade delete applications in local state
        setApplications(prev => prev.filter(a => a.career_id !== id))
      } else {
        alert('Error al eliminar la posición')
      }
    } finally {
      setUpdatingId(null)
    }
  }

  // Toggle active status inline
  async function handleToggleActive(career: Career) {
    const nextActive = !career.active
    setUpdatingId(career.id!)
    try {
      const res = await fetch(`/api/careers/${career.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextActive }),
      })
      if (res.ok) {
        setCareers(prev => prev.map(c => c.id === career.id ? { ...c, active: nextActive } : c))
      }
    } finally {
      setUpdatingId(null)
    }
  }

  // Update Application Status
  async function handleStatusChange(id: string, estado: ApplicationStatus) {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      })
      if (res.ok) {
        setApplications(prev => prev.map(a => a.id === id ? { ...a, estado } : a))
      }
    } finally {
      setUpdatingId(null)
    }
  }

  // Delete Application
  async function handleDeleteApplication(id: string, name: string) {
    if (!confirm(`¿Eliminar la postulación de ${name}?`)) return
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setApplications(prev => prev.filter(a => a.id !== id))
      } else {
        alert('Error al eliminar la postulación')
      }
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-nex-black text-nex-white">
      <AdminNav role={role} currentPath="/admin/applicants" />

      <main className="px-6 py-8 max-w-7xl mx-auto font-jost">
        {/* Statistics cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Postulantes Totales', value: totalApplicants },
            { label: 'Nuevas Candidaturas', value: newApplicants, highlight: newApplicants > 0 },
            { label: 'Posiciones Activas', value: activePositions },
          ].map((stat, idx) => (
            <div key={idx} className="bg-nex-dark border border-white/10 rounded-xl p-5">
              <p className="font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey mb-1">
                {stat.label}
              </p>
              <p className={`font-bold text-3xl ${stat.highlight ? 'text-nex-green' : 'text-nex-white'}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tab selection & Action Buttons */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex gap-2">
            {[
              { id: 'applicants', label: 'Postulantes' },
              { id: 'positions', label: 'Posiciones' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType)
                  setShowForm(false)
                }}
                className={[
                  'text-sm px-4 py-2 rounded-lg border transition-colors font-medium',
                  activeTab === tab.id
                    ? 'bg-nex-green text-nex-black border-nex-green font-bold'
                    : 'bg-nex-dark text-nex-grey border-white/10 hover:border-white/30',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'positions' && (
            <button
              onClick={() => {
                resetForm()
                setShowForm(!showForm)
              }}
              className="bg-nex-green text-nex-black font-bold text-sm py-2 px-5 rounded-lg hover:bg-nex-green/90 transition-colors"
            >
              {showForm ? 'Cancelar' : '+ Nueva Posición'}
            </button>
          )}
        </div>

        {/* Create / Edit Form */}
        {activeTab === 'positions' && showForm && (
          <div className="bg-nex-dark border border-white/10 rounded-xl p-6 mb-8 max-w-4xl">
            <h3 className="font-dm-mono text-xs tracking-[0.2em] uppercase text-nex-green mb-6">
              {editingCareer ? 'Editar Posición' : 'Crear Nueva Posición'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row: Title ES & EN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Título (Español)</label>
                  <input
                    type="text"
                    required
                    value={form.title_es}
                    onChange={e => setForm(f => ({ ...f, title_es: e.target.value }))}
                    className={inputClass}
                    placeholder="Ej: Representante de Ventas"
                  />
                </div>
                <div>
                  <label className={labelClass}>Título (Inglés)</label>
                  <input
                    type="text"
                    required
                    value={form.title_en}
                    onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))}
                    className={inputClass}
                    placeholder="Ej: Sales Representative"
                  />
                </div>
              </div>

              {/* Row: Department & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Departamento (Español)</label>
                  <input
                    type="text"
                    required
                    value={form.department_es}
                    onChange={e => setForm(f => ({ ...f, department_es: e.target.value }))}
                    className={inputClass}
                    placeholder="Ej: Ventas / Comercial"
                  />
                </div>
                <div>
                  <label className={labelClass}>Departamento (Inglés)</label>
                  <input
                    type="text"
                    required
                    value={form.department_en}
                    onChange={e => setForm(f => ({ ...f, department_en: e.target.value }))}
                    className={inputClass}
                    placeholder="Ej: Sales"
                  />
                </div>
              </div>

              {/* Row: Location & Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Ubicación (Español)</label>
                  <input
                    type="text"
                    required
                    value={form.location_es}
                    onChange={e => setForm(f => ({ ...f, location_es: e.target.value }))}
                    className={inputClass}
                    placeholder="Ej: Remoto (Latam)"
                  />
                </div>
                <div>
                  <label className={labelClass}>Ubicación (Inglés)</label>
                  <input
                    type="text"
                    required
                    value={form.location_en}
                    onChange={e => setForm(f => ({ ...f, location_en: e.target.value }))}
                    className={inputClass}
                    placeholder="Ej: Remote (Latam)"
                  />
                </div>
              </div>

              {/* Row: Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tipo de Empleo (Español)</label>
                  <input
                    type="text"
                    required
                    value={form.type_es}
                    onChange={e => setForm(f => ({ ...f, type_es: e.target.value }))}
                    className={inputClass}
                    placeholder="Ej: Comisión 15% / Full-time"
                  />
                </div>
                <div>
                  <label className={labelClass}>Tipo de Empleo (Inglés)</label>
                  <input
                    type="text"
                    required
                    value={form.type_en}
                    onChange={e => setForm(f => ({ ...f, type_en: e.target.value }))}
                    className={inputClass}
                    placeholder="Ej: 15% Commission / Full-time"
                  />
                </div>
              </div>

              {/* Row: Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Descripción Breve (Español)</label>
                  <textarea
                    required
                    rows={4}
                    value={form.description_es}
                    onChange={e => setForm(f => ({ ...f, description_es: e.target.value }))}
                    className={inputClass + ' resize-none'}
                    placeholder="Describe brevemente la posición para la tarjeta principal..."
                  />
                </div>
                <div>
                  <label className={labelClass}>Descripción Breve (Inglés)</label>
                  <textarea
                    required
                    rows={4}
                    value={form.description_en}
                    onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))}
                    className={inputClass + ' resize-none'}
                    placeholder="Briefly describe the position for the primary card..."
                  />
                </div>
              </div>

              {/* Row: Requirements (textarea with lines) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Requisitos (Español) — Un requisito por línea</label>
                  <textarea
                    rows={5}
                    value={form.requirements_es}
                    onChange={e => setForm(f => ({ ...f, requirements_es: e.target.value }))}
                    className={inputClass + ' resize-none'}
                    placeholder="Ej:&#10;Experiencia previa de 2 años&#10;Excelentes habilidades comunicativas"
                  />
                </div>
                <div>
                  <label className={labelClass}>Requisitos (Inglés) — Un requisito por línea</label>
                  <textarea
                    rows={5}
                    value={form.requirements_en}
                    onChange={e => setForm(f => ({ ...f, requirements_en: e.target.value }))}
                    className={inputClass + ' resize-none'}
                    placeholder="Ej:&#10;2 years of previous experience&#10;Excellent communication skills"
                  />
                </div>
              </div>

              {/* Row: Responsibilities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Responsabilidades (Español) — Una por línea</label>
                  <textarea
                    rows={5}
                    value={form.responsibilities_es}
                    onChange={e => setForm(f => ({ ...f, responsibilities_es: e.target.value }))}
                    className={inputClass + ' resize-none'}
                    placeholder="Ej:&#10;Cierre de prospectos comerciales&#10;Mantener al día el CRM"
                  />
                </div>
                <div>
                  <label className={labelClass}>Responsabilidades (Inglés) — Una por línea</label>
                  <textarea
                    rows={5}
                    value={form.responsibilities_en}
                    onChange={e => setForm(f => ({ ...f, responsibilities_en: e.target.value }))}
                    className={inputClass + ' resize-none'}
                    placeholder="Ej:&#10;Close sales opportunities&#10;Keep the CRM updated"
                  />
                </div>
              </div>

              {/* Active Toggle & Buttons */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4 flex-wrap gap-4">
                <label className="flex items-center gap-3 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    className="w-4 h-4 accent-nex-green bg-nex-black border-white/10 rounded cursor-pointer"
                  />
                  <span>Posición Activa (Visible en la web)</span>
                </label>

                {formError && <span className="text-red-400 text-sm">{formError}</span>}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-white/10 text-nex-grey font-bold text-sm py-2 px-5 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="bg-nex-green text-nex-black font-bold text-sm py-2 px-6 rounded-lg hover:bg-nex-green/90 transition-colors disabled:opacity-60"
                  >
                    {formLoading ? 'Guardando...' : 'Guardar Posición'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Data Tables */}
        <div className="bg-nex-dark border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'applicants' ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Fecha', 'Nombre', 'Posición', 'Contacto', 'Mensaje', 'CV', 'Estado', 'Acciones'].map(col => (
                      <th
                        key={col}
                        className="text-left font-dm-mono text-[10px] tracking-[0.15em] uppercase text-nex-grey px-5 py-3"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-nex-grey">
                        No hay postulantes registrados todavía.
                      </td>
                    </tr>
                  ) : (
                    applications.map(app => (
                      <tr key={app.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                        <td className="px-5 py-4 text-xs text-nex-grey whitespace-nowrap">
                          {formatDate(app.created_at)}
                        </td>
                        <td className="px-5 py-4 font-medium text-nex-white">{app.nombre}</td>
                        <td className="px-5 py-4 text-nex-white">
                          {app.careers ? app.careers.title_es : 'Posición Eliminada'}
                        </td>
                        <td className="px-5 py-4 text-nex-grey text-xs">
                          <div>{app.email}</div>
                          {app.telefono && <div className="mt-0.5">{app.telefono}</div>}
                        </td>
                        <td className="px-5 py-4 text-nex-grey text-xs max-w-[200px] truncate" title={app.mensaje ?? ''}>
                          {app.mensaje || <span className="italic opacity-50">Sin mensaje</span>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <a
                            href={app.cv_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-dm-mono text-[10px] uppercase tracking-wider text-nex-green hover:underline"
                          >
                            Ver CV ↗
                          </a>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={app.estado ?? 'nuevo'}
                            disabled={updatingId === app.id}
                            onChange={e => handleStatusChange(app.id!, e.target.value as ApplicationStatus)}
                            className={[
                              'font-dm-mono text-[10px] tracking-[0.1em] uppercase rounded px-2.5 py-1 border-0 outline-none cursor-pointer disabled:opacity-50',
                              STATUS_COLORS[app.estado ?? 'nuevo'],
                            ].join(' ')}
                          >
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                              <option key={val} value={val} className="bg-nex-dark text-nex-white">
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleDeleteApplication(app.id!, app.nombre)}
                            disabled={updatingId === app.id}
                            className="font-dm-mono text-[10px] tracking-[0.1em] uppercase text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-40"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Título (ES / EN)', 'Departamento', 'Ubicación / Tipo', 'Estado', 'Acciones'].map(col => (
                      <th
                        key={col}
                        className="text-left font-dm-mono text-[10px] tracking-[0.15em] uppercase text-nex-grey px-5 py-3"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {careers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-nex-grey">
                        No hay posiciones configuradas.
                      </td>
                    </tr>
                  ) : (
                    careers.map(career => (
                      <tr key={career.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-medium text-nex-white">{career.title_es}</div>
                          <div className="text-xs text-nex-grey mt-0.5">{career.title_en}</div>
                        </td>
                        <td className="px-5 py-4 text-nex-white">{career.department_es}</td>
                        <td className="px-5 py-4 text-nex-grey text-xs">
                          <div>{career.location_es}</div>
                          <div className="mt-0.5 text-nex-green">{career.type_es}</div>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleToggleActive(career)}
                            disabled={updatingId === career.id}
                            className={[
                              'font-dm-mono text-[10px] tracking-[0.1em] uppercase rounded px-2.5 py-1 transition-opacity border-0 outline-none',
                              career.active ? 'text-nex-green bg-nex-green/10' : 'text-nex-grey bg-white/5',
                            ].join(' ')}
                          >
                            {career.active ? 'Activo' : 'Borrador'}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-4">
                            <button
                              onClick={() => startEdit(career)}
                              className="font-dm-mono text-[10px] tracking-[0.1em] uppercase text-nex-grey hover:text-nex-white transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteCareer(career.id!, career.title_es)}
                              disabled={updatingId === career.id}
                              className="font-dm-mono text-[10px] tracking-[0.1em] uppercase text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-40"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
