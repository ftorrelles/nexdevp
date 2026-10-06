import { readFileSync, existsSync } from 'node:fs'
import { createElement, Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it } from 'vitest'
import { getProjectIndex, getRealProjects, REAL_PROJECT_CATEGORIES, REAL_PROJECTS } from '@/content/realProjects'
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

  it('clamps native scroll progress including boundary and partial-card positions', () => {
    expect(getProjectIndex(-20, 680, 3)).toBe(0)
    expect(getProjectIndex(0, 680, 3)).toBe(0)
    expect(getProjectIndex(400, 680, 3)).toBe(1)
    expect(getProjectIndex(680, 680, 3)).toBe(1)
    expect(getProjectIndex(1360, 680, 3)).toBe(2)
    expect(getProjectIndex(9999, 680, 3)).toBe(2)
    expect(getProjectIndex(10, 0, 0)).toBe(0)
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

it('progressively enhances scroll without intercepting input or clipping long content', () => {
  const source = readFileSync('src/components/sections/RealProjectPortfolio.tsx', 'utf8')
  expect(source).toContain('min-width: 1024px')
  expect(source).toContain('min-height: 820px')
  expect(source).toContain('prefers-reduced-motion: no-preference')
  expect(source).toContain('ResizeObserver')
  expect(source).toContain('STAGE_HEIGHT - 64')
  expect(source).toContain('motion-reduce:static')
  expect(source).toContain("from 'next/image'")
  expect(source).not.toMatch(/preventDefault|onWheel|addEventListener\(['"]wheel|style=|<img|setInterval/)
})
