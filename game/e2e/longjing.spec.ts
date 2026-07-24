import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "gleanings.chapter-two.save.v1";
const MARKET_EVIDENCE = [
  "evidence_tin_a",
  "evidence_duplicate_batch",
  "evidence_date_conflict",
  "evidence_flow_record"
];
const WORKSHOP_EVIDENCE = [
  ...MARKET_EVIDENCE,
  "evidence_old_signature"
];
const FULL_EVIDENCE = [
  ...WORKSHOP_EVIDENCE,
  "evidence_original_batch",
  "evidence_refusal_copy"
];

type LongjingAct =
  | "market"
  | "terrace"
  | "workshop"
  | "truth"
  | "film"
  | "complete";

type BrowserLongjingSave = {
  version: 1;
  currentAct: LongjingAct;
  checkpoint: string;
  marketPhase: string;
  terracePhase: string;
  workshopPhase: string;
  truthPhase: string;
  evidence: string[];
  pickAttempts: number;
  pickCorrect: number;
  pickedLeaves: string[];
  firingStep: number;
  firingScore: number;
  firingMistakes: number;
  firingRetryUsed: boolean;
  firingHeat: number;
  firingMoisture: number;
  firingShape: number;
  inscription: string | null;
  filmSeen: boolean;
  chapterComplete: boolean;
  inventory: string[];
  relics: string[];
  cultureCards: string[];
  playerTile: { x: number; y: number };
};

function longjingSave(
  overrides: Partial<BrowserLongjingSave> = {}
): BrowserLongjingSave {
  const act = overrides.currentAct ?? "market";
  const prerequisites: Record<
    LongjingAct,
    Partial<BrowserLongjingSave>
  > = {
    market: {},
    terrace: {
      marketPhase: "COMPLETE",
      evidence: MARKET_EVIDENCE,
      relics: ["relic_old_tea_scoop"]
    },
    workshop: {
      marketPhase: "COMPLETE",
      terracePhase: "COMPLETE",
      evidence: MARKET_EVIDENCE,
      pickAttempts: 12,
      relics: ["relic_old_tea_scoop", "relic_qingming_bud"]
    },
    truth: {
      marketPhase: "COMPLETE",
      terracePhase: "COMPLETE",
      workshopPhase: "COMPLETE",
      evidence: WORKSHOP_EVIDENCE,
      pickAttempts: 12,
      firingStep: 5,
      relics: [
        "relic_old_tea_scoop",
        "relic_qingming_bud",
        "relic_palm_fire"
      ]
    },
    film: {
      marketPhase: "COMPLETE",
      terracePhase: "COMPLETE",
      workshopPhase: "COMPLETE",
      truthPhase: "COMPLETE",
      evidence: FULL_EVIDENCE,
      pickAttempts: 12,
      firingStep: 5,
      inscription: "pass_on"
    },
    complete: {
      marketPhase: "COMPLETE",
      terracePhase: "COMPLETE",
      workshopPhase: "COMPLETE",
      truthPhase: "COMPLETE",
      evidence: FULL_EVIDENCE,
      pickAttempts: 12,
      firingStep: 5,
      inscription: "pass_on",
      filmSeen: true,
      chapterComplete: true
    }
  };
  const base: BrowserLongjingSave = {
    version: 1,
    currentAct: act,
    checkpoint: "longjing_market_arrive",
    marketPhase: "ARRIVE",
    terracePhase: "ARRIVE",
    workshopPhase: "ARRIVE",
    truthPhase: "ARRIVE",
    evidence: [],
    pickAttempts: 0,
    pickCorrect: 0,
    pickedLeaves: [],
    firingStep: 0,
    firingScore: 0,
    firingMistakes: 0,
    firingRetryUsed: false,
    firingHeat: 1,
    firingMoisture: 5,
    firingShape: 0,
    inscription: null,
    filmSeen: false,
    chapterComplete: false,
    inventory: [],
    relics: [],
    cultureCards: [],
    playerTile: { x: 18, y: 18 }
  };
  return {
    ...base,
    ...prerequisites[act],
    ...overrides
  };
}

async function seed(
  page: Page,
  save: BrowserLongjingSave
): Promise<void> {
  await page.evaluate(
    ({ key, value }) => {
      window.localStorage.clear();
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    { key: SAVE_KEY, value: save }
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "进入第二章：龙井茶" }).click();
  await expect(page.locator("canvas")).toBeVisible();
}

async function press(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key, { delay: 70 });
  await page.waitForTimeout(110);
}

async function readSave(
  page: Page
): Promise<BrowserLongjingSave | null> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  }, SAVE_KEY);
}

test.describe("第二章《一叶来处》", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("未游玩第一章也可以从主页独立进入第二章", async ({ page }) => {
    await page.evaluate(() => window.localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "进入第二章：龙井茶" }).click();

    await expect(page.locator("canvas")).toBeVisible();
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-active-scene",
      "LongjingMarket"
    );
    await expect
      .poll(() =>
        page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY)
      )
      .not.toBeNull();
  });

  test("六个章节断点都能刷新续玩并进入正确场景", async ({ page }) => {
    test.setTimeout(45_000);
    const routes: Array<{
      save: BrowserLongjingSave;
      scene: string;
    }> = [
      {
        save: longjingSave(),
        scene: "LongjingMarket"
      },
      {
        save: longjingSave({
          currentAct: "terrace",
          marketPhase: "COMPLETE",
          checkpoint: "longjing_terrace_arrive",
          playerTile: { x: 23, y: 21 }
        }),
        scene: "LongjingTerrace"
      },
      {
        save: longjingSave({
          currentAct: "workshop",
          marketPhase: "COMPLETE",
          terracePhase: "COMPLETE",
          checkpoint: "longjing_workshop_arrive",
          playerTile: { x: 20, y: 19 }
        }),
        scene: "LongjingWorkshop"
      },
      {
        save: longjingSave({
          currentAct: "truth",
          marketPhase: "COMPLETE",
          terracePhase: "COMPLETE",
          workshopPhase: "COMPLETE",
          checkpoint: "longjing_truth_arrive",
          playerTile: { x: 16, y: 19 }
        }),
        scene: "LongjingTruth"
      },
      {
        save: longjingSave({
          currentAct: "film",
          marketPhase: "COMPLETE",
          terracePhase: "COMPLETE",
          workshopPhase: "COMPLETE",
          truthPhase: "COMPLETE",
          checkpoint: "longjing_film_start",
          inscription: "pass_on",
          playerTile: { x: 0, y: 0 }
        }),
        scene: "LongjingFilm"
      },
      {
        save: longjingSave({
          currentAct: "complete",
          marketPhase: "COMPLETE",
          terracePhase: "COMPLETE",
          workshopPhase: "COMPLETE",
          truthPhase: "COMPLETE",
          checkpoint: "longjing_complete",
          inscription: "pass_on",
          filmSeen: true,
          chapterComplete: true,
          playerTile: { x: 0, y: 0 }
        }),
        scene: "LongjingComplete"
      }
    ];

    for (const route of routes) {
      await seed(page, route.save);
      await expect(page.locator("#game-root")).toHaveAttribute(
        "data-active-scene",
        route.scene
      );
      await expect(page.locator("h1")).toHaveCount(0);
    }
  });

  test("来处板按四类证据完成后才开放旧茶斗", async ({ page }) => {
    await seed(
      page,
      longjingSave({
        marketPhase: "BOARD",
        checkpoint: "longjing_market_records",
        evidence: [
          "evidence_tin_a",
          "evidence_duplicate_batch",
          "evidence_date_conflict",
          "evidence_flow_record"
        ],
        playerTile: { x: 25, y: 18 }
      })
    );

    await press(page, "ArrowUp");
    await press(page, "e");
    await press(page, "e");
    await press(page, "e");
    await press(page, "e");
    await press(page, "ArrowRight");
    await press(page, "ArrowRight");
    await press(page, "e");
    await press(page, "e");
    await press(page, "ArrowLeft");
    await press(page, "e");

    await expect
      .poll(async () => (await readSave(page))?.marketPhase)
      .toBe("TEA_SCOOP");
  });

  test("最后一次芽叶判断和最后一轮掌火都不会卡关", async ({
    page
  }) => {
    const firstEleven = [
      "tender",
      "too_young",
      "mature",
      "wet",
      "damaged",
      "tender",
      "tender",
      "mature",
      "tender",
      "wet",
      "tender"
    ];
    await seed(
      page,
      longjingSave({
        currentAct: "terrace",
        marketPhase: "COMPLETE",
        terracePhase: "PICKING",
        checkpoint: "longjing_terrace_pick_11",
        pickAttempts: 11,
        pickCorrect: 11,
        pickedLeaves: firstEleven,
        relics: ["relic_old_tea_scoop"],
        playerTile: { x: 36, y: 9 }
      })
    );

    await press(page, "ArrowUp");
    await press(page, "e");
    await press(page, "e");
    await press(page, "e");
    await expect
      .poll(async () => (await readSave(page))?.currentAct)
      .toBe("workshop");

    await seed(
      page,
      longjingSave({
        currentAct: "workshop",
        marketPhase: "COMPLETE",
        terracePhase: "COMPLETE",
        workshopPhase: "FIRING",
        checkpoint: "longjing_firing_4",
        pickAttempts: 12,
        pickCorrect: 12,
        firingStep: 4,
        firingScore: 4,
        relics: ["relic_old_tea_scoop", "relic_qingming_bud"],
        playerTile: { x: 20, y: 19 }
      })
    );
    await page.waitForTimeout(300);
    await press(page, "e");
    await expect
      .poll(async () => (await readSave(page))?.workshopPhase)
      .toBe("MEMORY");
  });

  test("第二章影片可以跳过并进入双章完成页", async ({ page }) => {
    await seed(
      page,
      longjingSave({
        currentAct: "film",
        marketPhase: "COMPLETE",
        terracePhase: "COMPLETE",
        workshopPhase: "COMPLETE",
        truthPhase: "COMPLETE",
        checkpoint: "longjing_film_start",
        inscription: "restore_name",
        relics: [
          "relic_old_tea_scoop",
          "relic_qingming_bud",
          "relic_palm_fire",
          "relic_one_leaf_origin"
        ],
        playerTile: { x: 0, y: 0 }
      })
    );

    await press(page, "Escape");

    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-active-scene",
      "LongjingComplete"
    );
    await expect
      .poll(async () => (await readSave(page))?.chapterComplete)
      .toBe(true);
  });

  test("最终题词后不经过黑场确认页直接播放影片", async ({ page }) => {
    await seed(
      page,
      longjingSave({
        currentAct: "truth",
        truthPhase: "INSCRIPTION",
        evidence: FULL_EVIDENCE,
        checkpoint: "longjing_truth_inscription",
        playerTile: { x: 17, y: 15 }
      })
    );

    await press(page, "e");
    await press(page, "e");
    await press(page, "e");
    for (let index = 0; index < 6; index += 1) {
      await press(page, "e");
    }

    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-active-scene",
      "LongjingFilm"
    );
    await expect
      .poll(async () => (await readSave(page))?.currentAct)
      .toBe("film");

    await press(page, "Escape");
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-active-scene",
      "LongjingComplete"
    );
  });
});
