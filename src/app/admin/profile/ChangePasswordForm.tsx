'use client'

import { useState } from 'react'

const inputClass =
  'bg-nex-black border border-white/10 rounded-lg px-4 py-3 text-nex-white font-jost text-sm w-full focus:outline-none focus:border-nex-green/50 transition-colors pr-12'
const labelClass =
  'block font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey mb-2'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  )
}

export function ChangePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setErrorMsg('Las contraseñas no coinciden')
      setStatus('error')
      return
    }
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorMsg(data.error); setStatus('error'); return }
      setStatus('success')
      setPassword('')
      setConfirm('')
    } catch {
      setErrorMsg('Error de conexión')
      setStatus('error')
    }
  }

  return (
    <div className="bg-nex-dark border border-white/10 rounded-xl p-6">
      <p className="font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-green mb-5">
        Cambiar contraseña
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Nueva contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="Mínimo 8 caracteres"
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-nex-grey hover:text-nex-white transition-colors p-1">
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>Confirmar contraseña</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputClass}
              placeholder="Repetí la contraseña"
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-nex-grey hover:text-nex-white transition-colors p-1">
              <EyeIcon open={showConfirm} />
            </button>
          </div>
        </div>

        {status === 'error' && (
          <p className="font-jost text-sm text-red-400">{errorMsg}</p>
        )}
        {status === 'success' && (
          <p className="font-jost text-sm text-nex-green">Contraseña actualizada correctamente.</p>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-nex-green text-nex-black font-jost font-bold py-3 px-6 rounded-lg w-full hover:bg-nex-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Guardando...' : 'Actualizar contraseña'}
        </button>
      </form>
    </div>
  )
}
