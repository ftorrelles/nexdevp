import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

// CRITICAL: localePrefix 'always' means root / redirects to the negotiated
// locale (Accept-Language header; default 'es'). Both /es and /en are always
// explicit in the URL — no implicit unprefixed route exists.
export default createMiddleware(routing);

export const config = {
  // Match all pathnames except static assets and Next.js internals.
  matcher: [
    "/((?!_next|_vercel|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|ttf|otf)).*)",
  ],
};
