'use client'

import { useState } from 'react'
import { STAFF_ROLES, type AdminUser, type UserRole } from '@/lib/supabase'

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  supervisor: 'Supervisor',
  developer: 'Developer',
  vendor: 'Vendedor',
  applicant: 'Postulante',
  client: 'Cliente',
}

const ROLE_COLORS: Record<UserRole, string> = {
  owner: 'text-nex-green bg-nex-green/10',
  supervisor: 'text-yellow-400 bg-yellow-400/10',
  developer: 'text-orange-400 bg-orange-400/10',
  vendor: 'text-blue-400 bg-blue-400/10',
  applicant: 'text-nex-grey bg-nex-ink/10',
  client: 'text-purple-400 bg-purple-400/10',
}

// Only staff roles can be assigned manually; applicants come from self-registration.
const ROLES: UserRole[] = STAFF_ROLES

// Tabs shown in the users list — one per role that can appear here (applicant excluded).
const TABS: { value: UserRole; label: string }[] = [
  { value: 'owner', label: 'Owners' },
  { value: 'supervisor', label: 'Supervisores' },
  { value: 'developer', label: 'Developers' },
  { value: 'vendor', label: 'Vendedores' },
  { value: 'client', label: 'Clientes' },
]

const inputClass =
  'bg-nex-black border border-nex-ink/10 rounded-lg px-4 py-2.5 text-nex-white font-jost text-sm w-full focus:outline-none focus:border-nex-green/50 transition-colors'
const labelClass =
  'block font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey mb-1.5'

interface Props {
  initialUsers: AdminUser[]
  currentUserId: string
}

export function UserManager({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [activeTab, setActiveTab] = useState<UserRole>('owner')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', role: 'vendor' as UserRole })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const visibleUsers = users.filter((u) => u.role === activeTab)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error); return }
      setUsers((prev) => [...prev, data.user])
      setForm({ email: '', full_name: '', role: 'vendor' })
      setShowForm(false)
    } catch {
      setFormError('Error de conexión')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleRoleChange(id: string, role: UserRole) {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
      }
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`¿Eliminar a ${email}? Esta acción no se puede deshacer.`)) return
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { alert(data.error); return }
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-jost font-bold text-xl text-nex-white">Usuarios</h2>
          <p className="font-jost text-sm text-nex-grey mt-1">
            {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-nex-green text-nex-black font-jost font-bold text-sm py-2 px-5 rounded-lg hover:bg-nex-green/90 transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Nuevo usuario'}
        </button>
      </div>

      {showForm && (
        <div className="bg-nex-dark border border-nex-ink/10 rounded-xl p-6 mb-6">
          <p className="font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-green mb-5">
            Crear usuario
          </p>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre completo</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                className={inputClass}
                placeholder="Nombre y apellido"
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputClass}
                placeholder="usuario@email.com"
              />
            </div>
            <div>
              <label className={labelClass}>Rol</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                className={inputClass}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r} className="bg-nex-dark">
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            {formError && (
              <p className="sm:col-span-2 font-jost text-sm text-red-400">{formError}</p>
            )}
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={formLoading}
                className="bg-nex-green text-nex-black font-jost font-bold text-sm py-2 px-6 rounded-lg hover:bg-nex-green/90 transition-colors disabled:opacity-60"
              >
                {formLoading ? 'Enviando invitación...' : 'Enviar invitación'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Role tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-nex-ink/10 flex-wrap">
        {TABS.map((tab) => {
          const count = users.filter((u) => u.role === tab.value).length
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={[
                'font-jost text-sm px-4 py-2.5 border-b-2 -mb-px transition-colors whitespace-nowrap',
                activeTab === tab.value
                  ? 'text-nex-white border-nex-green'
                  : 'text-nex-grey border-transparent hover:text-nex-white',
              ].join(' ')}
            >
              {tab.label} <span className="text-xs text-nex-grey">({count})</span>
            </button>
          )
        })}
      </div>

      <div className="bg-nex-dark border border-nex-ink/10 rounded-xl overflow-y-auto max-h-[28rem]">
        <table className="w-full text-sm font-jost">
          <thead className="sticky top-0 bg-nex-dark z-10">
            <tr className="border-b border-nex-ink/10">
              {(activeTab === 'client'
                ? ['Email', 'Proyecto', 'Acciones']
                : ['Email', 'Rol', 'Acciones']
              ).map((col) => (
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
            {visibleUsers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center font-jost text-sm text-nex-grey italic">
                  Sin usuarios en esta pestaña.
                </td>
              </tr>
            )}
            {visibleUsers.map((user) => (
              <tr key={user.id} className="border-b border-nex-ink/5 hover:bg-nex-ink/[0.02] transition-colors">
                <td className="px-5 py-4 text-nex-white">
                  {user.email}
                  {user.id === currentUserId && (
                    <span className="ml-2 font-dm-mono text-[9px] tracking-wider uppercase text-nex-grey">
                      (vos)
                    </span>
                  )}
                </td>
                {activeTab === 'client' ? (
                  <td className="px-5 py-4 text-nex-grey">
                    {user.projectName ?? <span className="italic">Sin proyecto asignado</span>}
                  </td>
                ) : (
                  <td className="px-5 py-4">
                    <select
                      value={user.role}
                      disabled={updatingId === user.id || user.id === currentUserId}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      className={[
                        'font-dm-mono text-[10px] tracking-[0.1em] uppercase rounded px-2 py-1 border-0 outline-none cursor-pointer disabled:opacity-50 disabled:cursor-default',
                        ROLE_COLORS[user.role],
                      ].join(' ')}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} className="bg-nex-dark text-nex-white">
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                )}
                <td className="px-5 py-4">
                  {user.id !== currentUserId && (
                    <button
                      onClick={() => handleDelete(user.id, user.email)}
                      disabled={updatingId === user.id}
                      className="font-dm-mono text-[10px] tracking-[0.1em] uppercase text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-40"
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
