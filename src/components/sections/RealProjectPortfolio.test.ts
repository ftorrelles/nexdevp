import { readFileSync, existsSync } from 'node:fs'
import { createElement, Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it } from 'vitest'
import { getRealProjects, REAL_PROJECT_CATEGORIES, REAL_PROJECTS } from '@/content/realProjects'
import { RealProjectPortfolio } from './RealProjectPortfolio'
import { Portfolio } from './Portfolio'
import { createRealProjectSelection, realProjectSelectionReducer } from './realProjectSelection'

describe('real project inventory', () => {
  it('preserves the approved nine projects and category order', () => {
    expect(REAL_PROJECT_CATEGORIES).toEqual(['projects', 'apps', 'websites'])
    expect(getRealProjects('projects').map(({ id }) => id)).toEqual(['sce', 'trayecto', 'vivir'])
    expect(getRealProjects('apps').map(({ id }) => id)).toEqual(['cil', 'speakpath', 'collab'])
    expect(getRealProjects('websites').map(({ id }) => id)).toEqual(['amarhte', 'perezRojas', 'biupoll'])
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
    expect(html.match(/aria-controls="real-project-panel"/g)).toHaveLength(9)
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(2)
    expect(html.match(/<article\b/g)).toHaveLength(1)
    expect(html).toContain('data-layout="showcase"')
    expect(html).toContain(messages.realPortfolio.headline)
    expect(html).toContain(messages.realPortfolio.projectSelector)
    expect(html).toContain(messages.realPortfolio.pause)
    expect(html).toContain(messages.realPortfolio.playbackHint)
    expect(html).toContain(`aria-label="${messages.realPortfolio.previous}"`)
    expect(html).toContain(`aria-label="${messages.realPortfolio.next}"`)
    expect(html).toContain('role="status" aria-live="polite" aria-atomic="true"')
    for (const item of REAL_PROJECT_CATEGORIES) expect(html).toContain(messages.realPortfolio.categories[item])
    const active = getRealProjects(category)[0]
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
      expect(html).toContain('aria-haspopup="dialog"')
      expect(html).toContain('aria-controls="real-project-viewer"')
      expect(html).toContain('id="real-project-viewer" aria-labelledby="real-project-viewer-heading"')
      expect(html).toContain(messages.realPortfolio.closeImage)
      expect(html).toContain(messages.realPortfolio.imageHint)
      expect(html).not.toContain('<dialog open')
    }
    for (const project of getRealProjects(category)) {
      expect(html).toContain(messages.realPortfolio.items[project.id].name)
      if (project.id !== active.id) {
        expect(html).not.toContain(`data-project="${project.id}"`)
        if (project.access === 'public') expect(html).not.toContain(`href="${project.url}"`)
      }
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

  it('renders a segmented progress bar with icon controls instead of text tabs and a glyph pause pill', () => {
    const html = render(createElement(RealProjectPortfolio, { initialCategory: 'projects' }))
    expect(html).not.toContain('Ⅱ')
    expect(html).not.toContain('▶')
    expect(html).not.toContain('←')
    expect(html).not.toContain('→')
    expect(html).toContain('<svg')
    expect(html).toContain('portfolio-progress')
    expect(html).toContain('portfolio-progress-paused')
    expect(html).toContain(`aria-label="${messages.realPortfolio.pause}"`)
    expect(html).toContain(messages.realPortfolio.projectSelector)
  })

  it('frames landscape shots in a browser chrome, glows the stage per category and zooms on hover', () => {
    const html = render(createElement(RealProjectPortfolio, { initialCategory: 'websites' }))
    expect(html).toContain('blur-2xl')
    expect(html).toContain('bg-nex-green/20')
    expect(html).toContain('rounded-t-[inherit]')
    expect(html).toContain('motion-safe:group-hover:scale-[1.03]')
  })

  it('elevates project tags as big green highlight stats instead of outline chips', () => {
    const html = render(createElement(RealProjectPortfolio, { initialCategory: 'projects' }))
    expect(html).toContain('font-jost text-lg font-bold text-nex-green')
    expect(html).not.toContain('rounded border border-nex-white/20 px-2 py-1')
  })
})

describe('manual project selection', () => {
  it('remembers each category independently when switching Apps and Websites', () => {
    let state = createRealProjectSelection('apps')
    state = realProjectSelectionReducer(state, { type: 'project', index: 2 })
    expect(getRealProjects(state.category)[state.indices.apps].id).toBe('collab')
    state = realProjectSelectionReducer(state, { type: 'category', category: 'websites' })
    state = realProjectSelectionReducer(state, { type: 'step', direction: 1 })
    state = realProjectSelectionReducer(state, { type: 'category', category: 'apps' })
    expect(state.indices.apps).toBe(2)
    state = realProjectSelectionReducer(state, { type: 'category', category: 'websites' })
    expect(getRealProjects(state.category)[state.indices.websites].id).toBe('perezRojas')
    expect(state.indices.projects).toBe(0)
  })

  it.each(REAL_PROJECT_CATEGORIES)('bounds previous, next and direct selections in %s', (category) => {
    let state = createRealProjectSelection(category)
    expect(realProjectSelectionReducer(state, { type: 'step', direction: -1 }).indices[category]).toBe(0)
    for (let index = 0; index < getRealProjects(category).length; index++) {
      state = realProjectSelectionReducer(state, { type: 'project', index })
      expect(getRealProjects(category)[state.indices[category]]).toEqual(getRealProjects(category)[index])
    }
    expect(realProjectSelectionReducer(state, { type: 'step', direction: 1 }).indices[category]).toBe(2)
    expect(realProjectSelectionReducer(state, { type: 'project', index: 999 }).indices[category]).toBe(2)
    expect(realProjectSelectionReducer(state, { type: 'project', index: -20 }).indices[category]).toBe(0)
    expect(realProjectSelectionReducer(state, { type: 'project', index: NaN })).toBe(state)
    expect(realProjectSelectionReducer(state, { type: 'project', index: Infinity })).toBe(state)
    expect(realProjectSelectionReducer(state, { type: 'project', index: 1.9 }).indices[category]).toBe(1)
  })
})

it('uses a compact split card with controls outside and no scroll interception', () => {
  const source = readFileSync('src/components/sections/RealProjectPortfolio.tsx', 'utf8')
  const filters = source.slice(source.indexOf('<div role="group"'), source.indexOf('id="real-project-panel"'))
  expect(filters).toContain('min-h-11')
  expect(filters).toContain("t('projectSelector')")
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

it('pauses automatic playback during interaction and makes live announcements manual-only', () => {
  const source = readFileSync('src/components/sections/RealProjectPortfolio.tsx', 'utf8')
  expect(source).toContain('onPointerEnter={() => setHovered(true)}')
  expect(source).toContain('onPointerLeave={() => setHovered(false)}')
  expect(source).toContain('onFocusCapture={() => setFocused(true)}')
  expect(source).toContain('event.currentTarget.contains(event.relatedTarget)')
  expect(source).toContain("document.addEventListener('visibilitychange', updateEnvironment)")
  expect(source).toContain("document.removeEventListener('visibilitychange', updateEnvironment)")
  expect(source).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')")
  expect(source).toContain('if (media.matches) setUserPaused(true)')
  expect(source).toContain('onClose={() => setViewerOpen(false)}')
  expect(source).toContain("aria-live={playing ? 'off' : 'polite'}")
  expect(source).toContain('[playing, selection]')
})

it('uses the native modal dialog for focus trapping, Escape dismissal and explicit close/backdrop actions', () => {
  const source = readFileSync('src/components/sections/RealProjectPortfolio.tsx', 'utf8')
  expect(source).toContain('useRef<HTMLDialogElement>(null)')
  expect(source).toContain('imageViewer.current?.showModal()')
  expect(source).toContain('imageViewer.current?.close()')
  expect(source).toContain('event.target === event.currentTarget')
  expect(source).toContain('backdrop:bg-black/85')
  expect(source).toContain('max-h-[72svh]')
  expect(source).not.toMatch(/onKeyDown|preventDefault|document\.body\.style/)
})

it('replaces text tabs and the pause pill with a segmented bar and CSS keyframe transition', () => {
  const source = readFileSync('src/components/sections/RealProjectPortfolio.tsx', 'utf8')
  expect(source).toContain("t('segmentLabel'")
  expect(source).toContain('portfolio-progress')
  expect(source).toContain('animation-play-state')
  expect(source).toContain('portfolio-enter')
  expect(source).toContain('prefers-reduced-motion')
  expect(source).toContain("reducedMotion ? '' : 'portfolio-enter'")
  expect(source).toContain('key={project.id}')
})
