import { buildLlmsTxt } from '@/lib/llms-txt'

// Static: built once at build time from the same page list as the sitemap.
export const dynamic = 'force-static'

export function GET(): Response {
  return new Response(buildLlmsTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
