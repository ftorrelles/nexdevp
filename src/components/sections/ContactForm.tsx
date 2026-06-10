'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

const BUSINESS_TYPE_KEYS = [
  'business_clinic',
  'business_distributor',
  'business_consulting',
  'business_retail',
  'business_restaurant',
  'business_other',
] as const

const inputClass =
  'bg-nex-black border border-white/10 rounded-lg px-4 py-3 text-nex-white font-jost text-sm w-full focus:outline-none focus:border-nex-green/50 transition-colors'

const labelClass =
  'block font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-grey mb-2'

export function ContactForm() {
  const t = useTranslations('contactForm')
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    tipo_negocio: '',
    mensaje: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? t('error_generic'))
      }

      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('error_generic'))
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-nex-dark border border-white/10 rounded-2xl p-8 flex items-center justify-center min-h-[320px]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-nex-green/20 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 13l4 4L19 7"
                stroke="#22b561"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="font-jost text-nex-white font-semibold text-lg">
            {t('success')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-nex-dark border border-white/10 rounded-2xl p-8">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="nombre" className={labelClass}>
            {t('name_label')}
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            value={form.nombre}
            onChange={handleChange}
            className={inputClass}
            placeholder={t('name_placeholder')}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            {t('email_label')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className={inputClass}
            placeholder={t('email_placeholder')}
          />
        </div>

        <div>
          <label htmlFor="telefono" className={labelClass}>
            {t('phone_label')}
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            value={form.telefono}
            onChange={handleChange}
            className={inputClass}
            placeholder={t('phone_placeholder')}
          />
        </div>

        <div>
          <label htmlFor="tipo_negocio" className={labelClass}>
            {t('business_label')}
          </label>
          <select
            id="tipo_negocio"
            name="tipo_negocio"
            value={form.tipo_negocio}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">{t('business_placeholder')}</option>
            {BUSINESS_TYPE_KEYS.map((key) => (
              <option key={key} value={t(key)}>
                {t(key)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="mensaje" className={labelClass}>
            {t('message_label')}
          </label>
          <textarea
            id="mensaje"
            name="mensaje"
            rows={4}
            value={form.mensaje}
            onChange={handleChange}
            className={`${inputClass} resize-none`}
            placeholder={t('message_placeholder')}
          />
        </div>

        {status === 'error' && (
          <p className="font-jost text-sm text-red-400">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="bg-nex-green text-nex-black font-jost font-bold py-3 px-6 rounded-lg w-full hover:bg-nex-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? t('submitting') : t('submit')}
        </button>
      </form>
    </div>
  )
}
