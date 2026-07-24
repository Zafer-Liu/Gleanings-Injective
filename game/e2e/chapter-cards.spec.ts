import { expect, test } from "@playwright/test";

test.describe("主页章节封面", () => {
  test("主页标题在桌面和手机上都保持两条完整语句", async ({ page }) => {
    for (const viewport of [
      { width: 1600, height: 1000 },
      { width: 390, height: 844 }
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/");

      const lines = page.locator(".hero-title > *");
      await expect(lines).toHaveCount(2);
      await expect(lines.nth(0)).toHaveText("拾起被遗忘的，");
      await expect(lines.nth(1)).toHaveText("让故事再次发生。");

      const titleBox = await page.locator(".hero-title").boundingBox();
      expect(titleBox).not.toBeNull();
      expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(viewport.width);
    }
  });

  test("章节默认等宽，悬停时当前章节展开，移开后恢复", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto("/");

    const grid = page.locator(".chapter-grid");
    await grid.scrollIntoViewIfNeeded();
    const cards = grid.locator(".chapter-card");
    await expect(cards).toHaveCount(4);

    const defaultBoxes = await cards.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().width)
    );
    expect(Math.max(...defaultBoxes) - Math.min(...defaultBoxes)).toBeLessThan(2);

    await cards.nth(1).hover();
    await page.waitForTimeout(550);
    const hoveredBoxes = await cards.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().width)
    );
    expect(hoveredBoxes[1]).toBeGreaterThan(hoveredBoxes[0] * 1.5);

    await page.locator(".section-heading").hover();
    await page.waitForTimeout(550);
    const restoredBoxes = await cards.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().width)
    );
    expect(Math.max(...restoredBoxes) - Math.min(...restoredBoxes)).toBeLessThan(2);
  });

  test("第二章使用龙井游戏画面作为封面", async ({ page }) => {
    await page.goto("/");

    const secondChapterCover = page.locator(".chapter-card").nth(1).locator("img");
    await expect(secondChapterCover).toHaveAttribute(
      "src",
      "/maps/map_longjing_workshop_1280x896.png"
    );
    await expect(secondChapterCover).toBeVisible();
  });
});
