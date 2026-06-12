'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function LoginForm() {
  const t = useTranslations('careersLogin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
        setError(data.error ?? t('errorGeneric'))
        return
      }
      // Applicants go to their portal; staff fall back to the CRM.
      window.location.href = data.role === 'applicant' ? '/careers/portal' : '/admin'
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

  return (
    <div className="bg-nex-dark border border-white/10 rounded-2xl p-8">
      <h1 className="font-jost font-bold text-2xl text-nex-white mb-2">{t('title')}</h1>
      <p className="font-jost text-nex-grey text-sm mb-8">{t('subtitle')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          {t('noAccount')}{' '}
          <Link href="/careers/registro" className="text-nex-green hover:underline">
            {t('register')}
          </Link>
        </p>
      </form>
    </div>
  )
}
