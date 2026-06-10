'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

export function BeforeAfter() {
  const t = useTranslations('beforeAfter')
  const problems = [t('problem1'), t('problem2'), t('problem3'), t('problem4')]
  const solutions = [t('solution1'), t('solution2'), t('solution3'), t('solution4')]
  const [visible, setVisible] = useState<number[]>([])
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
          const total = problems.length + solutions.length
          for (let i = 0; i < total; i++) {
            setTimeout(() => {
              setVisible((prev) => [...prev, i])
            }, 200 + i * 350)
          }
        }
      },
      { threshold: 0.2 }
    )
    const el = document.getElementById('before-after-section')
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [started])

  return (
    <section id="before-after-section" className="bg-nex-black border-t border-white/5 py-24 px-6 lg:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="font-dm-mono text-[10px] tracking-[0.28em] uppercase text-nex-green mb-3">
            {t('eyebrow')}
          </p>
          <h2 className="font-jost font-extrabold text-3xl sm:text-4xl text-nex-white">
            {t('heading')} <span className="text-nex-green">{t('heading_accent')}</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 rounded-2xl overflow-hidden border border-white/5">
          {/* LEFT — Before */}
          <div className="relative flex flex-col px-10 py-12 border-b lg:border-b-0 lg:border-r border-white/5">
            <div className="absolute inset-0 bg-red-500/[0.03] pointer-events-none" />
            <p className="font-dm-mono text-[10px] tracking-[0.28em] uppercase text-red-400/70 mb-8">
              {t('col_before')}
            </p>
            <ul className="space-y-5">
              {problems.map((p, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 transition-all duration-500"
                  style={{
                    opacity: visible.includes(i) ? 1 : 0,
                    transform: visible.includes(i) ? 'translateX(0)' : 'translateX(-16px)',
                  }}
                >
                  <span className="mt-0.5 text-red-400 font-bold text-sm flex-shrink-0">✗</span>
                  <span className="font-jost text-base text-nex-grey leading-snug">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — After */}
          <div className="relative flex flex-col px-10 py-12">
            <div className="absolute inset-0 bg-nex-green/[0.03] pointer-events-none" />
            <p className="font-dm-mono text-[10px] tracking-[0.28em] uppercase text-nex-green/70 mb-8">
              {t('col_after')}
            </p>
            <ul className="space-y-5">
              {solutions.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 transition-all duration-500"
                  style={{
                    opacity: visible.includes(problems.length + i) ? 1 : 0,
                    transform: visible.includes(problems.length + i)
                      ? 'translateX(0)'
                      : 'translateX(16px)',
                  }}
                >
                  <span className="mt-0.5 text-nex-green font-bold text-sm flex-shrink-0">✓</span>
                  <span className="font-jost text-base text-nex-white leading-snug">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
