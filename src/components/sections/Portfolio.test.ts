import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it } from 'vitest'
import { Portfolio } from './Portfolio'
import { MarketResearchPreview } from './MarketResearchPreview'
import { UseCasePreview } from './UseCasePreview'
import { USE_CASE_IDS } from './useCaseSimulation'

describe.each(['en', 'es'])('unified use cases (%s)', (locale) => {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as typeof import('../../../messages/en.json')

  function render(component: ReturnType<typeof createElement>): string {
    const providerProps = { locale, messages, timeZone: 'UTC', children: component }
    return renderToStaticMarkup(createElement(NextIntlClientProvider, providerProps))
  }

  it('renders four capabilities and explicitly offers solutions beyond these examples', () => {
    const html = render(createElement(Portfolio))
    for (const id of USE_CASE_IDS) expect(html).toContain(messages.useCases.cases[id].label)
    expect(html).toContain(messages.useCases.scope)
    expect(html).toContain(messages.useCases.headline)
    expect(html).toContain(messages.useCases.preview.demo)
    expect(html).toContain('href="#contacto"')
    expect(html.match(/aria-controls="use-case-story"/g)).toHaveLength(4)
    expect(html.match(/id="casos"/g)).toHaveLength(1)
    expect(html).not.toMatch(/id="(?:portfolio|proyectos)"/)
    expect(html).not.toContain('style=')
    expect(html).not.toContain('grid-cols-2 gap-3 lg:grid-cols-4')
    expect(html).not.toContain('More seeing it work')
    expect(html).not.toContain('Más verlo funcionar')
    expect(html).not.toMatch(/Collab|Lucy|Speedy2Go|Voom|Torrelles|SCE|CocinerHosp|SpeakPath/)
  })

  it.each(['construction', 'education', 'food'] as const)('renders readable anonymous %s screens', (caseId) => {
    const html = render(createElement(UseCasePreview, { caseId }))
    expect(html).toContain(messages.useCases.preview[caseId].app)
    expect(html).toContain(`data-product="${caseId}"`)
    expect(html).not.toContain('style=')
    expect(html).not.toMatch(/<iframe|<img|Francisco|SCE|SpeakPath|CocinerHosp/)
  })

  it('restores product-specific profitability, learning tiles and kitchen controls', () => {
    const construction = render(createElement(UseCasePreview, { caseId: 'construction' }))
    expect(construction).toContain('bg-[#090c0b]')
    expect(construction).toContain('bg-red-400')
    expect(construction).toContain(messages.useCases.preview.construction.titles.profit)
    expect(construction).toContain(messages.useCases.preview.construction.breakdownLabel)
    expect(construction).toContain('<rect x="88" width="12"')
    const education = render(createElement(UseCasePreview, { caseId: 'education' }))
    expect(education).toContain(messages.useCases.preview.education.greeting)
    expect(education).toContain(messages.useCases.preview.education.myCourses)
    expect(education).toContain(messages.useCases.preview.education.myLessons)
    expect(education).toContain('<progress')
    const food = render(createElement(UseCasePreview, { caseId: 'food' }))
    expect(food).toContain(messages.useCases.preview.food.patients)
    expect(food).toContain('id="food-waste"')
    expect(food).toContain('id="food-serving"')
    expect(food).toContain(messages.useCases.preview.food.quickSelect)
    expect(food).toContain(messages.useCases.preview.food.calculate)
  })

  it('uses reference-inspired research controls without client identities or real uploads', () => {
    const html = render(createElement(MarketResearchPreview))
    expect(html).toContain(messages.useCases.preview.research.titles.visit)
    for (const label of Object.values(messages.useCases.preview.research.tabs)) expect(html).toContain(label)
    expect(html).toContain(messages.useCases.preview.research.local)
    expect(html).not.toMatch(/Lucy|Speedy2Go|Voom|Torrelles|type="file"|<iframe|style=/)
  })
})
