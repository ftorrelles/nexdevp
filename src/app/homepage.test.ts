import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('homepage section composition', () => {
  const page = readFileSync('src/app/[locale]/page.tsx', 'utf8')

  it('removes methodology without leaving an empty section wrapper', () => {
    expect(page).not.toContain('Methodology')
    expect(page).not.toMatch(/<OffscreenSection[^>]*>\s*<\/OffscreenSection>/)
    expect(existsSync('src/components/sections/Methodology.tsx')).toBe(false)
  })

  it('preserves the hero and the remaining homepage sections in order', () => {
    const sections = [...page.matchAll(/<(Hero|BeforeAfter|Pillars|DemoSection|CasosExito|Portfolio|Stats|CtaFinal|JoinUs|Footer)\b/g)]
      .map((match) => match[1])
    expect(sections).toEqual([
      'Hero', 'BeforeAfter', 'Pillars', 'DemoSection', 'CasosExito',
      'Portfolio', 'Stats', 'CtaFinal', 'JoinUs', 'Footer',
    ])
  })

  it.each(['en', 'es'])('removes unused methodology copy in %s', (locale) => {
    const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'))
    expect(messages).not.toHaveProperty('methodology')
    expect(messages).not.toHaveProperty('sections.methodology')
    expect(messages).toHaveProperty('hero.solutionFirst')
  })
})
