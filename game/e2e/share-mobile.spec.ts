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
