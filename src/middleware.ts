import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware({
  ...routing,
  // Detect locale from Accept-Language header automatically.
  // Users land on /es or /en based on their browser language setting.
  // They can always switch manually via the locale switcher.
  localeDetection: true,
})

export const config = {
  // Match all paths except static assets and Next.js internals.
  matcher: ['/((?!_next|_vercel|api|admin|.*\\..*).*)'],
}
