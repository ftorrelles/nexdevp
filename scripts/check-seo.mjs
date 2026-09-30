#!/usr/bin/env node
// Black-box SEO check against a running server.
//
//   npm run check:seo -- [baseUrl]      (default http://localhost:3100)
//
// Sitemap URLs are on the canonical host; each one is fetched from the base
// URL under test. Exits non-zero when any check fails.

const CANONICAL_ORIGIN = 'https://www.nexdevp.com'
const BASE = (process.argv[2] ?? 'http://localhost:3100').replace(/\/+$/, '')

const TITLE_MAX = 60
const DESCRIPTION_MIN = 140
const DESCRIPTION_MAX = 160

const EXPECTED_DISALLOWS = [
  '/admin',
  '/api',
  '/auth',
  ...['es', 'en'].flatMap((locale) =>
    ['proyecto', 'careers/login', 'careers/registro', 'careers/portal'].map(
      (path) => `/${locale}/${path}`,
    ),
  ),
]
const PRIVATE_PAGES = ['/admin/login', '/es/careers/login']
const UNKNOWN_PATHS = ['/does-not-exist.txt', '/favicon.ico', '/es/does-not-exist']
const CONTACT_PREFIXES = ['https://wa.me/', 'https://cal.eu/']

let failures = 0

function report(ok, name, detail = '') {
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  ${detail}` : ''}`)
}

function skip(name, detail) {
  console.log(`SKIP  ${name}  ${detail}`)
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    redirect: 'manual',
    signal: AbortSignal.timeout(30_000),
  })
  return { status: res.status, headers: res.headers, body: await res.text() }
}

function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function parseAttributes(tag) {
  const attrs = {}
  for (const match of tag.matchAll(/([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    attrs[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? '')
  }
  return attrs
}

function tagsOf(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => parseAttributes(m[0]))
}

function inspectPage(html) {
  const metas = tagsOf(html, 'meta')
  const links = tagsOf(html, 'link')
  const meta = (key, value) =>
    metas.filter((m) => (m.name ?? m.property ?? '').toLowerCase() === key && value(m))
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  return {
    title: title === undefined ? null : decodeEntities(title.trim()),
    description: meta('description', () => true)[0]?.content ?? null,
    robots: meta('robots', () => true).map((m) => m.content ?? ''),
    ogImage: meta('og:image', () => true)[0]?.content ?? null,
    canonicals: links.filter((l) => l.rel === 'canonical').map((l) => l.href),
    alternates: links
      .filter((l) => l.rel === 'alternate' && l.hreflang)
      .map((l) => ({ lang: l.hreflang, href: l.href })),
    h1Count: (html.match(/<h1[\s>]/gi) ?? []).length,
    jsonLd: [
      ...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
    ].map((m) => m[1]),
  }
}

function hasNoindex(res, page) {
  const header = res.headers.get('x-robots-tag') ?? ''
  return /noindex/i.test(header) || page.robots.some((content) => /noindex/i.test(content))
}

function checkRobots(res) {
  const problems = []
  if (res.status !== 200) problems.push(`status ${res.status}`)
  const disallows = new Set(
    [...res.body.matchAll(/^Disallow:\s*(\S+)/gim)].map((m) => m[1]),
  )
  const missing = EXPECTED_DISALLOWS.filter((path) => !disallows.has(path))
  if (missing.length > 0) problems.push(`missing Disallow: ${missing.join(', ')}`)
  const sitemapLine = res.body.match(/^Sitemap:\s*(\S+)/im)?.[1]
  if (!sitemapLine) problems.push('no Sitemap line')
  else if (!sitemapLine.startsWith(`${CANONICAL_ORIGIN}/`)) problems.push(`Sitemap not on canonical host: ${sitemapLine}`)
  if (/^Disallow:\s*\/\s*$/im.test(res.body)) problems.push('Disallow: / blocks the whole site')
  return problems
}

function checkPage(loc, res, page) {
  const problems = []
  const expectedCanonical = loc
  if (res.status !== 200) return [`status ${res.status}`]
  if (hasNoindex(res, page)) problems.push('noindex')
  if (page.canonicals.length !== 1) problems.push(`${page.canonicals.length} canonical links`)
  else if (page.canonicals[0] !== expectedCanonical) {
    problems.push(`canonical ${page.canonicals[0]} != ${expectedCanonical}`)
  }
  if (page.h1Count !== 1) problems.push(`${page.h1Count} h1`)
  if (page.title === null) problems.push('no title')
  else if (page.title.length > TITLE_MAX) problems.push(`title ${page.title.length} chars`)
  if (page.description === null) problems.push('no description')
  else if (page.description.length < DESCRIPTION_MIN || page.description.length > DESCRIPTION_MAX) {
    problems.push(`description ${page.description.length} chars`)
  }
  if (!page.ogImage) problems.push('no og:image')
  page.jsonLd.forEach((block, index) => {
    try {
      JSON.parse(block)
    } catch {
      problems.push(`JSON-LD block ${index + 1} does not parse`)
    }
  })
  return problems
}

function summarizePage(page) {
  return `title ${page.title?.length ?? 0}, desc ${page.description?.length ?? 0}, h1 ${page.h1Count}, jsonld ${page.jsonLd.length}`
}

async function main() {
  console.log(`SEO check against ${BASE}\n`)

  // robots.txt
  const robots = await get('/robots.txt')
  const robotsProblems = checkRobots(robots)
  report(robotsProblems.length === 0, '/robots.txt', robotsProblems.join('; '))

  // sitemap.xml
  const sitemap = await get('/sitemap.xml')
  const locs = [...sitemap.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => decodeEntities(m[1]))
  const sitemapProblems = []
  if (sitemap.status !== 200) sitemapProblems.push(`status ${sitemap.status}`)
  if (locs.length === 0) sitemapProblems.push('no <loc> entries')
  const offHost = locs.filter((loc) => !loc.startsWith(`${CANONICAL_ORIGIN}/`))
  if (offHost.length > 0) sitemapProblems.push(`off canonical host: ${offHost.join(', ')}`)
  if (new Set(locs).size !== locs.length) sitemapProblems.push('duplicate <loc>')
  report(sitemapProblems.length === 0, '/sitemap.xml', sitemapProblems.length ? sitemapProblems.join('; ') : `${locs.length} URLs`)

  // Every sitemap URL, fetched on the base under test
  const pages = new Map()
  for (const loc of locs) {
    const path = loc.startsWith(CANONICAL_ORIGIN) ? loc.slice(CANONICAL_ORIGIN.length) : loc
    const res = await get(path)
    const page = inspectPage(res.body)
    pages.set(loc, page)
    const problems = checkPage(loc, res, page)
    report(problems.length === 0, `page ${path}`, problems.length ? problems.join('; ') : summarizePage(page))
  }

  // hreflang reciprocity
  const sitemapSet = new Set(locs)
  for (const [loc, page] of pages) {
    const problems = []
    if (page.alternates.length === 0) problems.push('no hreflang alternates')
    if (!page.alternates.some((alt) => alt.href === loc)) problems.push('no self-referencing alternate')
    for (const alt of page.alternates) {
      if (!sitemapSet.has(alt.href)) {
        problems.push(`${alt.lang} -> ${alt.href} is not a sitemap URL`)
        continue
      }
      const back = pages.get(alt.href)
      if (!back?.alternates.some((candidate) => candidate.href === loc)) {
        problems.push(`${alt.href} does not declare ${loc} back`)
      }
    }
    const path = loc.slice(CANONICAL_ORIGIN.length)
    report(problems.length === 0, `hreflang ${path}`, problems.length ? problems.join('; ') : `${page.alternates.length} alternates`)
  }

  // Private pages
  for (const path of PRIVATE_PAGES) {
    const res = await get(path)
    const page = inspectPage(res.body)
    const problems = []
    if (res.status !== 200) problems.push(`status ${res.status}`)
    if (!hasNoindex(res, page)) problems.push('missing noindex')
    report(problems.length === 0, `noindex ${path}`, problems.join('; '))
  }

  // Unknown paths answer 404, never 500
  for (const path of UNKNOWN_PATHS) {
    const res = await get(path)
    if (path === '/favicon.ico' && res.status === 200) {
      skip(`404 ${path}`, 'the file exists (200)')
      continue
    }
    report(res.status === 404, `404 ${path}`, res.status === 404 ? '' : `status ${res.status}`)
  }

  // llms.txt
  const llms = await get('/llms.txt')
  const llmsProblems = []
  if (llms.status !== 200) llmsProblems.push(`status ${llms.status}`)
  const contentType = llms.headers.get('content-type') ?? ''
  if (!/^text\/plain/i.test(contentType)) llmsProblems.push(`content-type ${contentType || 'missing'}`)
  const contactStart = llms.body.search(/^##\s+Contact\b/im)
  const mainPart = contactStart === -1 ? llms.body : llms.body.slice(0, contactStart)
  const contactPart = contactStart === -1 ? '' : llms.body.slice(contactStart)
  if (contactStart === -1) llmsProblems.push('no Contact section')
  const urlsIn = (text) => (text.match(/https?:\/\/[^\s)>\]]+/g) ?? [])
  const strayUrls = urlsIn(mainPart).filter((url) => !sitemapSet.has(url))
  if (strayUrls.length > 0) llmsProblems.push(`not in sitemap: ${strayUrls.join(', ')}`)
  const badContact = urlsIn(contactPart).filter((url) => !CONTACT_PREFIXES.some((prefix) => url.startsWith(prefix)))
  if (badContact.length > 0) llmsProblems.push(`unexpected contact link: ${badContact.join(', ')}`)
  const missingPages = locs.filter((loc) => !mainPart.includes(loc))
  if (missingPages.length > 0) llmsProblems.push(`sitemap URLs missing: ${missingPages.join(', ')}`)
  report(llmsProblems.length === 0, '/llms.txt', llmsProblems.length ? llmsProblems.join('; ') : `${urlsIn(llms.body).length} URLs`)

  console.log(`\n${failures === 0 ? 'All checks passed' : `${failures} check(s) failed`}`)
  process.exitCode = failures === 0 ? 0 : 1
}

main().catch((error) => {
  console.error(`check-seo crashed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
