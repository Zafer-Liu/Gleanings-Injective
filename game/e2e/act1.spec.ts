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

async function startGameFromHome(page: Page): Promise<void> {
  await page
    .getByRole("button", { name: "进入第一章", exact: true })
    .click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(750);
}

test.describe("第一幕《开坛》", () => {
  test("进入游戏后使用沉浸式舞台并只保留收藏馆与返回主页", async ({
    page
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await startGameFromHome(page);

    await expect(page.locator(".game-masthead")).toHaveCount(0);
    await expect(page.locator(".controls-note")).toHaveCount(0);
    const actions = page.locator(".game-overlay-actions");
    await expect(actions.getByRole("button")).toHaveCount(2);
    await expect(actions.getByRole("button", { name: "收藏馆" })).toBeVisible();
    await expect(
      actions.getByRole("button", { name: "← 返回主页" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "连接钱包" })).toHaveCount(0);

    const stage = await page.locator(".stage-wrap").boundingBox();
    expect(stage).not.toBeNull();
    expect(stage!.x).toBeGreaterThan(0);
    expect(stage!.y).toBe(0);
    expect(stage!.x + stage!.width).toBeLessThan(1280);
    expect(stage!.y + stage!.height).toBeLessThan(800);
    expect(stage!.width / stage!.height).toBeCloseTo(16 / 9, 2);
  });

  test("首页钱包弹窗完整显示在视口内", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await page.getByRole("button", { name: "连接钱包" }).click();

    const dialog = page.getByRole("dialog", { name: "连接钱包" });
    const panel = dialog.locator(".wallet-modal__panel");
    await expect(dialog).toBeVisible();
    await expect(panel).toBeVisible();

    const bounds = await panel.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(1280);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(720);
    await expect(page.getByRole("button", { name: "关闭连接钱包" })).toBeVisible();
  });

  test("箱堆上方的通道不会被整块包围盒挡住", async ({ page }) => {
    test.setTimeout(60_000);
    const checkpoint: BrowserSave = {
      version: 1,
      phase: "ARRIVE",
      questId: "act1_move",
      inventory: [],
      inspectedObjects: [],
      senseChoice: null,
      playerTile: { x: 6, y: 9 },
      movementLocked: false,
      act1Complete: false,
      movedTiles: 2
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
    await startGameFromHome(page);
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-active-scene",
      "Apartment"
    );

    await press(page, "e");
    await press(page, "e");
    await hold(page, "ArrowDown", 600);

    await expect.poll(async () => (await readSave(page))?.phase).toBe(
      "EXPLORE"
    );
    await expect
      .poll(async () => (await readSave(page))?.playerTile.y)
      .toBeGreaterThanOrEqual(10);
  });

  test("纸箱事件可以从3x3方形的对角格触发", async ({ page }) => {
    const checkpoint: BrowserSave = {
      version: 1,
      phase: "EXPLORE",
      questId: "act1_find_box",
      inventory: [],
      inspectedObjects: [],
      senseChoice: null,
      playerTile: { x: 7, y: 13 },
      movementLocked: false,
      act1Complete: false,
      movedTiles: 3
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
    await startGameFromHome(page);

    await press(page, "ArrowLeft");
    await press(page, "e");
    await press(page, "e");

    await expect.poll(async () => (await readSave(page))?.phase).toBe(
      "NOTE_ACQUIRED"
    );
  });

  test("酒坛任务可以从3x3方形内背对目标触发", async ({ page }) => {
    const checkpoint: BrowserSave = {
      version: 1,
      phase: "MIA_ENTERED",
      questId: "act1_find_jar",
      inventory: ["item_taipo_note"],
      inspectedObjects: [],
      senseChoice: null,
      playerTile: { x: 25, y: 10 },
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
    await startGameFromHome(page);

    await press(page, "ArrowLeft");
    await press(page, "e");
    await press(page, "e");

    await expect.poll(async () => (await readSave(page))?.phase).toBe(
      "JAR_INSPECTED"
    );
  });

  test("收藏馆可以打开物品闪卡并翻面阅读介绍", async ({ page }) => {
    const checkpoint: BrowserSave = {
      version: 1,
      phase: "NOTE_ACQUIRED",
      questId: "act1_read_note",
      inventory: ["item_taipo_note"],
      inspectedObjects: ["box"],
      senseChoice: null,
      playerTile: { x: 8, y: 8 },
      movementLocked: false,
      act1Complete: false,
      movedTiles: 4
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
    await page.getByRole("button", { name: "收藏馆" }).click();
    await expect(page.getByRole("heading", { name: "太婆字条" })).toBeVisible();
    await page.getByRole("button", { name: "查看藏品卡" }).click();
    await expect(page.getByRole("img", { name: "太婆字条" })).toBeVisible();
    await page.getByRole("button", { name: "翻转太婆字条藏品卡" }).click();
    await page.waitForTimeout(300);
    await expect(
      page
        .locator(".flashcard__back")
        .getByText("太婆留在纸箱里的字条，是通往冬酿记忆的第一把钥匙。")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "分享展示链接" })
    ).toBeVisible();
  });

  test("从公寓醒来走完整个揭坛流程，并能刷新恢复与重新体验", async ({
    page
  }) => {
    test.setTimeout(60_000);
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    await startGameFromHome(page);

    await press(page, "e");
    await press(page, "e");
    await hold(page, "ArrowLeft", 2_000);
    await expect.poll(async () => (await readSave(page))?.phase).toBe(
      "EXPLORE"
    );

    const exploreSave = await readSave(page);
    expect(exploreSave).not.toBeNull();
    if (exploreSave === null) {
      throw new Error("探索阶段存档尚未写入");
    }
    await page.evaluate(
      ({ key, save }) => {
        window.localStorage.setItem(
          key,
          JSON.stringify({
            ...save,
            playerTile: { x: 7, y: 13 }
          })
        );
      },
      { key: SAVE_KEY, save: exploreSave }
    );
    await page.reload({ waitUntil: "networkidle" });
    await startGameFromHome(page);
    await expect(page.locator("#game-root")).toHaveAttribute(
      "data-active-scene",
      "Apartment"
    );
    await press(page, "ArrowLeft");
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

    await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return;
      const save = JSON.parse(raw) as BrowserSave;
      save.playerTile = { x: 24, y: 9 };
      window.localStorage.setItem(key, JSON.stringify(save));
    }, SAVE_KEY);
    await page.reload({ waitUntil: "networkidle" });
    await startGameFromHome(page);
    await hold(page, "ArrowRight", 500);
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
    await startGameFromHome(page);
    await expect.poll(async () => (await readSave(page))?.phase).toBe(
      "COMPLETE"
    );
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
    await startGameFromHome(page);

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
