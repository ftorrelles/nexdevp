# Restore or reuse the original homepage hero

This is the original split-layout hero before the solution-first replacement. Source files are byte-for-byte copies; locale snapshots preserve the exact effective hero object text.

- Base commit: `ba0b7349282fa510cf296d9121de72817103f209`.
- Original source: `src/components/sections/Hero.tsx` and `src/components/sections/HeroCard.tsx`.
- Original translations: the **last** top-level `hero` object in `messages/en.json` and `messages/es.json`. Both files already contained an earlier duplicate; this backup captures the object actually used at runtime.
- The `.tsx.txt` extension intentionally excludes the snapshots from compilation.

## Narrow rollback

1. Compare current `Hero.tsx` with this snapshot and preserve any later changes before restoring. Copy `Hero.tsx.txt` over `src/components/sections/Hero.tsx` only when restoring the original whole hero is intended.
2. The original translation keys and `HeroCard.tsx` are retained by this change, so no locale or dependency rollback is required. Do **not** replace an entire locale file. If a legacy key was later changed, compare the locale snapshot and restore only that specific key in the last `hero` object, keeping unrelated keys intact.
3. `HeroGoalRail.tsx` and `hero.solutionFirst` become unused after restoring the old hero. They may remain for reuse. The hero regression test targets the new design; update its expectations if rollback is intentional.
4. Run lint, typecheck and tests. Check both locales and the restored booking/demo actions in a browser.

## Reuse dependencies

Keep React, next-intl and the configured locale provider; `BookingDialog`, `HeroCard`, the i18n `Link`, and BookingDialog's existing Button/PixelLink, constants, attribution and pixel helpers. Styling requires the existing Tailwind brand/font tokens, next/font setup and hero/drift/pulse keyframes in `src/styles/globals.css`. The original uses a simulated incrementing counter, not measured business data. No dependency or shared component was removed by this replacement.

## Backup integrity (SHA-256)

- `Hero.tsx.txt`: `3df0708f96ec73bb3e3e96ad488eaf2929a9684c26126ca8333061234386a215`
- `HeroCard.tsx.txt`: `86033ddbcd4a1846aabca6b18070e0cc2c5d77151e8a836dbbb5b2e4335e8e79`
- `hero.en.json`: `060bdd2b4983f7876870eb885a71a59c397478769ee6c95f95a2f51491a45cad`
- `hero.es.json`: `ba356d256971f7ba99a85d8d496f6da9f665321496d83ffd239a9e44322177a5`
