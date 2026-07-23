import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "gleanings.act1.save.v1";
const CHAPTER_SAVE_KEY = "gleanings.chapter-one.save.v2";

type BrowserSave = {
  version: 1;
  phase: string;
  questId: string;
  inventory: string[];
  inspectedObjects: string[];
  senseChoice: string | null;
  playerTile: { x: number; y: number };
  movementLocked: boolean;
  act1Complete: boolean;
  movedTiles: number;
};

async function press(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key, { delay: 70 });
  await page.waitForTimeout(90);
}

async function hold(page: Page, key: string, duration: number): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
  await page.waitForTimeout(120);
}

async function readSave(page: Page): Promise<BrowserSave | null> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  }, SAVE_KEY);
}

async function finishTransition(page: Page): Promise<void> {
  await hold(page, "e", 850);
  for (let line = 0; line < 3; line += 1) {
    await press(page, "e");
  }
  await page.waitForTimeout(1_700);
}

test.describe("第一幕《开坛》", () => {
  test("从公寓醒来走完整个揭坛流程，并能刷新恢复与重新体验", async ({
    page
  }) => {
    test.setTimeout(60_000);
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("canvas")).toBeVisible();

    await press(page, "e");
    await press(page, "e");
    await hold(page, "ArrowLeft", 2_450);
    await expect.poll(async () => (await readSave(page))?.phase).toBe(
      "EXPLORE"
    );

    await hold(page, "ArrowUp", 800);
    await hold(page, "ArrowLeft", 500);
    await press(page, "e");
    await press(page, "e");
    await expect.poll(async () => (await readSave(page))?.phase).toBe(
      "NOTE_ACQUIRED"
    );
    await expect.poll(async () => (await readSave(page))?.inventory).toContain(
      "item_taipo_note"
    );

    await press(page, "i");
    await press(page, "e");
    await press(page, "e");
    await press(page, "e");
    for (let line = 0; line < 6; line += 1) {
      await press(page, "e");
    }
    await expect.poll(async () => (await readSave(page))?.phase).toBe(
      "MIA_ENTERED"
    );

    await hold(page, "ArrowDown", 500);
    await hold(page, "ArrowRight", 5_000);
    await hold(page, "ArrowUp", 1_680);
    await hold(page, "ArrowRight", 1_600);
    await press(page, "e");
    await press(page, "e");
    await expect.poll(async () => (await readSave(page))?.phase).toBe(
      "JAR_INSPECTED"
    );
    await press(page, "ArrowDown");
    await press(page, "e");
    await press(page, "e");
    await expect.poll(async () => (await readSave(page))?.senseChoice).toBe(
      "hongqu_red"
    );

    await finishTransition(page);
    await expect.poll(async () => (await readSave(page))?.phase).toBe(
      "COMPLETE"
    );
    await expect.poll(
      async () => (await readSave(page))?.act1Complete
    ).toBe(true);

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("canvas")).toBeVisible();
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-active-scene",
      "ActTwo"
    );
    await expect
      .poll(() =>
        page.evaluate((key) => {
          const raw = window.localStorage.getItem(key);
          return raw === null ? null : JSON.parse(raw).currentAct;
        }, CHAPTER_SAVE_KEY)
      )
      .toBe(2);
  });

  test("新的安全检查点可选择坛身的凉并完成冷灰记忆分支", async ({
    page
  }) => {
    test.setTimeout(30_000);
    const checkpoint: BrowserSave = {
      version: 1,
      phase: "MIA_ENTERED",
      questId: "act1_find_jar",
      inventory: ["item_taipo_note"],
      inspectedObjects: [],
      senseChoice: null,
      playerTile: { x: 24, y: 9 },
      movementLocked: false,
      act1Complete: false,
      movedTiles: 9
    };

    await page.goto("/");
    await page.evaluate(
      ({ key, save }) => {
        window.localStorage.clear();
        window.localStorage.setItem(key, JSON.stringify(save));
      },
      { key: SAVE_KEY, save: checkpoint }
    );
    await page.reload({ waitUntil: "networkidle" });

    await hold(page, "ArrowRight", 300);
    await press(page, "e");
    await press(page, "e");
    await press(page, "ArrowDown");
    await press(page, "ArrowDown");
    await press(page, "e");
    await press(page, "e");
    await expect.poll(async () => (await readSave(page))?.senseChoice).toBe(
      "cold_clay"
    );

    await finishTransition(page);
    await expect.poll(async () => (await readSave(page))?.phase).toBe(
      "COMPLETE"
    );
    await expect.poll(async () => (await readSave(page))?.senseChoice).toBe(
      "cold_clay"
    );
  });
});
