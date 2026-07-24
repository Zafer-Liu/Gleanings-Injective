import { expect, test, type Page } from "@playwright/test";

const CHAPTER_SAVE_KEY = "gleanings.chapter-one.save.v2";

type ChapterAct = 2 | 3 | 4 | "film" | "complete";

const SCENE_BY_ACT: Record<ChapterAct, string> = {
  2: "ActTwo",
  3: "ActThree",
  4: "ActFour",
  film: "HuangjiuFilm",
  complete: "ChapterComplete"
};

type BrowserChapterSave = {
  version: 2;
  currentAct: ChapterAct;
  checkpoint: string;
  act1Sense: "aroma" | "hongqu_red" | "cold_clay";
  act2Phase: string;
  act2Question: string | null;
  act3Phase: string;
  act3Materials: string[];
  act3Inscription: string | null;
  act4Phase: string;
  act4Explanation: string | null;
  labelTemplate: 0 | 1;
  labelRetryUsed: boolean;
  cultureFilmSeen: boolean;
  chapterComplete: boolean;
  inventory: string[];
  relics: string[];
  cultureCards: string[];
  playerTile: { x: number; y: number };
};

function chapterSave(
  overrides: Partial<BrowserChapterSave> = {}
): BrowserChapterSave {
  return {
    version: 2,
    currentAct: 2,
    checkpoint: "act2_arrive",
    act1Sense: "hongqu_red",
    act2Phase: "ARRIVE",
    act2Question: null,
    act3Phase: "ARRIVE",
    act3Materials: [],
    act3Inscription: null,
    act4Phase: "ARRIVE",
    act4Explanation: null,
    labelTemplate: 0,
    labelRetryUsed: false,
    cultureFilmSeen: false,
    chapterComplete: false,
    inventory: [],
    relics: [],
    cultureCards: [],
    playerTile: { x: 20, y: 24 },
    ...overrides
  };
}

async function seed(
  page: Page,
  save: BrowserChapterSave
): Promise<void> {
  await page.evaluate(
    ({ key, value }) => {
      window.localStorage.clear();
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    { key: CHAPTER_SAVE_KEY, value: save }
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator("#game-root")).toHaveAttribute(
    "data-active-scene",
    SCENE_BY_ACT[save.currentAct]
  );
}

async function readChapter(
  page: Page
): Promise<BrowserChapterSave | null> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  }, CHAPTER_SAVE_KEY);
}

async function press(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key, { delay: 70 });
  await page.waitForTimeout(100);
}

test.describe("第一章后续幕", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("所有章节检查点都能刷新续玩", async ({ page }) => {
    test.setTimeout(45_000);
    const routes: Array<{
      save: BrowserChapterSave;
      scene: string;
    }> = [
      { save: chapterSave(), scene: "ActTwo" },
      {
        save: chapterSave({
          currentAct: 3,
          checkpoint: "act3_arrive",
          act2Phase: "COMPLETE",
          act2Question: "ask_hongqu",
          playerTile: { x: 17, y: 21 }
        }),
        scene: "ActThree"
      },
      {
        save: chapterSave({
          currentAct: 4,
          checkpoint: "act4_arrive",
          act2Phase: "COMPLETE",
          act2Question: "ask_hongqu",
          act3Phase: "COMPLETE",
          act3Materials: ["bowl", "noodles", "laojiu"],
          act3Inscription: "warm",
          playerTile: { x: 14, y: 15 }
        }),
        scene: "ActFour"
      },
      {
        save: chapterSave({
          currentAct: "film",
          checkpoint: "film_start",
          act2Phase: "COMPLETE",
          act2Question: "ask_hongqu",
          act3Phase: "COMPLETE",
          act3Materials: ["bowl", "noodles", "laojiu"],
          act3Inscription: "warm",
          act4Phase: "COMPLETE",
          act4Explanation: "fujian_hongqu",
          playerTile: { x: 0, y: 0 }
        }),
        scene: "HuangjiuFilm"
      },
      {
        save: chapterSave({
          currentAct: "complete",
          checkpoint: "chapter_complete",
          act2Phase: "COMPLETE",
          act2Question: "ask_hongqu",
          act3Phase: "COMPLETE",
          act3Materials: ["bowl", "noodles", "laojiu"],
          act3Inscription: "warm",
          act4Phase: "COMPLETE",
          act4Explanation: "fujian_hongqu",
          cultureFilmSeen: true,
          chapterComplete: true,
          playerTile: { x: 0, y: 0 }
        }),
        scene: "ChapterComplete"
      }
    ];

    for (const route of routes) {
      await seed(page, route.save);
      await expect(page.locator("#game-root")).toHaveAttribute(
        "data-active-scene",
        route.scene
      );
    }
  });

  test("正式地图上的冬酿和煮面工位可以完成交互", async ({
    page
  }) => {
    test.setTimeout(35_000);
    await seed(
      page,
      chapterSave({
        act2Phase: "MIX",
        checkpoint: "act2_sample",
        inventory: ["item_hongqu_sample"],
        playerTile: { x: 10, y: 21 }
      })
    );
    await press(page, "ArrowUp");
    await press(page, "e");
    await press(page, "e");
    await press(page, "e");
    await expect
      .poll(async () => (await readChapter(page))?.act2Phase)
      .toBe("VAT");

    await seed(
      page,
      chapterSave({
        currentAct: 3,
        checkpoint: "act3_ready_to_cook",
        act2Phase: "COMPLETE",
        act2Question: "ask_hongqu",
        act3Phase: "READY_TO_COOK",
        act3Materials: ["bowl", "noodles", "laojiu"],
        inventory: [
          "ingredient_bowl",
          "ingredient_noodles",
          "ingredient_laojiu"
        ],
        playerTile: { x: 6, y: 16 }
      })
    );
    await press(page, "ArrowUp");
    await press(page, "e");
    await press(page, "e");
    await press(page, "e");
    await expect
      .poll(async () => (await readChapter(page))?.act3Phase)
      .toBe("COOKED");
  });

  test("本地铸造后衔接黄酒后记，并可跳到总完成页", async ({
    page
  }) => {
    test.setTimeout(30_000);
    await seed(
      page,
      chapterSave({
        currentAct: 4,
        checkpoint: "act4_mint",
        act2Phase: "COMPLETE",
        act2Question: "ask_hongqu",
        act3Phase: "COMPLETE",
        act3Materials: ["bowl", "noodles", "laojiu"],
        act3Inscription: "warm",
        act4Phase: "MINT",
        act4Explanation: "fujian_hongqu",
        playerTile: { x: 14, y: 15 }
      })
    );
    await page.waitForTimeout(250);
    await press(page, "e");
    await expect
      .poll(async () => (await readChapter(page))?.currentAct)
      .toBe("film");
    await press(page, "e");
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-active-scene",
      "HuangjiuFilm"
    );

    await press(page, "Escape");
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-active-scene",
      "ChapterComplete"
    );
    await expect
      .poll(async () => (await readChapter(page))?.chapterComplete)
      .toBe(true);
  });
});
