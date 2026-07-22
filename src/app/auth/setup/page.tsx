'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CustomCursor } from '@/components/ui/CustomCursor'

type Step = 'loading' | 'set-password' | 'success' | 'error'

export default function AuthSetupPage() {
  const router = useRouter()
  const [step,         setStep]         = useState<Step>('loading')
  const [role,         setRole]         = useState<string | null>(null)
  const [password,     setPassword]     = useState('')
  const [confirm,      setConfirm]      = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [saving,       setSaving]       = useState(false)

  useEffect(() => {
    // Give Supabase up to 6s to parse the hash and fire the auth event.
    // supabase-js v2 automatically reads #access_token from the URL.
    const timeout = setTimeout(() => {
      setStep(prev => (prev === 'loading' ? 'error' : prev))
    }, 6000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      clearTimeout(timeout)
      if (session?.user) {
        setRole(session.user.app_metadata?.role ?? null)
        setStep('set-password')
      } else {
        setStep('error')
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 8) {
      setError('Mínimo 8 caracteres.')
      return
    }
    setSaving(true)
    setError(null)

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    // Sign out the localStorage session so the server cookie session takes over on login.
    await supabase.auth.signOut()

    setStep('success')
    setTimeout(() => router.push('/admin/login'), 2000)
  }

  const inputClass =
    'bg-nex-black border border-white/10 rounded-lg px-4 py-3 text-nex-white font-jost text-sm w-full focus:outline-none focus:border-nex-green/50 transition-colors'
  const labelClass =
    'block font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey mb-2'

  return (
    <div className="min-h-screen bg-nex-black flex items-center justify-center px-4">
      <CustomCursor />
      <div className="w-full max-w-sm">

        {step === 'loading' && (
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-nex-green/30 border-t-nex-green rounded-full animate-spin mx-auto" />
            <p className="font-jost text-nex-grey text-sm">Verificando tu invitación…</p>
          </div>
        )}

        {step === 'success' && (
          <div className="bg-nex-dark border border-nex-green/30 rounded-2xl p-8 text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-nex-green/10 flex items-center justify-center mx-auto">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-nex-green">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-jost font-bold text-nex-white text-lg">¡Contraseña creada!</p>
            <p className="font-jost text-nex-grey text-sm">
              Redirigiendo al login para que ingreses con tus credenciales…
            </p>
          </div>
        )}

        {step === 'error' && (
          <div className="bg-nex-dark border border-white/10 rounded-2xl p-8 text-center space-y-4">
            <p className="font-jost font-bold text-nex-white text-lg mb-1">Link inválido</p>
            <p className="font-jost text-nex-grey text-sm">
              Este link de invitación expiró o ya fue utilizado. Pedí que te reenvíen la invitación.
            </p>
            <Link
              href="/admin/login"
              className="inline-block font-jost text-sm text-nex-green hover:text-nex-green/80 transition-colors mt-2"
            >
              Ir al login →
            </Link>
          </div>
        )}

        {step === 'set-password' && (
          <div className="bg-nex-dark border border-white/10 rounded-2xl p-8">
            <div className="mb-6">
              <p className="font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-green mb-2">
                Bienvenido/a a nexdevp
              </p>
              <h1 className="font-jost font-bold text-2xl text-nex-white mb-2">
                Creá tu contraseña
              </h1>
              <p className="font-jost text-nex-grey text-sm">
                Elegí una contraseña segura para acceder a tu portal.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-nex-grey hover:text-nex-white transition-colors p-1"
                    aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Confirmar contraseña</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className={inputClass}
                  placeholder="Repetí la contraseña"
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <p className="font-jost text-sm text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="bg-nex-green text-nex-black font-jost font-bold py-3 px-6 rounded-lg w-full hover:bg-nex-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando…' : 'Confirmar y acceder'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}
