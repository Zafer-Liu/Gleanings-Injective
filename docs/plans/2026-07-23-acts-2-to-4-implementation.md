# 《拾遗》幕二至幕四与黄酒片尾 Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在现有第一幕垂直切片之后，增加可完整游玩的幕二《冬酿》、幕三《月子酒》、幕四《归》和可跳过、重播的黄酒文化片尾。

**Architecture:** 保留第一幕 v1 reducer 与场景，在其完成页创建 `ChapterOneSaveV2`。幕二至幕四共享章节状态、存档、通用地图几何和通用章节 HUD，每幕拥有独立 reducer、内容与 Phaser 场景；片尾使用 Phaser 本地时间轴模拟视频播放，不依赖网络或外部媒体服务。

**Tech Stack:** TypeScript 5.8、Phaser 3.90、React 19、Vite 7、Vitest 3、Playwright、项目 24 色硬像素 PNG 素材。

---

## 实现约束

- 所有状态变更先写 Vitest 失败用例，再写生产代码；
- 关键剧情验证通过 `localStorage` 中的稳定检查点，不依赖像素级坐标猜测；
- 地图保持 `32×32` tile，角色保持 `32×48` frame；
- 不加入环境光、渐变、柔光、伪 3D 或写实酒类广告效果；
- 所有主流程在离线环境可完成；
- 文化短片事实文本使用已审定口径，不把贾湖遗存称作现代黄酒。

### Task 1: 章节 v2 状态与 v1 存档迁移

**Files:**
- Create: `game/src/game/domain/chapterState.ts`
- Create: `game/src/game/domain/chapterReducer.ts`
- Create: `game/src/game/domain/chapterReducer.test.ts`
- Create: `game/src/game/systems/ChapterSaveService.ts`
- Create: `game/src/game/systems/ChapterSaveService.test.ts`

**Step 1: Write the failing state tests**

覆盖：

```ts
it("creates act two from a completed act one save", () => {
  const chapter = createChapterFromActOne("cold_clay");
  expect(chapter.currentAct).toBe(2);
  expect(chapter.act1Sense).toBe("cold_clay");
  expect(chapter.checkpoint).toBe("act2_arrive");
});

it("rejects an act three cooking event before all materials exist", () => {
  const state = createChapterFromActOne("aroma");
  const result = reduceChapter(state, { type: "ACT3_COOK" });
  expect(result).toBe(state);
});
```

并覆盖幕二三道工序、三个追问分支、幕三任意材料顺序、铭文分支、幕四酒签重试上限、片尾跳过/播完、幂等重复事件。

**Step 2: Run tests to verify RED**

Run:

```bash
cd game
pnpm test -- --run src/game/domain/chapterReducer.test.ts
```

Expected: FAIL because the chapter domain files do not exist.

**Step 3: Implement the minimal chapter domain**

核心类型：

```ts
export type ChapterOneSaveV2 = {
  version: 2;
  currentAct: 2 | 3 | 4 | "film" | "complete";
  checkpoint: string;
  act1Sense: SenseChoice;
  act2Phase: Act2Phase;
  act2Question: Act2Question | null;
  act3Phase: Act3Phase;
  act3Materials: Act3Material[];
  act3Inscription: Act3Inscription | null;
  act4Phase: Act4Phase;
  act4Explanation: Act4Explanation | null;
  labelTemplate: 0 | 1;
  labelRetryUsed: boolean;
  cultureFilmSeen: boolean;
  chapterComplete: boolean;
  inventory: string[];
  relics: string[];
  cultureCards: string[];
  playerTile: TilePosition;
};
```

Reducer 仅接受与当前幕和阶段匹配的事件。每个安全节点更新 `checkpoint` 和 `playerTile`；完成幕二、幕三和幕四时推进 `currentAct`。

**Step 4: Write the failing save tests**

覆盖：

- v2 round-trip；
- 损坏 JSON 备份并回退；
- 从 `gleanings.act1.save.v1` 的 `COMPLETE` 状态迁移；
- 第一幕未完成时不迁移；
- 非安全中间态恢复到前一个检查点；
- 越界 tile 恢复到当前幕出生点。

**Step 5: Run save tests to verify RED**

Run:

```bash
pnpm test -- --run src/game/systems/ChapterSaveService.test.ts
```

Expected: FAIL because `ChapterSaveService` is missing.

**Step 6: Implement `ChapterSaveService`**

使用：

```ts
static readonly STORAGE_KEY = "gleanings.chapter-one.save.v2";
static readonly CORRUPT_KEY = "gleanings.chapter-one.corrupt";
static readonly LEGACY_KEY = "gleanings.act1.save.v1";
```

`load()` 返回 `ChapterOneSaveV2 | null`；`createFromLegacy()` 只接受完成的 v1 存档；`save()`、`clear()` 和 `normalize()` 保证状态安全。

**Step 7: Run domain and save tests**

Run:

```bash
pnpm test -- --run src/game/domain/chapterReducer.test.ts src/game/systems/ChapterSaveService.test.ts
```

Expected: PASS.

**Step 8: Commit**

```bash
git add game/src/game/domain game/src/game/systems/ChapterSaveService*
git commit -m "feat(game): add chapter progression state"
```

### Task 2: 通用章节内容、地图几何与 UI

**Files:**
- Create: `game/src/content/chapter/types.ts`
- Create: `game/src/game/render/ChapterMapGeometry.ts`
- Create: `game/src/game/render/ChapterMapGeometry.test.ts`
- Create: `game/src/game/systems/ChapterInteraction.ts`
- Create: `game/src/game/systems/ChapterInteraction.test.ts`
- Create: `game/src/game/ui/ChapterHud.ts`
- Create: `game/src/game/ui/ChapterChoicePanel.ts`
- Create: `game/src/game/ui/RelicPanel.ts`
- Modify: `game/src/game/entities/Player.ts`

**Step 1: Write failing geometry and interaction tests**

覆盖 tile rectangle 到整数像素、地图宽高、碰撞脚印、遮挡深度、面向目标选择、不可交互阶段过滤。

```ts
expect(buildChapterGeometry(map).width).toBe(44 * 32);
expect(findChapterTarget({ x: 8, y: 10 }, "right", objects, phase)?.id)
  .toBe("hongqu_tray");
```

**Step 2: Run tests to verify RED**

Run:

```bash
pnpm test -- --run src/game/render/ChapterMapGeometry.test.ts src/game/systems/ChapterInteraction.test.ts
```

Expected: FAIL because helpers do not exist.

**Step 3: Implement shared helpers and generic UI**

- `ChapterMapGeometry` 输出世界尺寸、碰撞矩形和前景遮挡；
- `ChapterInteraction` 复用正前方 Manhattan 距离规则，并支持阶段 predicate；
- `Player` 动画 key 改为按 texture 命名，允许同一场景安全加载不同角色；
- `ChapterHud` 接收普通 view model，而非绑定 `Act1State`；
- `ChapterChoicePanel<T>` 支持各幕三个选项；
- `RelicPanel` 展示信物名称、等级、短文和继续按钮。

**Step 4: Run tests**

Run:

```bash
pnpm test -- --run src/game/render/ChapterMapGeometry.test.ts src/game/systems/ChapterInteraction.test.ts src/game/entities/PlayerVisualPolicy.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add game/src/content/chapter game/src/game/render/ChapterMapGeometry* game/src/game/systems/ChapterInteraction* game/src/game/ui game/src/game/entities/Player.ts
git commit -m "feat(game): add reusable chapter scene systems"
```

### Task 3: 幕二《冬酿》内容、状态流与场景

**Files:**
- Create: `game/src/content/act2/content.ts`
- Create: `game/src/content/act2/brewery-map.json`
- Create: `game/src/content/act2/dialogue.zh-CN.json`
- Create: `game/src/content/act2/quests.json`
- Create: `game/src/content/act2/interactables.json`
- Create: `game/src/game/domain/act2Flow.ts`
- Create: `game/src/game/domain/act2Flow.test.ts`
- Create: `game/src/game/scenes/ActTwoScene.ts`
- Modify: `game/src/game/scenes/ActOneCompleteScene.ts`

**Step 1: Write failing act-two flow tests**

覆盖：

- 阿凤师交谈后才可检查红曲盘；
- 红曲盘和陶坛都看过后才能取样；
- 霜降、立冬、冬至严格顺序；
- 错序不消耗物品；
- 三个追问产生正确文化卡和曲印等级；
- `cold_clay + ask_future` 产生“留白印”。

**Step 2: Verify RED**

Run:

```bash
pnpm test -- --run src/game/domain/act2Flow.test.ts
```

Expected: FAIL because `act2Flow` is missing.

**Step 3: Implement content and flow**

任务顺序：

```text
阿凤师 → 红曲盘 → 陶坛 → 红曲样品
→ 拌曲台 → 下缸区 → 封坛区 → 阿凤师追问 → 曲印
```

对白加入：

> 黄酒各地都有自己的脾气。我们福建这坛酒，认的是红曲。

**Step 4: Implement `ActTwoScene`**

- 世界尺寸 `1408×960`；
- 少女太婆为玩家，阿凤师为 NPC；
- 背景无玩家和 NPC 烘焙；
- 地图滚动、脚底碰撞和遮挡；
- 当前任务物体上方只显示一个黄色箭头；
- 每次完成工序更新工位 tint/状态标记、任务 HUD 与存档；
- 完成追问后展示曲印并进入幕三。

**Step 5: Wire the act-one completion entry**

第一幕完成页把“第二幕制作中”替换为可交互的“进入冬日酒坊”；点击或 `E/Enter` 时创建或载入 v2 存档并启动 `ActTwo`。

**Step 6: Run tests and typecheck**

Run:

```bash
pnpm test -- --run src/game/domain/act2Flow.test.ts
pnpm typecheck
```

Expected: PASS.

**Step 7: Commit**

```bash
git add game/src/content/act2 game/src/game/domain/act2Flow* game/src/game/scenes/ActTwoScene.ts game/src/game/scenes/ActOneCompleteScene.ts
git commit -m "feat(game): add playable winter brewing act"
```

### Task 4: 幕三《月子酒》内容、状态流与场景

**Files:**
- Create: `game/src/content/act3/content.ts`
- Create: `game/src/content/act3/kitchen-map.json`
- Create: `game/src/content/act3/dialogue.zh-CN.json`
- Create: `game/src/content/act3/quests.json`
- Create: `game/src/content/act3/interactables.json`
- Create: `game/src/game/domain/act3Flow.ts`
- Create: `game/src/game/domain/act3Flow.test.ts`
- Create: `game/src/game/scenes/ActThreeScene.ts`

**Step 1: Write failing act-three tests**

覆盖三种材料任意顺序、重复拾取幂等、缺料不能烹制、烹制后才能送餐、三种铭文结果与青花酒盏。

**Step 2: Verify RED**

Run:

```bash
pnpm test -- --run src/game/domain/act3Flow.test.ts
```

Expected: FAIL because `act3Flow` is missing.

**Step 3: Implement content and reducer adapter**

任务顺序：

```text
家人 → 碗/面线/老酒（任意顺序）→ 灶台 → 阿珍 → 铭文选择 → 青花酒盏
```

HUD 显示 `备料 0/3` 到 `3/3`。

**Step 4: Implement `ActThreeScene`**

- 世界尺寸 `1152×832`；
- 中年太婆为玩家，阿珍与家人为 NPC；
- 材料拾取后从场景隐藏；
- 灶台完成后出现成品碗；
- 送餐后更新阿珍对白与场景状态；
- 展示青花酒盏后进入幕四。

**Step 5: Run tests and typecheck**

Run:

```bash
pnpm test -- --run src/game/domain/act3Flow.test.ts
pnpm typecheck
```

Expected: PASS.

**Step 6: Commit**

```bash
git add game/src/content/act3 game/src/game/domain/act3Flow* game/src/game/scenes/ActThreeScene.ts
git commit -m "feat(game): add playable postpartum wine act"
```

### Task 5: 幕四双语酒签与演示铸造

**Files:**
- Create: `game/src/content/act4/content.ts`
- Create: `game/src/game/domain/cultureLabel.ts`
- Create: `game/src/game/domain/cultureLabel.test.ts`
- Create: `game/src/game/scenes/ActFourScene.ts`
- Create: `game/src/game/ui/CultureLabelPanel.ts`
- Create: `game/src/game/ui/DemoMintPanel.ts`

**Step 1: Write failing label tests**

覆盖：

- 四次选择稳定生成同一中文名、英文名、文化事实和创意表达；
- 重试仅改变创意模板；
- 同一输入产生稳定 `pathHash`；
- token 明确带 `DEMO-` 前缀；
- 文化事实不含“最早黄酒”“世界三大古酒”等禁用绝对表述。

**Step 2: Verify RED**

Run:

```bash
pnpm test -- --run src/game/domain/cultureLabel.test.ts
```

Expected: FAIL because label generator is missing.

**Step 3: Implement deterministic local label generator**

API：

```ts
generateCultureLabel(state: ChapterOneSaveV2): CultureLabel
createDemoMint(label: CultureLabel): DemoMintReceipt
```

只使用本地模板和稳定哈希，不调用 AI、钱包或链上服务。

**Step 4: Implement act four scene**

- 复用开坛后的公寓背景；
- 林怡和米娅处于屏幕内；
- 米娅提问“这是你们家的酒，还是福建人都会酿的酒？”；
- 林怡回应“它从我们家出发，但背后是一条更长的黄酒传统。”；
- 三选一英文解释；
- 酒签可接受或重试一次；
- 演示铸造明确标注“本地演示”，完成后获得“一坛回声”。

**Step 5: Run tests and typecheck**

Run:

```bash
pnpm test -- --run src/game/domain/cultureLabel.test.ts
pnpm typecheck
```

Expected: PASS.

**Step 6: Commit**

```bash
git add game/src/content/act4 game/src/game/domain/cultureLabel* game/src/game/scenes/ActFourScene.ts game/src/game/ui/CultureLabelPanel.ts game/src/game/ui/DemoMintPanel.ts
git commit -m "feat(game): add homecoming label and demo mint"
```

### Task 6: 黄酒文化片尾时间轴

**Files:**
- Create: `game/src/content/film/huangjiuFilm.ts`
- Create: `game/src/content/film/huangjiuFilm.test.ts`
- Create: `game/src/game/domain/FilmTimeline.ts`
- Create: `game/src/game/domain/FilmTimeline.test.ts`
- Create: `game/src/game/scenes/HuangjiuFilmScene.ts`
- Create: `game/src/game/scenes/ChapterCompleteScene.ts`

**Step 1: Write failing timeline/content tests**

覆盖：

- 六段时间范围连续覆盖约 80 秒；
- 暂停时进度不变；
- 跳过和播放完成都设置 `cultureFilmSeen`；
- 字幕包含“它并不是今天的黄酒”；
- 字幕不包含未经审定的绝对化表述；
- 完成页支持重播但不重复发放徽章。

**Step 2: Verify RED**

Run:

```bash
pnpm test -- --run src/content/film/huangjiuFilm.test.ts src/game/domain/FilmTimeline.test.ts
```

Expected: FAIL because the film files are missing.

**Step 3: Implement local timeline**

片段：

```text
00–10 家族酒坛
10–24 谷物酿造酒
24–38 贾湖混合发酵饮料
38–55 酒曲与边糖化边发酵
55–68 宋元工艺发展
68–80 福建红曲与传承
```

`FilmTimeline` 提供 `tick`、`togglePause`、`seekToSegment`、`skip` 和 `complete`。

**Step 4: Implement `HuangjiuFilmScene`**

- 画面使用硬像素静帧、横向分层移动和器物特写；
- 顶部进度条，底部中文字幕；
- `Space` 暂停/继续，`S` 开关字幕，`Esc` 跳过；
- 无环境光、无模糊转场、无网络视频；
- 结尾显示“酒会饮尽，酿酒的人与他们的故事，不该消失。”

**Step 5: Implement chapter complete scene**

展示三件收藏、路径摘要、重播文化短片和从头体验入口。

**Step 6: Run tests and typecheck**

Run:

```bash
pnpm test -- --run src/content/film/huangjiuFilm.test.ts src/game/domain/FilmTimeline.test.ts
pnpm typecheck
```

Expected: PASS.

**Step 7: Commit**

```bash
git add game/src/content/film game/src/game/domain/FilmTimeline* game/src/game/scenes/HuangjiuFilmScene.ts game/src/game/scenes/ChapterCompleteScene.ts
git commit -m "feat(game): add huangjiu epilogue film"
```

### Task 7: 新增像素地图、角色与任务物件素材

**Files:**
- Create: `assets/rpg_v2/maps/map_brewery_winter_1408x960.png`
- Create: `assets/rpg_v2/maps/map_postpartum_kitchen_1152x832.png`
- Create: `assets/rpg_v2/sprites/spr_taipo_young_walk_96x192.png`
- Create: `assets/rpg_v2/sprites/spr_afeng_walk_96x192.png`
- Create: `assets/rpg_v2/sprites/spr_taipo_middle_walk_96x192.png`
- Create: `assets/rpg_v2/sprites/spr_azhen_walk_96x192.png`
- Create: `assets/rpg_v2/objects/obj_bowl_32x32.png`
- Create: `assets/rpg_v2/objects/obj_noodles_32x32.png`
- Create: `assets/rpg_v2/objects/obj_cooked_noodles_32x32.png`
- Create: `assets/rpg_v2/items/it_blue_white_cup_128x128.png`
- Modify: `assets/rpg_v2/manifest/assets.manifest.json`
- Modify: `assets/rpg_v2/scripts/verify_assets.py`

**Step 1: Generate project-bound raster sources**

使用内置 `image_gen`：

- 编辑现有酒坊风格锚，扩展成无角色的 `44×30` 酒坊；
- 生成无角色的 `36×26` 福建灶间；
- 按同一 `3×4` 行走表规范生成四名角色的绿幕源图。

每个输出复制进工作树后再做无抖动色板量化、最近邻缩放和硬 alpha。

**Step 2: Create small deterministic derivatives**

从已生成地图/tileset 中提取并整理碗、面线、成品和青花酒盏；不得用 CSS/SVG 占位替代最终游戏内位图。

**Step 3: Validate images visually**

使用 `view_image` 检查：

- 地图无烘焙角色；
- 主要通道与 JSON 碰撞吻合；
- 角色每格脚底对齐；
- 无黑影、柔光、模糊和伪 3D。

**Step 4: Extend manifest verification**

新增素材检查尺寸、tile 对齐、24 色上限和 hard alpha。

**Step 5: Run asset validation**

Run:

```bash
python assets/rpg_v2/scripts/verify_assets.py
```

Expected: `RPG asset verification passed.`

**Step 6: Commit**

```bash
git add assets/rpg_v2
git commit -m "feat(assets): add later-act pixel art"
```

### Task 8: 场景注册、启动路由与页面文案

**Files:**
- Modify: `game/src/game/config.ts`
- Modify: `game/src/game/scenes/BootScene.ts`
- Modify: `game/src/app/App.tsx`
- Modify: `game/src/app/app.css`
- Modify: `game/README.md`

**Step 1: Write the failing route policy tests**

Create:

- `game/src/game/domain/ChapterRoute.ts`
- `game/src/game/domain/ChapterRoute.test.ts`

覆盖 v1 未完成、v1 已完成、幕二/三/四、片尾和章节完成的场景路由。

**Step 2: Verify RED**

Run:

```bash
pnpm test -- --run src/game/domain/ChapterRoute.test.ts
```

Expected: FAIL because route policy is missing.

**Step 3: Implement route policy and register scenes**

Boot 优先检查 v2；没有 v2 时继续第一幕。注册 `ActTwo`、`ActThree`、`ActFour`、`HuangjiuFilm` 与 `ChapterComplete`。

**Step 4: Update page shell**

标题改为章节级《拾遗》，章节注释动态中性化；保留键盘操作说明，并增加片尾快捷键提示。不得用渐变或环境光。

**Step 5: Update README**

记录完整流程、v2 存档键、跳过/重播、验证命令和本地演示边界。

**Step 6: Run tests and build**

Run:

```bash
pnpm test -- --run
pnpm typecheck
pnpm build
```

Expected: all commands exit 0.

**Step 7: Commit**

```bash
git add game/src/game/config.ts game/src/game/scenes/BootScene.ts game/src/game/domain/ChapterRoute* game/src/app game/README.md
git commit -m "feat(game): connect the full chapter flow"
```

### Task 9: 完整浏览器路径与最终验收

**Files:**
- Create: `game/e2e/chapter.spec.ts`
- Modify: `game/e2e/act1.spec.ts`

**Step 1: Write the failing E2E**

从完成的第一幕安全检查点开始：

```text
进入幕二 → 完成三个冬酿工序 → 选择追问
→ 幕三任意顺序收集三件材料 → 烹制 → 送餐 → 选择铭文
→ 幕四解释 → 生成/重试/接受酒签 → 演示铸造
→ 片尾暂停/字幕/跳过 → 完成页 → 重播
```

另写刷新恢复用例，分别从幕二工序、幕三备料、幕四酒签和片尾检查点恢复。

**Step 2: Run E2E to verify RED**

Run:

```bash
pnpm test:e2e -- chapter.spec.ts
```

Expected: FAIL until all scene routing and test hooks are connected.

**Step 3: Add stable test-visible state**

仅通过真实存档和键盘流程控制；允许场景根节点暴露当前 scene key 的只读 `data-*`，不得添加测试专用生产逻辑。

**Step 4: Run complete verification**

Run:

```bash
pnpm test -- --run
pnpm typecheck
pnpm build
pnpm test:e2e
cd ..
python assets/rpg_v2/scripts/verify_assets.py
git diff --check
```

Expected:

- all Vitest files pass；
- TypeScript exit 0；
- Vite production build exit 0；
- all Playwright cases pass；
- asset verification passes；
- no whitespace errors。

**Step 5: Manual visual verification**

启动工作树开发服务器并检查：

- 幕二/幕三地图滚动与人物尺寸稳定；
- 所有任务物体只有一个箭头；
- 无明显空气墙；
- NPC 位于可见可达区域；
- 幕四人物均在屏幕内；
- 片尾可暂停、跳过、隐藏字幕和重播；
- 页面亮度与已确认素材一致，无环境光叠层。

**Step 6: Commit**

```bash
git add game/e2e
git commit -m "test(game): cover the complete chapter journey"
```
