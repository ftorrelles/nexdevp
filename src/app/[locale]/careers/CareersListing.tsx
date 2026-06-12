'use client'

import React, { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/content/types'
import type { Career } from '@/lib/supabase'

interface Props {
  careers: Career[]
  locale: Locale
  currentUser: { email: string; name: string } | null
}

export function CareersListing({ careers, locale, currentUser }: Props): React.JSX.Element {
  const t = useTranslations('careers')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Form state — prefilled from the logged-in applicant's account
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombre: currentUser?.name ?? '',
    email: currentUser?.email ?? '',
    telefono: '',
    mensaje: '',
  })
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isDragActive, setIsDragActive] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0])
      setErrorMsg('')
    }
  }

  // Drag and drop handlers
  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      const fileType = file.name.split('.').pop()?.toLowerCase()
      if (fileType === 'pdf' || fileType === 'doc' || fileType === 'docx') {
        setCvFile(file)
        setErrorMsg('')
      } else {
        setErrorMsg(locale === 'es' ? 'Solo se permiten archivos PDF o Word.' : 'Only PDF or Word files are allowed.')
      }
    }
  }

  async function handleApplySubmit(e: React.FormEvent, careerId: string) {
    e.preventDefault()
    setSubmittingId(careerId)
    setErrorMsg('')
    setSuccessMsg('')

    if (!formData.nombre || !formData.email || !cvFile) {
      setErrorMsg(locale === 'es' ? 'Por favor completa los campos obligatorios.' : 'Please fill in all required fields.')
      setSubmittingId(null)
      return
    }

    const data = new FormData()
    data.append('career_id', careerId)
    data.append('nombre', formData.nombre)
    data.append('email', formData.email)
    data.append('telefono', formData.telefono)
    data.append('mensaje', formData.mensaje)
    data.append('cv', cvFile)

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        body: data,
      })

      const json = await res.json()

      if (res.ok) {
        setSuccessMsg(t('submitSuccess'))
        setFormData({ nombre: '', email: '', telefono: '', mensaje: '' })
        setCvFile(null)
      } else {
        setErrorMsg(json.error || t('submitError'))
      }
    } catch {
      setErrorMsg(t('submitError'))
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <section className="relative px-6 lg:px-12 py-20 max-w-5xl mx-auto">
      {/* Background glow elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-nex-green/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="text-center mb-16 relative z-10">
        <h1 className="font-jost font-bold text-4xl md:text-5xl text-nex-white mb-4">
          {t('title')}
        </h1>
        <p className="font-jost text-base md:text-lg text-nex-grey max-w-xl mx-auto leading-relaxed">
          {t('subtitle')}
        </p>
      </div>

      <div className="space-y-6 relative z-10">
        {careers.length === 0 ? (
          <div className="bg-nex-dark border border-white/5 rounded-2xl p-8 text-center text-nex-grey">
            <p className="text-sm">{t('noPositions')}</p>
          </div>
        ) : (
          careers.map(career => {
            const isExpanded = expandedId === career.id
            
            // Localized texts
            const title = locale === 'en' ? career.title_en : career.title_es
            const department = locale === 'en' ? career.department_en : career.department_es
            const location = locale === 'en' ? career.location_en : career.location_es
            const type = locale === 'en' ? career.type_en : career.type_es
            const description = locale === 'en' ? career.description_en : career.description_es
            
            const reqs = (locale === 'en' ? career.requirements_en : career.requirements_es)
              ?.split('\n')
              .filter(line => line.trim()) ?? []
            const resps = (locale === 'en' ? career.responsibilities_en : career.responsibilities_es)
              ?.split('\n')
              .filter(line => line.trim()) ?? []

            return (
              <div
                key={career.id}
                className="bg-nex-dark border border-white/10 rounded-2xl p-6 md:p-8 hover:border-white/20 transition-all duration-300 shadow-xl"
              >
                {/* Header card view */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <span className="inline-flex font-dm-mono text-[9px] tracking-[0.2em] uppercase text-nex-green border border-nex-green/30 rounded px-2.5 py-1 bg-nex-green/5">
                      {department}
                    </span>
                    <h2 className="font-jost font-bold text-2xl text-nex-white">
                      {title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-nex-grey">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-nex-grey" />
                        {location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-nex-green" />
                        {type}
                      </span>
                    </div>
                    <p className="text-sm text-nex-grey/90 leading-relaxed pt-2 max-w-3xl">
                      {description}
                    </p>
                  </div>

                  <div className="flex items-center md:self-center">
                    <button
                      onClick={() => {
                        setExpandedId(isExpanded ? null : career.id!)
                        setErrorMsg('')
                        setSuccessMsg('')
                      }}
                      className={[
                        'w-full md:w-auto font-jost text-sm font-bold py-3 px-6 rounded-lg transition-all duration-300 whitespace-nowrap',
                        isExpanded
                          ? 'bg-white/10 text-nex-white hover:bg-white/15'
                          : 'bg-nex-green text-nex-black hover:bg-nex-green/90 shadow-[0_0_20px_rgba(34,181,97,0.2)]',
                      ].join(' ')}
                    >
                      {isExpanded ? t('closePosition') : t('applyNow')}
                    </button>
                  </div>
                </div>

                {/* Expanded detail & form view */}
                {isExpanded && (
                  <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
                    {/* Details: Reqs & Responsibilities */}
                    <div className="space-y-6">
                      {reqs.length > 0 && (
                        <div>
                          <h4 className="font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-green mb-3">
                            {t('requirements')}
                          </h4>
                          <ul className="space-y-2 text-sm text-nex-grey">
                            {reqs.map((req, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-nex-green select-none mt-0.5">•</span>
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {resps.length > 0 && (
                        <div>
                          <h4 className="font-dm-mono text-[10px] tracking-[0.2em] uppercase text-nex-green mb-3">
                            {t('responsibilities')}
                          </h4>
                          <ul className="space-y-2 text-sm text-nex-grey">
                            {resps.map((resp, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-nex-green select-none mt-0.5">→</span>
                                <span>{resp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Apply Form */}
                    <div className="bg-nex-black/40 border border-white/5 rounded-xl p-6">
                      <h3 className="font-jost font-bold text-lg text-nex-white mb-4">
                        {t('formTitle')}
                      </h3>

                      {!currentUser ? (
                        <div className="text-center space-y-4 py-2">
                          <p className="text-sm text-nex-grey">
                            {locale === 'es'
                              ? 'Necesitás una cuenta para postularte a esta posición.'
                              : 'You need an account to apply for this position.'}
                          </p>
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link
                              href="/careers/registro"
                              className="w-full sm:w-auto bg-nex-green text-nex-black font-bold text-sm py-2.5 px-5 rounded-lg hover:bg-nex-green/90 transition-colors"
                            >
                              {locale === 'es' ? 'Crear cuenta' : 'Create account'}
                            </Link>
                            <Link
                              href="/careers/login"
                              className="font-jost text-sm text-nex-grey hover:text-nex-white transition-colors"
                            >
                              {locale === 'es' ? 'Ya tengo cuenta · Ingresar' : 'I have an account · Log in'}
                            </Link>
                          </div>
                        </div>
                      ) : successMsg ? (
                        <div className="bg-nex-green/10 border border-nex-green/30 text-nex-green text-sm rounded-lg p-4 text-center">
                          {successMsg}
                        </div>
                      ) : (
                        <form onSubmit={e => handleApplySubmit(e, career.id!)} className="space-y-4">
                          <div>
                            <label className="block text-xs text-nex-grey mb-1.5">{t('nameLabel')}</label>
                            <input
                              type="text"
                              name="nombre"
                              required
                              value={formData.nombre}
                              onChange={handleInputChange}
                              className="w-full bg-nex-black border border-white/10 rounded-lg px-3.5 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-nex-grey mb-1.5">{t('emailLabel')}</label>
                              <input
                                type="email"
                                name="email"
                                required
                                readOnly
                                value={formData.email}
                                className="w-full bg-nex-black/60 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-nex-grey cursor-not-allowed focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-nex-grey mb-1.5">{t('phoneLabel')}</label>
                              <input
                                type="text"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleInputChange}
                                className="w-full bg-nex-black border border-white/10 rounded-lg px-3.5 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-nex-grey mb-1.5">{t('messageLabel')}</label>
                            <textarea
                              name="mensaje"
                              rows={3}
                              value={formData.mensaje}
                              onChange={handleInputChange}
                              className="w-full bg-nex-black border border-white/10 rounded-lg px-3.5 py-2 text-sm text-nex-white focus:outline-none focus:border-nex-green/50 transition-colors resize-none"
                            />
                          </div>

                          {/* Drag and Drop CV File */}
                          <div>
                            <label className="block text-xs text-nex-grey mb-1.5">{t('cvLabel')}</label>
                            <div
                              onDragEnter={handleDrag}
                              onDragOver={handleDrag}
                              onDragLeave={handleDrag}
                              onDrop={handleDrop}
                              onClick={() => fileInputRef.current?.click()}
                              className={[
                                'border border-dashed rounded-lg p-5 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2',
                                isDragActive
                                  ? 'border-nex-green bg-nex-green/5'
                                  : cvFile
                                  ? 'border-nex-green/50 bg-nex-green/5'
                                  : 'border-white/10 hover:border-white/20 bg-nex-black',
                              ].join(' ')}
                            >
                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx"
                                className="hidden"
                              />
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-nex-grey">
                                <path d="M12 16v-8m0 0l-3 3m3-3l3 3m-9 9h12a2 2 0 002-2V6a2 2 0 00-2-2H8L4 8v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span className="text-xs text-nex-grey">
                                {cvFile
                                  ? t('fileSelected', { name: cvFile.name })
                                  : isDragActive
                                  ? t('cvDragActive')
                                  : t('cvDragInactive')}
                              </span>
                            </div>
                          </div>

                          {errorMsg && <p className="text-red-400 text-xs">{errorMsg}</p>}

                          <button
                            type="submit"
                            disabled={submittingId === career.id}
                            className="w-full bg-nex-green text-nex-black font-bold text-sm py-2.5 rounded-lg hover:bg-nex-green/90 transition-colors disabled:opacity-60"
                          >
                            {submittingId === career.id ? t('submitting') : t('submit')}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
