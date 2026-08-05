'use client'

import Image from 'next/image'

export interface MetricItem {
  label: string
  value: string
  trend?: string
  featured?: boolean
}

export interface SocialCard916Props {
  headline: string
  subtitle: string
  ctaText?: string
  metrics?: MetricItem[]
  bgImageUrl?: string
  tagline?: string
}

export function SocialCard916({
  headline,
  subtitle,
  ctaText = 'Solicita una demo con nexdevp',
  metrics = [
    { label: 'Respuesta a leads', value: '45 segundos', trend: '⚡ Inmediato', featured: true },
    { label: 'Pipeline activo', value: '+35%' },
    { label: 'Leads calificados', value: '100%' },
    { label: 'Cotizaciones en PDF', value: '30s' },
    { label: 'Conversión canal', value: 'Optimizado' },
  ],
  bgImageUrl,
  tagline = 'Sistemas B2B',
}: SocialCard916Props): React.ReactNode {
  return (
    <div className="relative mx-auto flex h-[800px] w-[450px] flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 bg-[#191A1B] p-9 text-white shadow-2xl shadow-emerald-500/20">
      {/* Background Glow Overlay */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#22B561]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#22B561]/20 blur-3xl" />

      {/* Optional AI-generated background graphic */}
      {bgImageUrl && (
        <div className="absolute inset-0 z-0 opacity-20 mix-blend-overlay">
          <Image
            src={bgImageUrl}
            alt="Fondo decorativo"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* Header with Official nexdevp Logo Asset */}
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/logo-dark.svg"
            alt="nexdevp"
            width={140}
            height={36}
            className="h-9 w-auto"
            priority
          />
        </div>
        <span className="rounded-full border border-[#22B561]/30 bg-[#22B561]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#22B561]">
          {tagline}
        </span>
      </header>

      {/* Main Copy Area */}
      <div className="relative z-10 mt-2">
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-white">
          {headline.includes('clientes') ? (
            <>
              ¿Cuántos <span className="text-[#22B561]">clientes</span> estás perdiendo por responder tarde?
            </>
          ) : (
            headline
          )}
        </h1>
        <p className="mt-2.5 text-sm font-medium leading-snug text-gray-300">
          {subtitle}
        </p>
      </div>

      {/* Dashboard Card Container */}
      <div className="relative z-10 rounded-2xl border border-white/10 bg-[#1B1B1C] p-5 shadow-xl">
        <div className="mb-3.5 flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#8A8C8B]">
            <span className="h-2 w-2 rounded-full bg-[#22B561] shadow-[0_0_8px_#22B561]" />
            Sistema Comercial nexdevp
          </div>
          <span className="text-[11px] font-semibold text-[#22B561]">En vivo</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className={`rounded-xl border p-3 ${
                metric.featured
                  ? 'col-span-2 flex items-center justify-between border-[#22B561]/40 bg-gradient-to-r from-[#22B561]/15 to-[#1B1B1C]'
                  : 'border-white/5 bg-white/[0.03]'
              }`}
            >
              <div>
                <div className="text-[11px] font-medium text-[#8A8C8B]">{metric.label}</div>
                <div
                  className={`font-extrabold ${
                    metric.featured ? 'text-2xl text-[#22B561]' : 'text-xl text-white'
                  }`}
                >
                  {metric.value}
                </div>
              </div>
              {metric.trend && (
                <span className="rounded bg-[#22B561]/15 px-2 py-1 text-[10px] font-semibold text-[#22B561]">
                  {metric.trend}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer & Call to Action */}
      <footer className="relative z-10 flex flex-col gap-3">
        <button
          type="button"
          className="w-full rounded-xl bg-[#22B561] py-4 text-center text-sm font-extrabold text-[#191A1B] shadow-lg shadow-[#22B561]/30 transition hover:bg-[#26cb6d]"
        >
          {ctaText}
        </button>
        <div className="text-center text-[11px] font-medium text-[#8A8C8B]">
          nexdevp.com · De procesos caóticos a operaciones solas
        </div>
      </footer>
    </div>
  )
}
