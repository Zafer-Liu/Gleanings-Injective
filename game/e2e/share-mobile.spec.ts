import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const port = 3217;
const origin = `http://127.0.0.1:${port}`;
const wallet = "0x9a470DFd0DdBB861402611c555E8fAf181D64049";
let service: ChildProcess;

test.beforeAll(async () => {
  service = spawn(process.execPath, [resolve(process.cwd(), "../rpg-chain-kit/src/index.js")], {
    cwd: resolve(process.cwd(), "../rpg-chain-kit"),
    env: {
      ...process.env,
      PORT: String(port),
      EVM_RPC_URL: "https://testnet.evm.archival.chain.virtual.json-rpc.injective.network/",
      RPG_ITEM_CONTRACT_ADDRESS: "0xc8167b100bc7Ad611299d634D09b853C6310619e",
      CHAIN_ID: "1439"
    },
    stdio: "ignore"
  });

  await expect.poll(async () => {
    try {
      return (await fetch(`${origin}/health`)).ok;
    } catch {
      return false;
    }
  }, { timeout: 10_000 }).toBe(true);
});

test.afterAll(() => {
  service?.kill();
});

test("扫码分享页在手机视口内不溢出藏品图片", async ({ page }) => {
  test.setTimeout(30_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/share/?wallet=${wallet}`);
  await expect(page.locator("#collection")).toBeVisible();
  await expect(page.locator("#address-form")).toBeHidden();
  await expect(page.locator("#owner")).toHaveText("0x9a47…4049");
  await expect(page.getByRole("button", { name: "分享展示链接" })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "转赠所有权" })).toHaveCount(2);

  const art = page.locator(".card-art").first();
  const image = art.locator("img");
  await expect(image).toBeVisible();
  const [artBox, imageBox] = await Promise.all([art.boundingBox(), image.boundingBox()]);
  expect(artBox).not.toBeNull();
  expect(imageBox).not.toBeNull();
  expect(imageBox!.x).toBeGreaterThanOrEqual(artBox!.x);
  expect(imageBox!.y).toBeGreaterThanOrEqual(artBox!.y);
  expect(imageBox!.x + imageBox!.width).toBeLessThanOrEqual(artBox!.x + artBox!.width);
  expect(imageBox!.y + imageBox!.height).toBeLessThanOrEqual(artBox!.y + artBox!.height);

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
});

test("单件藏品链接只展示对应 Token 并保留分享入口", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/share/?wallet=${wallet}&token=2`);
  await expect(page.locator("#collection-title")).toHaveText("分享的藏品");
  await expect(page.locator("#count")).toHaveText("1 件");
  await expect(page.locator(".card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "太婆字条" })).toBeVisible();
  await expect(page.getByRole("button", { name: "分享展示链接" })).toBeVisible();
  await page.getByRole("button", { name: "转赠所有权" }).click();
  await expect(page.getByRole("dialog", { name: "转赠链上藏品" })).toBeVisible();
  await expect(page.getByLabel("接收方 0x 钱包地址")).toBeVisible();
  await expect(page).toHaveURL(/wallet=.*&token=2/);
});

test("转赠请求会验证当前持有人并记录接收钱包", async ({ request }) => {
  const recipient = "0x000000000000000000000000000000000000dEaD";
  const response = await request.post(`${origin}/api/rpg/requests`, {
    data: { kind: "transfer", wallet, token_id: "2", to_wallet: recipient }
  });
  expect(response.ok()).toBe(true);
  const created = await response.json() as { request_id: string };
  const pending = await request.get(`${origin}/api/rpg/requests/${created.request_id}`);
  expect(pending.ok()).toBe(true);
  await expect(pending.json()).resolves.toMatchObject({
    status: "awaiting_signature",
    action: { kind: "transfer", wallet, token_id: "2", to_wallet: recipient }
  });
});
