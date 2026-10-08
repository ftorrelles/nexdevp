import { readFileSync, existsSync } from 'node:fs'
import { createElement, Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it } from 'vitest'
import { REAL_PROJECTS, REAL_PROJECT_CATEGORIES } from '@/content/realProjects'
import { RealProjectPortfolio } from './RealProjectPortfolio'
import { Portfolio } from './Portfolio'
import { createRealProjectSelection, realProjectSelectionReducer } from './realProjectSelection'

describe('real project inventory', () => {
  it('preserves the approved nine projects and category order', () => {
    expect(REAL_PROJECT_CATEGORIES).toEqual(['projects', 'apps', 'websites'])
    expect(REAL_PROJECTS.map(({ id }) => id)).toEqual(['sce', 'trayecto', 'vivir', 'cil', 'speakpath', 'collab', 'amarhte', 'perezRojas', 'biupoll'])
  })

  it('keeps private URLs absent and uses only approved private imagery and demo identifiers', () => {
    const privateProjects = REAL_PROJECTS.filter(({ access }) => access === 'private')
    expect(privateProjects.map(({ id }) => id)).toEqual(['sce', 'collab'])
    for (const project of privateProjects) expect(project.url).toBeUndefined()
    expect(privateProjects[0].image?.src).toBe('/portfolio/sce-dashboard.png')
    expect(privateProjects[0].image?.kind).toBe('screenshot')
    expect(privateProjects[1].image?.kind).toBe('cover')
    const vivir = REAL_PROJECTS.find(({ id }) => id === 'vivir')
    expect(vivir?.image?.src).toBe('/portfolio/vivir-chevere-demo.png')
    expect(vivir?.image?.kind).toBe('demo')
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

  it.each(REAL_PROJECT_CATEGORIES)('renders one localized active %s story with reachable controls', (category) => {
    const html = render(createElement(RealProjectPortfolio, { initialCategory: category }))
    expect(html.match(/aria-controls="real-project-panel"/g)).toHaveLength(8)
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(2)
    expect(html.match(/<article\b/g)).toHaveLength(1)
    expect(html).toContain('data-layout="showcase"')
    expect(html).toContain(messages.realPortfolio.headline)
    expect(html).toContain(messages.realPortfolio.filterLabel)
    expect(html).toContain(`aria-label="${messages.realPortfolio.previous}"`)
    expect(html).toContain(`aria-label="${messages.realPortfolio.next}"`)
    expect(html).toContain('role="status" aria-live="polite" aria-atomic="true"')
    for (const item of REAL_PROJECT_CATEGORIES) expect(html).toContain(messages.realPortfolio.categories[item])
    for (const item of REAL_PROJECTS.filter((project) => project.category === category)) {
      expect(html).toContain(messages.realPortfolio.items[item.id].name)
    }
    const active = REAL_PROJECTS.find((project) => project.category === category)!
    expect(html).toContain(`data-project="${active.id}"`)
    expect(html).toContain(messages.realPortfolio.items[active.id].challenge)
    expect(html).toContain(messages.realPortfolio.items[active.id].solution)
    if (active.access === 'public') {
      expect(html).toContain(`href="${active.url}"`)
      expect(html).toContain('rel="noopener noreferrer"')
    } else {
      expect(html).toContain(messages.realPortfolio.privateAccess)
      expect(html).not.toContain('target="_blank"')
    }
    if (active.image) {
      expect(html).toContain(messages.realPortfolio.items[active.id].alt)
      expect(html).toContain('object-contain')
      expect(html).not.toContain('object-cover')
      expect(html).not.toContain('real-project-viewer')
      expect(html).not.toContain('aria-haspopup="dialog"')
    }
    for (const project of REAL_PROJECTS) {
      if (project.id !== active.id) expect(html).not.toContain(`data-project="${project.id}"`)
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
    expect(html).toContain(messages.realPortfolio.captions.screenshot)
  })

  it('flows without a progress bar or a pause/play control', () => {
    const html = render(createElement(RealProjectPortfolio, { initialCategory: 'projects' }))
    expect(html).not.toContain('portfolio-progress')
    expect(html).not.toContain('Ⅱ')
    expect(html).not.toContain('▶')
    expect(html).not.toContain('←')
    expect(html).not.toContain('→')
    expect(html).toContain('<svg')
    expect(html).not.toContain(`aria-label="${messages.realPortfolio.pause}"`)
    expect(html).not.toContain(`aria-label="${messages.realPortfolio.play}"`)
  })
})

describe('manual project selection', () => {
  it('jumps to a project by flat index and clamps non-finite input', () => {
    let state = createRealProjectSelection()
    state = realProjectSelectionReducer(state, { type: 'project', index: 5 })
    expect(REAL_PROJECTS[state.index].id).toBe('collab')
    state = realProjectSelectionReducer(state, { type: 'project', index: 99 })
    expect(state.index).toBe(8)
    state = realProjectSelectionReducer(state, { type: 'project', index: -4 })
    expect(state.index).toBe(0)
    const clamped = realProjectSelectionReducer({ index: 3 }, { type: 'project', index: Number.NaN })
    expect(clamped).toEqual({ index: 3 })
  })

  it('cycles through all nine projects across categories on advance', () => {
    let state = createRealProjectSelection()
    const visited: string[] = []
    for (let step = 0; step < 9; step++) {
      visited.push(REAL_PROJECTS[state.index].id)
      state = realProjectSelectionReducer(state, { type: 'advance' })
    }
    expect(visited).toEqual(REAL_PROJECTS.map(({ id }) => id))
    expect(state.index).toBe(0)
  })

  it('jumps to the first project of a category', () => {
    let state = createRealProjectSelection()
    state = realProjectSelectionReducer(state, { type: 'category', category: 'apps' })
    expect(REAL_PROJECTS[state.index].id).toBe('cil')
    state = realProjectSelectionReducer(state, { type: 'category', category: 'websites' })
    expect(REAL_PROJECTS[state.index].id).toBe('amarhte')
  })

  it('wraps previous and next across the full list', () => {
    let state = createRealProjectSelection()
    state = realProjectSelectionReducer(state, { type: 'step', direction: -1 })
    expect(state.index).toBe(8)
    state = realProjectSelectionReducer(state, { type: 'step', direction: 1 })
    expect(state.index).toBe(0)
    state = realProjectSelectionReducer(state, { type: 'step', direction: 1 })
    expect(state.index).toBe(1)
  })
})

it('uses a compact split card with controls outside and no scroll interception', () => {
  const source = readFileSync('src/components/sections/RealProjectPortfolio.tsx', 'utf8')
  const filters = source.slice(source.indexOf('<div role="group"'), source.indexOf('id="real-project-panel"'))
  expect(filters).toContain('min-h-11')
  expect(filters).toContain("t('filterLabel')")
  expect(filters).toContain("t('next')")
  expect(source).toContain('lg:grid-cols-2')
  expect(source).toContain('h-[200px]')
  expect(source).toContain('lg:h-[280px]')
  expect(source).toContain('lg:h-[360px]')
  expect(source).toContain('aspect-[9/20]')
  expect(source).toContain('from-nex-green/20')
  expect(source).toContain('object-contain')
  expect(source).toContain("from 'next/image'")
  expect(source).not.toMatch(/aspect-square|aspect-\[16\/10\]|overflow-y|sticky|ResizeObserver|scrollTo|onScroll|onWheel|preventDefault|style=|<img|setInterval|setTimeout/)
})

it('starts playback when the section is in view and pauses on focus, hidden tab or dialog', () => {
  const source = readFileSync('src/components/sections/RealProjectPortfolio.tsx', 'utf8')
  expect(source).toContain('IntersectionObserver')
  expect(source).toContain('onFocusCapture={() => setFocused(true)}')
  expect(source).toContain('event.currentTarget.contains(event.relatedTarget)')
  expect(source).toContain("document.addEventListener('visibilitychange', updateEnvironment)")
  expect(source).toContain("document.removeEventListener('visibilitychange', updateEnvironment)")
  expect(source).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')")
  expect(source).toContain("aria-live={playing ? 'off' : 'polite'}")
  expect(source).toContain('[playing, selection]')
})

it('shows the project image without an enlargement dialog', () => {
  const source = readFileSync('src/components/sections/RealProjectPortfolio.tsx', 'utf8')
  expect(source).not.toContain('<dialog')
  expect(source).not.toContain('showModal')
  expect(source).not.toContain('aria-haspopup')
  expect(source).not.toContain('cursor-zoom-in')
})
