'use client'

import { useState, type ReactElement } from 'react'
import { useTranslations } from 'next-intl'
import { summarizeVisits, type Availability, type VisitRecord } from './useCaseSimulation'

const control = 'min-h-11 rounded-lg border border-stone-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900'
const choices = ['on', 'off', 'out'] as const
const pinPositions = ['left-[22%] top-[22%]', 'left-[56%] top-[31%]', 'left-[72%] top-[60%]', 'left-[31%] top-[73%]']

export function MarketResearchPreview(): ReactElement {
  const t = useTranslations('useCases.preview.research')
  const [tab, setTab] = useState('visit')
  const [store, setStore] = useState(0)
  const [availability, setAvailability] = useState<Availability>('on')
  const [records, setRecords] = useState<VisitRecord[]>(Array.from({ length: 4 }, () => ({ saved: false, availability: 'on' })))
  const [evidence, setEvidence] = useState(false)
  const [saved, setSaved] = useState(false)
  const summary = summarizeVisits(records)

  function selectStore(index: number): void {
    setStore(index)
    setAvailability(records[index].availability)
    setEvidence(false)
    setSaved(false)
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-stone-300 bg-stone-100 text-stone-950 shadow-xl">
      <div className="border-b border-stone-300 bg-stone-900 px-4 py-3 text-white"><strong className="text-sm">{t('app')}</strong></div>
      <div role="group" aria-label={t('screens')} className="flex flex-wrap gap-2 border-b border-stone-300 p-3">
        {['visit', 'map', 'metrics'].map((key) => <button key={key} type="button" onClick={() => setTab(key)} aria-pressed={tab === key} className={`${control} ${tab === key ? 'border-lime-300 bg-lime-300 font-semibold' : 'bg-white'}`}>{t(`tabs.${key}`)}</button>)}
      </div>
      <div className="min-h-[340px] space-y-4 p-4 sm:p-6">
        <h4 className="text-2xl font-semibold">{t(`titles.${tab}`)}</h4>
        {tab === 'visit' ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="rounded-xl border border-stone-200 bg-white p-4"><span className="mb-3 block font-semibold"><span className="mr-2 rounded bg-lime-300 px-2 py-1 text-xs">01</span>{t('store')}</span><select value={store} onChange={(event) => selectStore(Number(event.target.value))} className={`${control} w-full bg-white`}>{records.map((_, index) => <option key={index} value={index}>{t('storeName', { number: index + 1 })}</option>)}</select></label>
              <div className="rounded-xl border border-stone-200 bg-white p-4"><p className="mb-3 font-semibold"><span className="mr-2 rounded bg-lime-300 px-2 py-1 text-xs">02</span>{t('campaign')}</p><p className="rounded-lg bg-stone-100 p-3 text-sm">{t('campaignName')}</p></div>
            </div>
            <div className="overflow-hidden rounded-xl border border-pink-500 bg-white">
              <p className="bg-pink-600 px-4 py-2 text-sm font-semibold text-white">{t('product')}</p>
              <div className="space-y-4 p-4">
                <fieldset><legend className="mb-2 text-sm font-semibold">{t('availability')}</legend><div className="flex flex-wrap gap-2">{choices.map((key) => <button key={key} type="button" aria-pressed={availability === key} onClick={() => { setAvailability(key); setSaved(false) }} className={`${control} ${availability === key ? 'border-stone-950 bg-lime-300' : 'bg-white'}`}>{t(`choices.${key}`)}</button>)}</div></fieldset>
                <div><p className="mb-2 text-sm font-semibold">{t('evidence')}</p><button type="button" aria-pressed={evidence} onClick={() => setEvidence((value) => !value)} className={`${control} border-dashed bg-stone-50`}>{t(evidence ? 'removeEvidence' : 'addEvidence')}</button>{evidence && <div className="mt-3 flex items-end gap-2 rounded-lg bg-pink-50 p-3"><span aria-hidden="true" className="h-12 w-8 rounded bg-pink-400" /><span aria-hidden="true" className="h-14 w-8 rounded bg-lime-400" /><p className="text-xs">{t('evidenceNote')}</p></div>}</div>
              </div>
            </div>
            <button type="button" onClick={() => { setRecords((previous) => previous.map((record, index) => index === store ? { saved: true, availability } : record)); setSaved(true) }} className={`${control} border-stone-950 bg-stone-950 font-semibold text-lime-300`}>{t('save')}</button>
            <p role="status" className="text-sm">{t(saved ? 'saved' : 'local')}</p>
          </>
        ) : tab === 'map' ? (
          <>
            <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">{records.map((record, index) => <button key={index} type="button" aria-pressed={store === index} onClick={() => selectStore(index)} className={`${control} text-left ${store === index ? 'bg-lime-300' : 'bg-white'}`}><strong className="block">{t('storeName', { number: index + 1 })}</strong><span className="text-xs">{t(record.saved ? 'recorded' : 'pending')}</span></button>)}</div>
              <div aria-label={t('mapLabel')} data-illustrative-city="" className="relative min-h-[320px] overflow-hidden rounded-xl border border-slate-300 bg-[#e8edf1]">
                <svg viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full">
                  <path d="M256 -10C228 34 279 64 259 108S231 167 252 211 257 257 278 311H310V-10Z" className="fill-[#c6dce9]" />
                  <path d="M8 11H48V46H8ZM85 12H132V37H85ZM149 11H182V54H149ZM195 9H223V39H195ZM14 91H46V125H14ZM83 91H118V122H83ZM12 159H57V193H12ZM123 174H149V202H123ZM179 123H200V149H179ZM182 215H223V244H182ZM15 260H52V292H15ZM127 263H162V290H127Z" className="fill-[#d8e0e5] stroke-[#cbd5dc]" strokeWidth="1" />
                  <path d="M84 155H121V185H84ZM13 207H46V234H13ZM196 40H227V74H196Z" className="fill-[#cfdfcd] stroke-[#bed2bb]" strokeWidth="1" />
                  <path d="M0 66H172L195 89H258M0 137H257M0 219H264M66 0V300M168 0V93H216V300M105 219V300M15 35L38 66M93 137V219M0 266H266" fill="none" className="stroke-[#cdd7de]" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M0 66H172L195 89H258M0 137H257M0 219H264M66 0V300M168 0V93H216V300M105 219V300M15 35L38 66M93 137V219M0 266H266" fill="none" className="stroke-white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M-10 112C75 107 110 105 156 155S210 208 310 186" fill="none" className="stroke-[#cfdae2]" strokeWidth="15" />
                  <path d="M-10 112C75 107 110 105 156 155S210 208 310 186" fill="none" className="stroke-[#fbfdff]" strokeWidth="10" />
                  <path d="M66 66H168V93H216V180H93V219" fill="none" className="stroke-white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M66 66H168V93H216V180H93V219" fill="none" className="stroke-[#5276db]" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M216 180H93V219" fill="none" className="stroke-emerald-500" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="absolute left-[7%] top-[3%] rounded bg-white/80 px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-600">{t('districtNorth')}</p>
                <p className="absolute bottom-[5%] left-[45%] rounded bg-white/80 px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-600">{t('districtSouth')}</p>
                <p className="absolute left-[27%] top-[53%] text-[9px] font-semibold text-emerald-900">{t('park')}</p>
                {records.map((record, index) => <button key={index} type="button" aria-label={t('selectStore', { number: index + 1 })} aria-pressed={store === index} onClick={() => selectStore(index)} className={`absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white font-bold shadow-md ${store === index ? 'bg-blue-700 text-white ring-4 ring-blue-200/80' : record.saved ? 'bg-emerald-700 text-white' : 'bg-stone-900 text-white'} ${pinPositions[index]} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900`}>{index + 1}</button>)}
              </div>
            </div>
            <p className="text-xs leading-relaxed">{t('mapNote')}</p><button type="button" onClick={() => setTab('visit')} className={`${control} bg-white`}>{t('openVisit', { number: store + 1 })}</button>
          </>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">{[['completed', `${summary.completed} / 4`], ['pending', String(summary.pending)], ['onShelf', String(summary.onShelf)]].map(([key, value]) => <div key={key} className="rounded-xl border border-stone-200 bg-white p-4"><p className="text-3xl font-semibold">{value}</p><p className="mt-2 text-sm">{t(key)}</p></div>)}</div>
            <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">{choices.map((key) => { const count = records.filter((record) => record.saved && record.availability === key).length; return <div key={key}><p className="mb-2 flex justify-between gap-2 text-sm"><span>{t(`choices.${key}`)}</span><strong>{count} / 4</strong></p><progress value={count} max="4" aria-label={t(`choices.${key}`)} className="h-3 w-full accent-pink-600" /></div> })}</div>
            <p className="text-xs leading-relaxed">{t('metricsNote')}</p>
          </>
        )}
      </div>
    </div>
  )
}
