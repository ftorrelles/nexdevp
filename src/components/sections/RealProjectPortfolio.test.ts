import { readFileSync, existsSync } from 'node:fs'
import { createElement, Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it } from 'vitest'
import { getRealProjects, REAL_PROJECT_CATEGORIES, REAL_PROJECTS } from '@/content/realProjects'
import { RealProjectPortfolio } from './RealProjectPortfolio'
import { Portfolio } from './Portfolio'

describe('real project inventory', () => {
  it('preserves the approved nine projects and category order', () => {
    expect(REAL_PROJECT_CATEGORIES).toEqual(['projects', 'apps', 'websites'])
    expect(getRealProjects('projects').map(({ id }) => id)).toEqual(['sce', 'trayecto', 'vivir'])
    expect(getRealProjects('apps').map(({ id }) => id)).toEqual(['cil', 'speakpath', 'collab'])
    expect(getRealProjects('websites').map(({ id }) => id)).toEqual(['amarhte', 'perezRojas', 'biupoll'])
  })

  it('never exposes private URLs or substitutes private application screenshots', () => {
    const privateProjects = REAL_PROJECTS.filter(({ access }) => access === 'private')
    expect(privateProjects.map(({ id }) => id)).toEqual(['sce', 'collab'])
    for (const project of privateProjects) expect(project.url).toBeUndefined()
    expect(privateProjects[0].image).toBeUndefined()
    expect(privateProjects[1].image?.kind).toBe('cover')
    const vivir = REAL_PROJECTS.find(({ id }) => id === 'vivir')
    expect(vivir?.image?.src).toBe('/portfolio/vivir-chevere-redacted.png')
    expect(vivir?.image?.kind).toBe('redacted')
    expect(vivir?.linkKind).toBe('video')
    for (const project of REAL_PROJECTS) {
      if (project.image) expect(existsSync(`public${project.image.src}`)).toBe(true)
    }
  })

})

describe.each(['en', 'es'])('real project stories (%s)', (locale) => {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as typeof import('../../../messages/en.json')

  function render(children: ReturnType<typeof createElement>): string {
    const providerProps = { locale, messages, timeZone: 'UTC', children }
    return renderToStaticMarkup(createElement(NextIntlClientProvider, providerProps))
  }

  it.each(REAL_PROJECT_CATEGORIES)('renders localized %s stories and approved links', (category) => {
    const html = render(createElement(RealProjectPortfolio, { initialCategory: category }))
    expect(html.match(/aria-controls="real-project-list"/g)).toHaveLength(3)
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1)
    expect(html).toContain('data-layout="list"')
    expect(html).not.toContain('tabindex="0"')
    expect(html).toContain(messages.realPortfolio.headline)
    for (const project of getRealProjects(category)) {
      expect(html).toContain(`data-project="${project.id}"`)
      expect(html).toContain(messages.realPortfolio.items[project.id].name)
      if (project.access === 'public') expect(html).toContain(`href="${project.url}"`)
      if (project.image) expect(html).toContain(messages.realPortfolio.items[project.id].alt)
      const articleStart = html.indexOf(`data-project="${project.id}"`)
      const articleEnd = html.indexOf('</article>', articleStart)
      const article = html.slice(articleStart, articleEnd)
      expect(article.indexOf('</figure>')).toBeLessThan(article.indexOf('<h3'))
      if (project.image) expect(article).toContain('object-contain')
    }
    expect(html).not.toMatch(/Lucy|Speedy2Go|Francisco|Co-Authored/)
  })

  it('keeps generic demos and real-project navigation separate with unique anchors', () => {
    const html = render(createElement(Fragment, null, createElement(Portfolio), createElement(RealProjectPortfolio)))
    for (const anchor of ['casos', 'portfolio', 'proyectos']) {
      expect(html.match(new RegExp(`id="${anchor}"`, 'g'))).toHaveLength(1)
    }
    expect(html).toContain(messages.useCases.headline)
    expect(html).toContain(messages.realPortfolio.headline)
    expect(html).toContain(messages.realPortfolio.captions.redacted)
  })
})

it('uses one-row filters and document-flow image-led stories without nested scrolling or motion', () => {
  const source = readFileSync('src/components/sections/RealProjectPortfolio.tsx', 'utf8')
  const filters = source.slice(source.indexOf('<div role="group"'), source.indexOf('id="real-project-list"'))
  expect(filters).toContain('min-h-11')
  expect(filters).not.toContain('flex-wrap')
  expect(source).toContain('sm:aspect-[16/10]')
  expect(source).toContain('object-contain')
  expect(source).toContain("from 'next/image'")
  expect(source).not.toMatch(/680|overflow-|sticky|ResizeObserver|scrollTo|onScroll|onWheel|preventDefault|style=|<img|setInterval/)
})
