import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  // CRITICAL: prefix always — root / redirects to negotiated locale.
  // Case slugs are per-locale in the content model (slugMap).
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

// Narrows an untrusted `[locale]` segment. Paths with a dot (e.g. /favicon.ico)
// skip the middleware and reach `[locale]` with an arbitrary value.
export function isLocale(value: string): value is AppLocale {
  return (routing.locales as readonly string[]).includes(value);
}
