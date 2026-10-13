# Portfolio impact & playback package

## Objective
Give the real-projects portfolio (`RealProjectPortfolio`) visual impact and a modern playback experience, and give the showcase card its own material language, without breaking the existing autoplay guarantees.

## Problem
- Project switch is an instant remount (`key={project.id}`, `RealProjectPortfolio.tsx:85`): the 6s autoplay reads as a jump, not motion.
- Pause control is a dated text-glyph pill (`Ⅱ / ▶` + word, `:76`); position "3 of 3" is dead text; three control languages coexist (pill, text tabs, circle arrows).
- Image floats small inside a fixed-height dark stage (`object-contain`, `:87-91`): no drama, no per-kind framing.
- Case-study column reads as a spec sheet: small gray challenge/solution (`:108-109`), 11px outline tags, no outcome highlights.
- Showcase card uses the same bordered `bg-nex-dark` box language as every other section (`:85`), adding to page-wide box monotony.

## Why
User reviewed the published-quality portfolio and asked for more impact: modern playback control, visible motion, stronger presentation, while keeping page balance. Approved verbally on 2026-10-07 ("todo de una, arranca").

## Scope
In:
- `src/components/sections/RealProjectPortfolio.tsx` (playback UI, transition, art direction, hierarchy, card material)
- `src/components/sections/portfolioPlayback.ts` / `realProjectSelection.ts` (only if needed by segmented control)
- `src/content/realProjects.ts` (category accent tokens, optional highlight metadata)
- `messages/en.json`, `messages/es.json` (new keys: highlights, segmented-control aria/labels)
- Tests: `RealProjectPortfolio.test.ts`, `portfolioPlayback.test.ts` (+ new test files under `src/components/sections/` if needed)
- Work-unit commits for each task, on current branch, no push.

Out:
- Page wiring for use-case previews, Navbar, Contact/JoinUs redesign (separate features).
- Publication to main/production (requires explicit user authorization, as always).
- New dependencies (framer-motion already available if needed; prefer CSS).

## Constraints
- Preserve autoplay guarantees: 6000ms interval, category-only wrap, pause on hover/focus/document-hidden/reduced-motion/dialog-open, sticky user pause.
- All UI strings through next-intl in both locales; no hardcoded user-facing text.
- Tailwind utilities only; dark-first brand tokens.
- Accessibility: labeled controls, `aria-pressed`/`aria-live` semantics preserved or improved; transitions disabled under `prefers-reduced-motion`.
- Truthfulness: highlight stats must restate facts already present in existing challenge/solution copy; NO invented performance numbers for real clients. Omit highlight row for a project when nothing defensible exists.
- Every commit keeps `npx vitest run`, `npx tsc --noEmit`, `npx eslint src` green; stage only task-relevant paths (unrelated dirty files — use-case previews, page wiring, Navbar — stay uncommitted).

## Tasks
- [x] T1 — Land showcase core as a shippable unit: commit the existing uncommitted portfolio module (component, playback, selection, content, i18n `realPortfolio` namespace, tests, `public/portfolio/` assets) as-is, green checks. DONE: commit e6f568b (2026-10-07). Verified: vitest 241/244 (3 fails = T2 RED tests, expected), tsc clean, eslint package-scoped clean. Full `npx eslint src` has pre-existing baseline errors in JoinUs.tsx (out of scope).
- [x] T2 — Modern playback: segmented progress bar (one segment per project, fills over 6s while playing, click to jump, click active to toggle pause) replacing text tabs + "3 of 3" + pause pill; SVG play/pause and chevrons inside the circular control language; crossfade + slide transition between projects (CSS or framer-motion), disabled under reduced motion. Tests updated. DONE: commit 8ed981b (2026-10-07).
- [x] T3 — Art direction & hierarchy: image fills stage with per-kind framing (websites: browser chrome frame; apps/portrait: refined phone frame; dashboards: base reflection/shadow), category-tinted glow, hover zoom (reduced-motion safe); display-size project name; challenge/solution as labeled readable blocks; qualitative highlights row (max 3, big Jost green, no invented numbers); quieter tags. i18n keys both locales. Tests. DONE: commit 74afb65 (2026-10-07).
- [x] T4 — Card material: borderless floating stage (gradient + deep shadow + category hairline top light) replacing hard border; structural tests. DONE: commit 8dae9e1 (2026-10-07).
- [x] T5 — Full green pass (npx vitest run, npx tsc --noEmit, npx eslint src), record commit identities below, update this doc + Engram mirror. DONE 2026-10-07: vitest 249/249 (19 files), tsc clean, eslint package-scoped clean.

## Acceptance criteria
- Autoplay guarantees unchanged (interval, wrap, pause conditions, sticky pause).
- One navigation system (categories + segmented bar); no text-glyph pause pill.
- Visible transition between projects; none under reduced motion.
- Every project image fills its stage with kind-appropriate framing.
- Highlights row shows only defensible restatements; absent where none exist.
- Showcase card no longer uses the generic bordered-box language.
- All checks green; commits are shippable units.

## Verification evidence
- T1: vitest 241/244 (3 fails = T2 RED tests, expected), tsc clean, eslint package-scoped clean. Commit e6f568b.
- T2: vitest 34/34 scoped (RED→GREEN), tsc clean, eslint clean. Commit 8ed981b.
- T3: vitest 38/38 scoped, tsc clean, eslint clean. Commit 74afb65.
- T4: vitest 39/39 scoped, tsc clean, eslint clean. Commit 8dae9e1.
- T5: vitest 249/249 (19 files), tsc clean, eslint package-scoped clean. Full `npx eslint src` fails at baseline on JoinUs.tsx (pre-existing, out of scope).
- RDD: assess returned review_due=true (high_risk) but unassessable — native review transport unsupported in the opencode runtime (`immutable_review_transport_unsupported`, only claude-code/codex eligible). Typed unavailable result preserved; review deferred, not invented.
- Commits on branch codex/hero-solution-first (no push): e6f568b (T1), 8ed981b (T2), 74afb65 (T3), 8dae9e1 (T4).

## Route record
- Route: delegated direct (writer trigger: 2+ non-trivial files). Exploration delegated to `explore` (composition map, 2026-10-07).
- Forecast: ~450-550 authored changed lines for T2-T4 (T1 lands pre-existing work). Delivery strategy: ask-on-risk; chain strategy: stacked-to-main (user choice 2026-10-07). Slice boundaries: record per PR at delivery time.

## Progress / next step
- PACKAGE COMPLETE (T1-T5): 4 work-unit commits on codex/hero-solution-first, all checks green (249/249).
- Remaining dirty tree: unrelated in-progress feature (use-case previews, page wiring, Navbar, Hero*) — untouched, as required.
- Next (separate, not authorized): Contact/JoinUs differentiation; page wiring for use-case previews; publication to main/production (requires explicit user authorization).
- Delivery: stacked-to-main (user choice 2026-10-07). Slice boundaries recorded at PR time.
