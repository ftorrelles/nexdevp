import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createTranslator, NextIntlClientProvider } from 'next-intl'
import { describe, expect, it, vi } from 'vitest'
import { Hero } from './Hero'

const { getTranslationsMock } = vi.hoisted(() => ({ getTranslationsMock: vi.fn() }))
vi.mock('next-intl/server', () => ({ getTranslations: getTranslationsMock }))

type Messages = typeof import('../../../messages/en.json')

describe.each(['en', 'es'])('solution-first hero (%s)', (locale) => {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as Messages
  const t = createTranslator({ locale, messages, namespace: 'hero.solutionFirst' })

  async function renderHero(): Promise<string> {
    getTranslationsMock.mockResolvedValue(t)
    const providerProps = { locale, messages, timeZone: 'UTC', children: await Hero() }
    return renderToStaticMarkup(createElement(NextIntlClientProvider, providerProps))
  }

  it('renders one localized heading with real contact and cases anchors', async () => {
    const html = await renderHero()
    expect(html.match(/<h1\b/g)).toHaveLength(1)
    expect(html).toContain(t('headline'))
    expect(html).toContain(t('headlineAccent'))
    expect(html).toContain('href="#contacto"')
    expect(html).toContain('href="#casos"')
    expect(html).not.toContain('nxh-')
    expect(html).not.toContain('<form')
    expect(html).toContain('aria-hidden="true" class="group pointer-events-none absolute')
    expect(html).toContain('<canvas')
    expect(html).toContain('width="30" height="30" patternUnits="userSpaceOnUse"')
    expect(html).toContain('<circle cx="15" cy="15" r="1" class="fill-nex-ink/10"')
    expect(html).not.toContain('<path')
  })

  it('exposes three pressed-state controls and a polite initial explanation', async () => {
    const html = await renderHero()
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1)
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(2)
    expect(html.match(/aria-controls="hero-goal-explanation"/g)).toHaveLength(3)
    expect(html).toContain('role="group" aria-labelledby="hero-goal-label"')
    expect(html).toContain('role="status" aria-live="polite" aria-atomic="true"')
    for (const goal of ['time', 'control', 'idea'] as const) {
      expect(html).toContain(t(`goals.${goal}.label`))
      expect(t(`goals.${goal}.problem`)).not.toContain('hero.solutionFirst')
      expect(t(`goals.${goal}.possibility`)).not.toContain('hero.solutionFirst')
    }
    expect(html).toContain(t('goals.time.problem'))
    expect(html).toContain(t('goals.time.possibility'))
    expect(html).toContain('focus-visible:outline-2')
    expect(html).not.toContain('style=')
  })

  it('retains every original hero translation for rollback and HeroCard reuse', () => {
    const original = JSON.parse(readFileSync(`docs/reference/hero-original-2026-10-05/hero.${locale}.json`, 'utf8'))
    expect(messages.hero).toMatchObject(original)
  })
})
