import { expect, test } from "@playwright/test";

test.describe("人物志", () => {
  test("可以从独立路径浏览并切换七位人物档案", async ({ page }) => {
    await page.goto("/characters");

    await expect(
      page.getByRole("navigation", { name: "人物志导航" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "林念安" })).toBeVisible();
    await expect(
      page.getByText("记忆可以指路，但不能代替求证。")
    ).toBeVisible();
    await expect(page.locator(".character-roster__list button")).toHaveCount(7);

    await page.getByRole("button", { name: /陈守一/ }).click();
    await expect(page.getByRole("heading", { name: "陈守一" })).toBeVisible();
    await expect(
      page.getByText("形状可以模仿，名称必须对来处负责。")
    ).toBeVisible();
    await expect(page.getByText("龙井茶")).toBeVisible();
  });

  test("手机视口下人物页不产生横向溢出", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/characters");
    await expect(page.getByRole("heading", { name: "林念安" })).toBeVisible();

    const widths = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth
    }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  });
});
