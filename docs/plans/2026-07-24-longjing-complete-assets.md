# Longjing Complete Gameplay Assets Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete every missing chapter-two gameplay asset except film footage and replace all visual placeholders in the four playable Longjing acts.

**Architecture:** Add one typed Longjing gameplay-asset catalog beside the existing map catalog, preload it centrally, and let each scene render dedicated actors and state-aware object overlays. Keep story state, map geometry, interaction coordinates, and save schema unchanged.

**Tech Stack:** TypeScript, Phaser 3, Vitest, Pillow asset pipeline, PNG pixel art, Vite.

---

### Task 1: Define and verify the asset contract

**Files:**
- Create: `game/src/game/render/LongjingAssetCatalog.test.ts`
- Create: `game/src/game/render/LongjingAssetCatalog.ts`
- Modify: `assets/rpg_v2/manifest/assets.manifest.json`

**Steps:**
1. Write failing tests for character, object, leaf, firing-state, and badge keys and paths.
2. Run `pnpm test --run src/game/render/LongjingAssetCatalog.test.ts` and confirm missing exports fail.
3. Add the typed catalog with only the assets required by the four playable acts.
4. Add matching manifest entries and rerun the focused test.
5. Commit the contract.

### Task 2: Produce game-ready pixel assets

**Files:**
- Create: `assets/rpg_v2/sprites/spr_chen_old_walk_96x192.png`
- Create: `assets/rpg_v2/sprites/spr_chen_young_walk_96x192.png`
- Create: `assets/rpg_v2/sprites/spr_master_he_walk_96x192.png`
- Create: `assets/rpg_v2/sprites/spr_market_vendor_walk_96x192.png`
- Create: `assets/rpg_v2/sprites/spr_tea_merchant_walk_96x192.png`
- Create: `assets/rpg_v2/objects/obj_longjing_gameplay_256x128.png`
- Create: `assets/rpg_v2/items/it_longjing_leaf_states_160x32.png`
- Create: `assets/rpg_v2/fx/fx_longjing_firing_states_192x64.png`
- Create: `assets/rpg_v2/scripts/build_longjing_gameplay_assets.py`

**Steps:**
1. Generate character and gameplay-object source boards against the first-chapter style anchor.
2. Repack sources into exact frame grids, remove the chroma key, quantize to the project palette, and enforce hard alpha.
3. Run `python assets/rpg_v2/scripts/verify_assets.py`.
4. Inspect all final sheets at original resolution and nearest-neighbor enlargement.
5. Commit the generated sources, build script, and runtime PNGs.

### Task 3: Preload assets and replace reused actors

**Files:**
- Modify: `game/src/game/scenes/BootScene.ts`
- Modify: `game/src/game/scenes/LongjingMarketScene.ts`
- Modify: `game/src/game/scenes/LongjingTerraceScene.ts`
- Modify: `game/src/game/scenes/LongjingWorkshopScene.ts`
- Modify: `game/src/game/scenes/LongjingTruthScene.ts`
- Create: `game/src/game/render/LongjingActorPolicy.test.ts`
- Create: `game/src/game/render/LongjingActorPolicy.ts`

**Steps:**
1. Write failing tests mapping every Longjing role to a dedicated texture.
2. Implement the role-to-texture policy and central preload loop.
3. Replace reused/tinted actor calls in all four scenes.
4. Run the focused tests and typecheck through the build.
5. Commit actor integration.

### Task 4: Render task objects and leaf states

**Files:**
- Modify: `game/src/game/render/LongjingWorldRenderer.ts`
- Modify: `game/src/game/render/LongjingWorldRenderer.test.ts`
- Create: `game/src/game/render/LongjingObjectLayer.test.ts`
- Create: `game/src/game/render/LongjingObjectLayer.ts`
- Modify: `game/src/game/scenes/LongjingMarketScene.ts`
- Modify: `game/src/game/scenes/LongjingTerraceScene.ts`
- Modify: `game/src/game/scenes/LongjingWorkshopScene.ts`
- Modify: `game/src/game/scenes/LongjingTruthScene.ts`

**Steps:**
1. Write failing tests for object frame mappings, visibility by phase, and leaf texture mappings.
2. Implement atlas-frame object rendering and replace `Graphics` leaf markers with images.
3. Add scene-owned object layers refreshed after state transitions.
4. Verify each active marker resolves to a visible actor or object.
5. Commit gameplay object integration.

### Task 5: Add firing-state visual feedback

**Files:**
- Create: `game/src/game/render/LongjingFiringVisual.test.ts`
- Create: `game/src/game/render/LongjingFiringVisual.ts`
- Modify: `game/src/game/scenes/LongjingWorkshopScene.ts`

**Steps:**
1. Write failing tests for stage, heat, moisture, shape, and debris policy.
2. Implement the firing visual policy and a compact scene overlay.
3. Refresh the overlay before and after every firing choice and hide it outside the firing phase.
4. Run focused workshop and reducer tests.
5. Commit firing feedback.

### Task 6: Replace completion placeholders with colored badges

**Files:**
- Create: `game/src/game/render/LongjingCompletionRelics.test.ts`
- Create: `game/src/game/render/LongjingCompletionRelics.ts`
- Modify: `game/src/game/scenes/LongjingCompleteScene.ts`
- Modify: `game/src/game/scenes/BootScene.ts`

**Steps:**
1. Write a failing test for the three completion relic image mappings.
2. Preload and render the existing badge PNGs with nearest-neighbor scaling.
3. Remove the glyph rectangles and retain title/copy hierarchy.
4. Run the focused test.
5. Commit completion-page integration.

### Task 7: Full verification

**Files:**
- Modify only files required by verification findings.

**Steps:**
1. Run `python assets/rpg_v2/scripts/verify_assets.py`.
2. Run `pnpm test -- --run`.
3. Run `pnpm build`.
4. Start a preview server on an unused port and inspect market, terrace, workshop, truth, and completion screens.
5. Fix only verified regressions, rerun all checks, and commit the finished feature.

