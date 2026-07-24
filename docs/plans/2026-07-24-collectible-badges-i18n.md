# Collectible Badges and E-ink Internationalization Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add eight stage badges with bilingual metadata, collection filtering, legacy compatibility, optional minting, and legible e-ink artwork.

**Architecture:** A central TypeScript collectible catalog maps stable canonical IDs to legacy story reward IDs and localized copy. The React collection UI consumes only normalized `item | badge` entries, while the chain bridge resolves the same stable IDs to purpose-built monochrome SVG art. Existing save and on-chain IDs remain readable through aliases.

**Tech Stack:** React 19, TypeScript, Vitest, Vite, Express, Sharp, Node test runner, Playwright.

---

### Task 1: Central collectible catalog

**Files:**
- Create: `game/src/app/collectibleCatalog.ts`
- Create: `game/src/app/collectibleCatalog.test.ts`

**Step 1: Write the failing tests**

Cover:

- legacy Act 1 completion unlocks `冬酿印`;
- chapter-one branch relics collapse into `红曲痕` and `温酒盏`;
- final chapter-one reward displays `福建老酒`;
- four chapter-two relics display `旧茶斗 / 清明芽 / 掌火纹 / 西湖龙井`;
- IDs are deduplicated;
- every badge has `i18nKey`, Chinese and English copy;
- legacy chain categories resolve to `badge`.

**Step 2: Run the focused test and verify failure**

Run: `npx pnpm test -- --run src/app/collectibleCatalog.test.ts`

Expected: FAIL because `collectibleCatalog.ts` does not exist.

**Step 3: Implement the minimal catalog**

Define `CollectibleKind`, `Collectible`, localized catalog entries, reward aliases, storage parsing, chain normalization, label helpers, merge and filter helpers.

**Step 4: Run the focused test**

Run: `npx pnpm test -- --run src/app/collectibleCatalog.test.ts`

Expected: PASS.

### Task 2: Collection UI and bilingual mint metadata

**Files:**
- Modify: `game/src/app/App.tsx`
- Modify: `game/src/app/App.css`
- Test: `game/src/app/collectibleCatalog.test.ts`

**Step 1: Add failing tests**

Verify filtering keeps only the requested stable kind and legacy chain tokens normalize to canonical IDs.

**Step 2: Run the focused test and verify failure**

Run: `npx pnpm test -- --run src/app/collectibleCatalog.test.ts`

Expected: FAIL on missing filter and normalization behavior.

**Step 3: Integrate the catalog**

Remove the one-off `MedalService` and inline reward table from `App.tsx`. Add “全部 / 徽章 / 道具” controls with `aria-pressed`, filter counts, and localized kind labels. Send stable English `category` plus `i18n_key`, Chinese/English names, descriptions, and sources in mint requests.

**Step 4: Run tests and typecheck**

Run: `npx pnpm test -- --run src/app/collectibleCatalog.test.ts && npx pnpm typecheck`

Expected: PASS.

### Task 3: Eight high-contrast badge assets

**Files:**
- Create: `assets/rpg_v2/collection/ink/winter-brew-seal.svg`
- Create: `assets/rpg_v2/collection/ink/red-koji-trace.svg`
- Create: `assets/rpg_v2/collection/ink/warm-wine-cup.svg`
- Create: `assets/rpg_v2/collection/ink/fujian-aged-rice-wine.svg`
- Create: `assets/rpg_v2/collection/ink/old-tea-scoop.svg`
- Create: `assets/rpg_v2/collection/ink/qingming-bud.svg`
- Create: `assets/rpg_v2/collection/ink/hand-fire-mark.svg`
- Create: `assets/rpg_v2/collection/ink/west-lake-longjing-tea.svg`
- Modify: `game/src/app/collectibleCatalog.ts`

**Step 1: Add image references to the catalog test**

Assert every badge exposes a non-empty SVG image URL.

**Step 2: Run the focused test and verify failure**

Run: `npx pnpm test -- --run src/app/collectibleCatalog.test.ts`

Expected: FAIL until all badge images are wired.

**Step 3: Draw compact monochrome SVGs**

Use white backgrounds, 4–6 px black contours, open negative space, and distinct motifs for seal, koji, cup, wine jar, tea scoop, bud, firing hand, and Longjing leaf/water.

**Step 4: Run the focused test**

Run: `npx pnpm test -- --run src/app/collectibleCatalog.test.ts`

Expected: PASS.

### Task 4: E-ink renderer and regression tests

**Files:**
- Modify: `rpg-chain-kit/src/dot-router.js`
- Create: `rpg-chain-kit/test/dot-router.test.js`
- Modify: `rpg-chain-kit/package.json`

**Step 1: Write failing renderer tests**

For all eight canonical badge IDs, render a 296×152 card and use Sharp raw pixels to assert:

- exact dimensions;
- visible black pixels;
- visible white pixels;
- badge region black coverage below the all-black threshold.

Also verify legacy reward aliases resolve to the appropriate badge artwork.

**Step 2: Run tests and verify failure**

Run: `npm test`

Expected: FAIL because renderer helpers and artwork mappings are not exported/complete.

**Step 3: Implement badge-aware rendering**

Map canonical and legacy IDs to the eight SVG files. Render badge SVGs directly on white without `normalize().threshold(178)`. Keep a separate grayscale path for ordinary raster items. Export only the pure helpers needed by tests.

**Step 4: Run bridge tests**

Run: `npm test`

Expected: PASS.

### Task 5: Full verification

**Files:**
- Test: `game/e2e/share-mobile.spec.ts`

**Step 1: Run unit tests**

Run: `npx pnpm test -- --run`

Expected: all tests pass.

**Step 2: Run production build**

Run: `npx pnpm build`

Expected: TypeScript and Vite build pass.

**Step 3: Run e2e**

Run: `npx pnpm test:e2e`

Expected: all Playwright tests pass.

**Step 4: Inspect generated badge cards**

Render a contact sheet of all eight e-ink cards and visually confirm distinct silhouettes, readable negative space, and no black blocks.

**Step 5: Review the diff**

Run: `git diff --check && git status --short`

Expected: no whitespace errors and only intended files changed.

