# Code Review Rules — nexdevp

## TypeScript
- Use `const`/`let`, never `var`
- Prefer `interface` over `type` for object shapes; use `type` for unions, aliases
- No `any` types — use `unknown` + narrowing when needed
- All exported functions must have explicit return types

## React / Next.js
- Use functional components only
- Prefer named exports for components
- Server Components by default; add `'use client'` only when strictly needed (state, events, browser APIs)
- Use `next/image` for all images (never plain `<img>` tags)
- Use `next/font` for fonts (never `<link>` to external font CDNs)

## i18n
- All UI strings through `useTranslations` / `getTranslations` — no hardcoded user-facing text
- Locale parameter always comes from `[locale]` route segment via `params`
- `setRequestLocale(locale)` called at the top of every page/layout that uses locale

## Styling
- Tailwind utilities only — no inline styles except in `next/og` ImageResponse
- Brand tokens via CSS variables (see `src/styles/globals.css`)
- Dark-first: default to `bg-black text-cream`

## File Conventions
- Components: PascalCase, one per file, named export
- Utilities: camelCase
- Route segments: lowercase kebab or Next.js conventions (`[locale]`, `[slug]`)
- All code, comments, identifiers, and UI strings in English (bilingual copy via i18n JSON)

## Git
- Conventional commits: `feat`, `fix`, `chore`, `refactor`, `docs`
- Work-unit commits: each commit is a shippable unit
- No `console.log` left in committed code
