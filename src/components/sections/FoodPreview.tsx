'use client'

import { useState, type ReactElement } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { calculatePackages } from './useCaseSimulation'

const tabs = ['plan', 'dashboard', 'diets'] as const
const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#15543a]'
const input = `min-h-11 w-full rounded-md border border-[#d2dcd2] bg-white px-3 py-2 text-sm text-[#2c3a32] ${focus}`
const card = 'rounded-lg border border-[#e3e7e3] bg-white'
const proteins = ['chicken', 'fish', 'meatballs', 'burger'] as const
const weeklyHeights = ['h-20', 'h-16', 'h-12', 'h-[72px]', 'h-14', 'h-10', 'h-3']

export function FoodPreview(): ReactElement {
  const t = useTranslations('useCases.preview.food')
  const locale = useLocale()
  const [screen, setScreen] = useState<typeof tabs[number]>('plan')
  const [portions, setPortions] = useState(100)
  const [protein, setProtein] = useState<typeof proteins[number]>('chicken')
  const [unitsPerBox, setUnitsPerBox] = useState(20)
  const [unitsPerServing, setUnitsPerServing] = useState(2)
  const [wastePercent, setWastePercent] = useState(30)
  const [result, setResult] = useState<number | null>(null)
  const [diet, setDiet] = useState('vegetables')
  const [dietPortions, setDietPortions] = useState(18)
  const quantity = (value: number): string => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)

  function chooseProtein(value: typeof proteins[number]): void {
    setProtein(value)
    setWastePercent(value === 'chicken' ? 30 : value === 'fish' ? 15 : 5)
    setResult(null)
  }

  return (
    <div data-product="food" className="min-w-0 overflow-hidden rounded-xl border border-[#d2dcd2] bg-[#f3f5f3] text-[#2c3a32] shadow-xl">
      <div className="flex items-center justify-between gap-3 bg-[#15543a] px-4 py-3 text-white"><strong className="text-sm">{t('app')}</strong><span className="text-xs text-white/90">{t('service')}</span></div>
      <div role="group" aria-label={t('screens')} className="flex flex-wrap gap-2 bg-[#eef1ee] p-3">
        {tabs.map((key) => <button key={key} type="button" aria-pressed={screen === key} onClick={() => setScreen(key)} className={`min-h-11 rounded-md border px-3 text-xs ${focus} ${screen === key ? 'border-[#15543a] bg-[#15543a] font-semibold text-white' : 'border-[#d2dcd2] bg-[#e8ece8] text-[#496152]'}`}>{t(`tabs.${key}`)}</button>)}
      </div>
      <div className="min-h-[340px] space-y-4 p-4 sm:p-5">
        {screen === 'plan' ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#15543a] p-4 text-white"><div><p className="text-xs text-white/90">{t('patients')}</p><p className="mt-1 text-3xl font-bold">{portions}</p></div><label htmlFor="use-case-portions" className="max-w-32"><span className="mb-1 block text-xs">{t('portions')}</span><input id="use-case-portions" type="number" min="10" max="1000" value={portions} onChange={(event) => { const value = Number(event.target.value); if (value >= 10 && value <= 1000) { setPortions(value); setResult(null) } }} className={input} /></label></div>
            <p className="text-xs font-semibold text-[#15543a]">{t('protein')}</p>
            <div className={`${card} flex items-center justify-between p-3`}><strong className="text-sm">{t(`proteins.${protein}`)}</strong><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] text-emerald-800">{t('selected')}</span></div>
            <fieldset><legend className="mb-2 text-xs text-[#496152]">{t('quickSelect')}</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{proteins.map((key) => <button key={key} type="button" aria-pressed={protein === key} onClick={() => chooseProtein(key)} className={`min-h-11 rounded-md border p-2 text-xs ${focus} ${protein === key ? 'border-[#15543a] bg-[#15543a] font-semibold text-white' : 'border-[#e3e7e3] bg-white'}`}>{t(`proteins.${key}`)}</button>)}</div></fieldset>
            <div className="grid grid-cols-3 gap-2">
              <label htmlFor="food-box"><span className="mb-1 block text-[11px] text-[#496152]">{t('unitsBox')}</span><input id="food-box" type="number" min="1" max="100" value={unitsPerBox} onChange={(event) => { const value = Number(event.target.value); if (value >= 1 && value <= 100) { setUnitsPerBox(value); setResult(null) } }} className={input} /></label>
              <label htmlFor="food-serving"><span className="mb-1 block text-[11px] text-[#496152]">{t('unitsServing')}</span><input id="food-serving" type="number" min="1" max="10" value={unitsPerServing} onChange={(event) => { const value = Number(event.target.value); if (value >= 1 && value <= 10) { setUnitsPerServing(value); setResult(null) } }} className={input} /></label>
              <label htmlFor="food-waste"><span className="mb-1 block text-[11px] text-[#496152]">{t('waste')}</span><input id="food-waste" type="number" min="0" max="90" value={wastePercent} onChange={(event) => { const value = Number(event.target.value); if (value >= 0 && value <= 90) { setWastePercent(value); setResult(null) } }} className={input} /></label>
            </div>
            <button type="button" onClick={() => setResult(calculatePackages({ portions, unitsPerServing, unitsPerBox, wastePercent }))} className={`min-h-11 w-full rounded-lg bg-[#15543a] px-4 text-sm font-semibold text-white ${focus}`}>{t('calculate')}</button>
            {result !== null && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs text-[#496152]">{t('boxesRequired')}</p><strong className="mt-1 block text-2xl text-[#15543a]">{result}</strong><p className="mt-2 text-xs leading-relaxed">{t('calculation', { portions, units: unitsPerServing, box: unitsPerBox, waste: wastePercent })}</p></div>}
          </>
        ) : screen === 'dashboard' ? (
          <>
            <h4 className="text-base font-semibold">{t('dashboardTitle')}</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'weekly', value: '526', theme: 'border-emerald-200 bg-[#e3efe8] text-[#15543a]' },
                { key: 'average', value: '75', theme: 'border-amber-200 bg-[#faecd0] text-amber-900' },
                { key: 'preparations', value: '19', theme: 'border-blue-200 bg-[#e6ecf6] text-blue-900' },
                { key: 'today', value: String(result ?? 0), theme: 'border-emerald-200 bg-[#e3efe8] text-[#15543a]' },
              ].map((item) => <div key={item.key} className={`rounded-lg border p-3 ${item.theme}`}><p className="text-2xl font-bold">{item.value}</p><p className="mt-1 text-xs">{t(`metrics.${item.key}`)}</p></div>)}
            </div>
            <div className={`${card} p-4`}><h5 className="mb-4 text-center text-xs font-semibold">{t('weekTitle')}</h5><div aria-label={t('weekChart')} role="img" className="flex h-20 items-end gap-2">{weeklyHeights.map((height, index) => <span key={index} className={`flex-1 rounded-t bg-[#9cc0a8] ${height}`} />)}</div><div className="mt-2 flex gap-2">{[0, 1, 2, 3, 4, 5, 6].map((index) => <span key={index} className="flex-1 text-center text-[10px] text-[#496152]">{t(`days.${index}`)}</span>)}</div></div>
            <p className="text-xs leading-relaxed text-[#496152]">{t('dashboardNote')}</p>
          </>
        ) : (
          <>
            <h4 className="text-base font-semibold">{t('dietTitle')}</h4>
            <p className="text-xs leading-relaxed text-[#496152]">{t('dietCopy')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label htmlFor="food-diet"><span className="mb-1 block text-xs text-[#496152]">{t('preparation')}</span><select id="food-diet" value={diet} onChange={(event) => setDiet(event.target.value)} className={input}>{['vegetables', 'carrot', 'pumpkin'].map((key) => <option key={key} value={key}>{t(`diets.${key}`)}</option>)}</select></label>
              <label htmlFor="food-diet-portions"><span className="mb-1 block text-xs text-[#496152]">{t('portions')}</span><input id="food-diet-portions" type="number" min="1" max="100" value={dietPortions} onChange={(event) => { const value = Number(event.target.value); if (value >= 1 && value <= 100) setDietPortions(value) }} className={input} /></label>
            </div>
            <div role="status" className="rounded-xl bg-[#15543a] p-5 text-center text-white"><p className="text-xs">{t(`diets.${diet}`)}</p><p className="my-2 text-3xl font-bold">{quantity(dietPortions * 0.2)} kg</p><p className="text-xs">{t('dietFormula', { portions: dietPortions })}</p></div>
            <p className="text-xs leading-relaxed text-[#496152]">{t('note')}</p>
          </>
        )}
      </div>
    </div>
  )
}
