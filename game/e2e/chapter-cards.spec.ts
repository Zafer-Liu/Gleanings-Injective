import { expect, test } from "@playwright/test";

test.describe("主页章节封面", () => {
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
