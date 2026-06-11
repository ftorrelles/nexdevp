'use client'

import { useState } from 'react'
import type { AdminUser, UserRole } from '@/lib/supabase'

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  supervisor: 'Supervisor',
  vendor: 'Vendedor',
}

const ROLE_COLORS: Record<UserRole, string> = {
  owner: 'text-nex-green bg-nex-green/10',
  supervisor: 'text-yellow-400 bg-yellow-400/10',
  vendor: 'text-blue-400 bg-blue-400/10',
}

const ROLES: UserRole[] = ['owner', 'supervisor', 'vendor']

const inputClass =
  'bg-nex-black border border-white/10 rounded-lg px-4 py-2.5 text-nex-white font-jost text-sm w-full focus:outline-none focus:border-nex-green/50 transition-colors'
const labelClass =
  'block font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey mb-1.5'

interface Props {
  initialUsers: AdminUser[]
  currentUserId: string
}

export function UserManager({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', role: 'vendor' as UserRole })
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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
      setForm({ email: '', password: '', role: 'vendor' })
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
        <div className="bg-nex-dark border border-white/10 rounded-xl p-6 mb-6">
          <p className="font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-green mb-5">
            Crear usuario
          </p>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <label className={labelClass}>Contraseña</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className={`${inputClass} pr-12`}
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-nex-grey hover:text-nex-white transition-colors p-1"
                  aria-label={showNewPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showNewPassword ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
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
              <p className="sm:col-span-3 font-jost text-sm text-red-400">{formError}</p>
            )}
            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={formLoading}
                className="bg-nex-green text-nex-black font-jost font-bold text-sm py-2 px-6 rounded-lg hover:bg-nex-green/90 transition-colors disabled:opacity-60"
              >
                {formLoading ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-nex-dark border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm font-jost">
          <thead>
            <tr className="border-b border-white/10">
              {['Email', 'Rol', 'Acciones'].map((col) => (
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
            {users.map((user) => (
              <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4 text-nex-white">
                  {user.email}
                  {user.id === currentUserId && (
                    <span className="ml-2 font-dm-mono text-[9px] tracking-wider uppercase text-nex-grey">
                      (vos)
                    </span>
                  )}
                </td>
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
