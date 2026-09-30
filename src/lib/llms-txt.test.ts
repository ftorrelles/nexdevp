import { describe, it, expect } from 'vitest'
import { buildLlmsTxt } from './llms-txt'
import sitemap from '@/app/sitemap'
import { BOOKING_URL } from './constants'
import { placeholder1 } from '@/content/case-studies/_placeholder-1'
import { placeholder2 } from '@/content/case-studies/_placeholder-2'

function urlsIn(text: string): string[] {
  return text.match(/https?:\/\/[^\s)]+/g) ?? []
}

describe('buildLlmsTxt()', () => {
  const body = buildLlmsTxt()

  it('starts with the project heading', () => {
    expect(body.startsWith('# nexdevp\n')).toBe(true)
  })

  it('has an English and a Spanish summary', () => {
    expect(body).toContain('> nexdevp is a custom software consultancy.')
    expect(body).toContain('> nexdevp es una consultora de software a medida.')
  })

  it('links every sitemap URL', () => {
    for (const entry of sitemap()) {
      expect(body).toContain(`](${entry.url})`)
    }
  })

  it('only contains sitemap URLs and the contact links', () => {
    const allowed = new Set<string>([...sitemap().map((e) => e.url), BOOKING_URL])
    for (const url of urlsIn(body)) {
      if (url.startsWith('https://wa.me/')) continue
      expect(allowed.has(url), url).toBe(true)
    }
  })

  it('never mentions unpublished (placeholder) cases', () => {
    for (const placeholder of [placeholder1, placeholder2]) {
      expect(placeholder.status).toBe('placeholder')
      for (const slug of Object.values(placeholder.slugMap)) {
        expect(body).not.toContain(`/casos/${slug}`)
      }
    }
  })

  it('has a contact section with WhatsApp and booking links', () => {
    const contact = body.slice(body.indexOf('## Contact'))
    expect(contact).toContain('https://wa.me/34677525806')
    expect(contact).toContain(BOOKING_URL)
  })
})
