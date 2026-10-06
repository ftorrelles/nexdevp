'use client'

import { useState, type ReactElement } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { calculateBudget } from './useCaseSimulation'

const tabs = ['profit', 'expenses', 'budgets', 'budget', 'team'] as const
const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nex-green'

export function ConstructionPreview(): ReactElement {
  const t = useTranslations('useCases.preview.construction')
  const locale = useLocale()
  const [screen, setScreen] = useState<typeof tabs[number]>('profit')
  const [area, setArea] = useState(100)
  const budget = calculateBudget(area)
  const money = (value: number): string => new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)
  const resources = [
    { key: 'materials', expected: area * 2, actual: area * 3 },
    { key: 'equipment', expected: area * 0.5, actual: area * 0.7 },
    { key: 'labor', expected: area * 3.5, actual: area * 3.5 },
  ]
  const panel = 'rounded-lg border border-white/10 bg-white/[0.02]'

  return (
    <div data-product="construction" className="min-w-0 overflow-hidden rounded-xl border border-nex-green/25 bg-[#090c0b] text-nex-white shadow-xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-nex-green/[0.03] px-4 py-3">
        <span aria-hidden="true" className="flex gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" /><span className="h-2 w-2 rounded-full bg-amber-400" /><span className="h-2 w-2 rounded-full bg-nex-green" /></span>
        <span className="font-dm-mono text-[10px] tracking-wider text-nex-green">{t('app')}</span>
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-nex-green" />
      </div>
      <div role="group" aria-label={t('screens')} className="flex flex-wrap gap-2 bg-white/[0.03] p-3">
        {tabs.map((key) => (
          <button key={key} type="button" aria-pressed={screen === key} onClick={() => setScreen(key)} className={`min-h-11 rounded-md border px-3 text-xs ${focus} ${screen === key ? 'border-nex-green bg-nex-green font-semibold text-nex-black' : 'border-white/15 bg-white/[0.03] text-nex-grey hover:text-nex-white'}`}>
            {t(`tabs.${key}`)}
          </button>
        ))}
      </div>
      <div className="min-h-[340px] p-4 sm:p-5">
        {screen === 'profit' ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h4 className="text-base font-semibold">{t('titles.profit')}</h4><p className="mt-1 text-xs text-nex-grey">{t('forecast')}</p></div>
              <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-nex-grey">{t('inProgress')}</span>
            </div>
            <div className="my-5 flex flex-wrap items-baseline justify-between gap-3">
              <p className="text-4xl font-bold tracking-tight sm:text-5xl">{money(budget.forecast)}</p>
              <p className="text-xs text-nex-grey">{t('margin')} <strong className="text-nex-green">12%</strong></p>
            </div>
            <p className="mb-2 text-xs text-nex-grey">{t('sale')} <strong className="text-nex-white">{money(budget.sale)}</strong></p>
            <svg viewBox="0 0 100 3" role="img" aria-label={t('breakdownLabel')} className="h-3 w-full overflow-hidden rounded-full" preserveAspectRatio="none">
              <rect width="48" height="3" className="fill-slate-500" />
              <rect x="48" width="40" height="3" className="fill-slate-800" />
              <rect x="88" width="12" height="3" className="fill-nex-green" />
            </svg>
            <div className="my-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-nex-grey">
              <p><span className="mr-1 text-slate-400">●</span>{t('actual')} <strong className="text-nex-white">{money(budget.actual)}</strong></p>
              <p><span className="mr-1 text-slate-600">●</span>{t('remaining')} <strong className="text-nex-white">{money(budget.total / 2)}</strong></p>
              <p><span className="mr-1 text-nex-green">●</span>{t('result')} <strong className="text-nex-green">{money(budget.forecast)}</strong></p>
            </div>
            <p className="mt-5 rounded-lg border border-nex-green/20 bg-nex-green/5 p-3 text-xs leading-relaxed text-nex-grey">{t('forecastNote', { sale: money(budget.sale), actual: money(budget.actual), pending: money(budget.total / 2) })}</p>
          </>
        ) : screen === 'expenses' ? (
          <>
            <h4 className="mb-3 text-base font-semibold">{t('titles.expenses')}</h4>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { key: 'expected', value: money(budget.total / 2) },
                { key: 'actual', value: money(budget.actual) },
                { key: 'difference', value: money(budget.actual - budget.total / 2) },
                { key: 'progress', value: '50%' },
              ].map((item) => <div key={item.key} className={`${panel} p-3`}><p className="text-[11px] text-nex-grey">{t(item.key)}</p><p className={`mt-1 text-sm font-semibold ${item.key === 'difference' ? 'text-amber-300' : ''}`}>{item.value}</p></div>)}
            </div>
            <table className="w-full border-collapse text-xs">
              <caption className="mb-3 text-left text-xs text-nex-grey">{t('half')}</caption>
              <thead><tr className="border-b border-white/10 text-nex-grey"><th scope="col" className="py-2 text-left font-normal">{t('resource')}</th><th scope="col" className="text-right font-normal">{t('expectedShort')}</th><th scope="col" className="text-right font-normal">{t('actualShort')}</th><th scope="col" className="text-right font-normal">{t('differenceShort')}</th></tr></thead>
              <tbody>
                {resources.map((resource) => (
                  <tr key={resource.key} className="border-b border-white/5">
                    <th scope="row" className="py-3 text-left font-medium">{t(resource.key)}</th>
                    <td className="text-right tabular-nums text-nex-grey">{money(resource.expected)}</td>
                    <td className="text-right tabular-nums text-nex-grey">{money(resource.actual)}</td>
                    <td className={`text-right tabular-nums ${resource.actual > resource.expected ? 'text-amber-300' : 'text-nex-green'}`}>{money(resource.actual - resource.expected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : screen === 'budgets' ? (
          <>
            <div className="mb-4 flex items-center justify-between gap-3"><h4 className="text-base font-semibold">{t('titles.budgets')}</h4><button type="button" onClick={() => setScreen('budget')} className={`min-h-11 rounded-md bg-nex-green px-3 text-xs font-semibold text-nex-black ${focus}`}>{t('openBudget')}</button></div>
            <div className="space-y-3">
              {['office', 'warehouse', 'electrical'].map((key, index) => (
                <button key={key} type="button" onClick={() => setScreen('budget')} className={`w-full rounded-lg border border-white/10 border-l-[3px] p-3 text-left ${index === 1 ? 'border-l-blue-400' : 'border-l-nex-green'} ${focus}`}>
                  <span className="flex flex-wrap justify-between gap-2 text-[10px] text-nex-grey"><span>PRE-DEMO-00{index + 1}</span><span className={index === 1 ? 'text-blue-300' : 'text-nex-green'}>● {t(index === 1 ? 'review' : 'inProgress')}</span></span>
                  <span className="mt-2 flex flex-wrap justify-between gap-2"><span className="text-sm">{t(`projects.${key}`)}</span><strong className="text-sm">{money(index === 0 ? budget.sale : index === 1 ? 4200 : 2600)}</strong></span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-nex-grey">{t('listNote')}</p>
          </>
        ) : screen === 'budget' ? (
          <>
            <p className="mb-2 text-xs text-nex-grey">{t('project')}</p>
            <h4 className="text-base font-semibold">{t('work')}</h4>
            <label htmlFor="use-case-area" className="my-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span>{t('area')}</span><span className="flex items-center gap-2"><input id="use-case-area" type="number" min="10" max="500" step="10" value={area} onChange={(event) => { const value = Number(event.target.value); if (value >= 10 && value <= 500) setArea(value) }} className={`min-h-11 w-24 rounded border border-nex-green/60 bg-[#090c0b] p-2 text-lg ${focus}`} />m²</span>
            </label>
            <div className={`${panel} px-3`}>
              {(['materials', 'equipment', 'labor'] as const).map((key) => <p key={key} className="flex justify-between gap-3 border-b border-white/10 py-3 text-sm last:border-0"><span className="text-nex-grey">{t(key)}</span><strong>{money(budget[key])}</strong></p>)}
            </div>
            <div role="status" className="mt-4 rounded-lg border border-nex-green/20 bg-nex-green/5 p-4"><p className="text-xs text-nex-grey">{t('total')}</p><p className="my-2 text-3xl font-semibold text-nex-green">{money(budget.total)}</p><p className="text-xs leading-relaxed text-nex-grey">{t('formula', { area })}</p></div>
          </>
        ) : (
          <>
            <h4 className="mb-1 text-base font-semibold">{t('titles.team')}</h4>
            <p className="mb-4 text-xs text-nex-grey">{t('payments')}</p>
            <div className={`${panel} px-4`}>
              {[
                { key: 'earned', value: area * 3.5 },
                { key: 'advance', value: area },
                { key: 'balance', value: area * 2.5 },
              ].map((item) => <p key={item.key} className="flex justify-between gap-3 border-b border-white/10 py-4 text-sm last:border-0"><span className="text-nex-grey">{t(item.key)}</span><strong>{money(item.value)}</strong></p>)}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-nex-grey">{t('roles')}</p>
          </>
        )}
      </div>
    </div>
  )
}
