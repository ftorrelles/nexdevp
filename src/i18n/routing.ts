import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  // CRITICAL: prefix always — root / redirects to negotiated locale.
  // Case slugs are per-locale in the content model (slugMap).
  localePrefix: "always",
});
