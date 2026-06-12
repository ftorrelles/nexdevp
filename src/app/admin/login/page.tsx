'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Credenciales incorrectas')
        return
      }

      // Applicants are not staff — send them to their portal.
      router.push(data.role === 'applicant' ? '/careers/portal' : '/admin')
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setForgotSent(true)
      } else {
        const data = await res.json()
        setError(data.error ?? 'No se pudo enviar el email')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'bg-nex-black border border-white/10 rounded-lg px-4 py-3 text-nex-white font-jost text-sm w-full focus:outline-none focus:border-nex-green/50 transition-colors'
  const labelClass =
    'block font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey mb-2'

  return (
    <div className="min-h-screen bg-nex-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Back to site */}
        <Link
          href="/es"
          className="inline-flex items-center gap-2 font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey hover:text-nex-white transition-colors mb-8"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 2L4 6l4 4" />
          </svg>
          Volver al sitio
        </Link>

        <div className="bg-nex-dark border border-white/10 rounded-2xl p-8">
          <h1 className="font-jost font-bold text-2xl text-nex-white mb-2">
            nexdevp CRM
          </h1>
          <p className="font-jost text-nex-grey text-sm mb-8">
            {forgotMode ? 'Te enviamos un link para crear tu contraseña.' : 'Ingresá tus credenciales para continuar.'}
          </p>

          {forgotSent ? (
            <div className="space-y-4">
              <p className="font-jost text-sm text-nex-green">
                Revisá tu email — te enviamos un link para crear tu contraseña.
              </p>
              <button
                onClick={() => { setForgotMode(false); setForgotSent(false) }}
                className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors"
              >
                ← Volver al login
              </button>
            </div>
          ) : forgotMode ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label htmlFor="email-reset" className={labelClass}>Email</label>
                <input
                  id="email-reset"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </div>
              {error && <p className="font-jost text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="bg-nex-green text-nex-black font-jost font-bold py-3 px-6 rounded-lg w-full hover:bg-nex-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
              <button
                type="button"
                onClick={() => { setForgotMode(false); setError('') }}
                className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors w-full text-center"
              >
                ← Volver al login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className={labelClass}>
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-nex-grey hover:text-nex-white transition-colors p-1"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="font-jost text-sm text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="bg-nex-green text-nex-black font-jost font-bold py-3 px-6 rounded-lg w-full hover:bg-nex-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Verificando...' : 'Ingresar'}
              </button>

              <button
                type="button"
                onClick={() => { setForgotMode(true); setError('') }}
                className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors w-full text-center"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
