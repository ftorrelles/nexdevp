'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { supabase } from '@/lib/supabase'

export function RegisterForm() {
  const t = useTranslations('register')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError(t('errorShortPassword'))
      return
    }

    setLoading(true)
    try {
      // Role is NOT set here on purpose — a DB trigger assigns 'applicant' in
      // app_metadata (admin-only), so a self-registering user cannot escalate.
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: nombre },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/careers/portal`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // If email confirmation is disabled, a session is returned immediately.
      if (data.session) {
        window.location.href = '/careers/portal'
        return
      }

      setDone(true)
    } catch {
      setError(t('errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'bg-nex-black border border-white/10 rounded-lg px-4 py-3 text-nex-white font-jost text-sm w-full focus:outline-none focus:border-nex-green/50 transition-colors'
  const labelClass =
    'block font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey mb-2'

  if (done) {
    return (
      <div className="bg-nex-dark border border-white/10 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-nex-green/10 text-nex-green flex items-center justify-center mx-auto mb-5 text-2xl">
          ✓
        </div>
        <h2 className="font-jost font-bold text-xl text-nex-white mb-2">
          {t('checkEmailTitle')}
        </h2>
        <p className="font-jost text-sm text-nex-grey">
          {t('checkEmailBody', { email })}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-nex-dark border border-white/10 rounded-2xl p-8">
      <h1 className="font-jost font-bold text-2xl text-nex-white mb-2">
        {t('title')}
      </h1>
      <p className="font-jost text-nex-grey text-sm mb-8">{t('subtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nombre" className={labelClass}>{t('nameLabel')}</label>
          <input
            id="nombre"
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={inputClass}
            placeholder={t('namePlaceholder')}
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>{t('emailLabel')}</label>
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
          <label htmlFor="password" className={labelClass}>{t('passwordLabel')}</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-12`}
              placeholder={t('passwordPlaceholder')}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-nex-grey hover:text-nex-white transition-colors p-1"
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
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

        {error && <p className="font-jost text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-nex-green text-nex-black font-jost font-bold py-3 px-6 rounded-lg w-full hover:bg-nex-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? t('submitting') : t('submit')}
        </button>

        <p className="font-jost text-sm text-nex-grey text-center">
          {t('haveAccount')}{' '}
          <Link href="/admin/login" className="text-nex-green hover:underline">
            {t('login')}
          </Link>
        </p>
      </form>
    </div>
  )
}
