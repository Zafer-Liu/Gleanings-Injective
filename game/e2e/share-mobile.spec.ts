import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type Server } from "node:http";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const port = 3217;
const origin = `http://127.0.0.1:${port}`;
const wallet = "0x9a470DFd0DdBB861402611c555E8fAf181D64049";
let service: ChildProcess;
let dotMock: Server;
let lastDotPush: Record<string, unknown> | null = null;
let tokenId = "";
let tokenName = "";

test.beforeAll(async () => {
  dotMock = createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.method === "GET" && req.url === "/api/authV2/open/devices") {
      res.end(JSON.stringify([{ id: "DOT123456", alias: "书桌墨屏", location: "工作室", series: "quote", model: "quote_0", edition: 2 }]));
      return;
    }
    if (req.method === "GET" && req.url === "/api/authV2/open/device/DOT123456/loop/list") {
      res.end(JSON.stringify([{ type: "IMAGE_API", key: "image_task_1" }]));
      return;
    }
    if (req.method === "GET" && req.url === "/api/authV2/open/device/DOT123456/fixed/list") {
      res.end(JSON.stringify([{ type: "IMAGE_API", key: "fixed_image_task_1" }]));
      return;
    }
    if (req.method === "POST" && req.url === "/api/authV2/open/device/DOT123456/image") {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        lastDotPush = JSON.parse(Buffer.concat(chunks).toString()) as Record<string, unknown>;
        res.end(JSON.stringify({ message: "Device DOT123456 Image API content switched." }));
      });
      return;
    }
    res.statusCode = 404;
    res.end(JSON.stringify({ message: "Not found" }));
  });
  await new Promise<void>((resolveListen) => dotMock.listen(3218, "127.0.0.1", resolveListen));

  service = spawn(process.execPath, [resolve(process.cwd(), "../rpg-chain-kit/src/index.js")], {
    cwd: resolve(process.cwd(), "../rpg-chain-kit"),
    env: {
      ...process.env,
      PORT: String(port),
      EVM_RPC_URL: "https://k8s.testnet.json-rpc.injective.network/",
      RPG_ITEM_CONTRACT_ADDRESS: "0xc8167b100bc7Ad611299d634D09b853C6310619e",
      CHAIN_ID: "1439",
      DOT_API_ORIGIN: "http://127.0.0.1:3218"
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

  const assets = (await fetch(
    `${origin}/api/rpg/assets/${wallet}`
  ).then((response) => response.json())) as Array<{
    token_id: string;
    item?: { image?: string; name?: string };
  }>;
  const illustrated = assets.find(
    (asset) => asset.item?.image !== undefined
  );
  if (illustrated === undefined) {
    throw new Error("测试钱包需要至少一件带图片的链上藏品");
  }
  tokenId = illustrated.token_id;
  tokenName = illustrated.item?.name ?? `链上藏品 #${tokenId}`;
});

test.afterAll(() => {
  service?.kill();
  dotMock?.close();
});

test("扫码分享页在手机视口内不溢出藏品图片", async ({ page }) => {
  test.setTimeout(45_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    `${origin}/share/?wallet=${wallet}&token=${tokenId}`
  );
  await expect(page.locator("#collection")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("#address-form")).toBeHidden();
  await expect(page.locator("#owner")).toHaveText("0x9a47…4049");
  const cardCount = await page.locator(".card").count();
  expect(cardCount).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "分享展示链接" })).toHaveCount(cardCount);
  await expect(page.getByRole("link", { name: "手机投到墨屏" })).toHaveCount(cardCount);
  await expect(page.getByRole("button", { name: "转赠所有权" })).toHaveCount(cardCount);
  await expect(page.getByRole("heading", { name: "来访笺" })).toBeVisible();
  await page.getByLabel("来访笺内容").fill("从手机留下的一页回响。 ");
  await page.getByRole("button", { name: "留下印记" }).click();
  await expect(page.locator("#visit-list")).toContainText("从手机留下的一页回响。");
  await expect(page.getByRole("button", { name: "切换玩家" })).toBeVisible();
  await page.getByRole("button", { name: "切换玩家" }).click();
  await expect(page.locator("#address-form")).toBeVisible();
  await expect(page.getByRole("button", { name: "查看玩家收藏" })).toBeVisible();

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
});

test("公开分享页把稳定 badge 类型显示为徽章", async ({ page }) => {
  await page.route("**/api/rpg/assets/**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          token_id: "99",
          owner: wallet,
          item: {
            collectible_id:
              "badge_ch1_fujian_aged_rice_wine",
            badge_id:
              "badge_ch1_fujian_aged_rice_wine",
            category: "badge",
            name_zh: "福建老酒",
            name_en: "Fujian Aged Rice Wine",
            description_zh: "第一章文化纪念。",
            image:
              `${origin}/collection/ink/fujian-aged-rice-wine.svg`
          }
        }
      ])
    });
  });

  await page.goto(`${origin}/share/?wallet=${wallet}`);
  const card = page.locator(
    '.card[data-collectible-kind="badge"]'
  );
  await expect(card).toBeVisible();
  await expect(card.locator(".tag")).toHaveText("徽章");
  await expect(
    card.getByRole("heading", { name: "福建老酒" })
  ).toBeVisible();
  await expect(card.locator(".card-art img")).toHaveAttribute(
    "src",
    /\/collection\/ink\/fujian-aged-rice-wine\.svg$/
  );
});

test("手机可预览 296 × 152 墨屏展签", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/dot/?wallet=${wallet}&token=${tokenId}`);
  await expect(page.getByRole("heading", { name: "拾遗 · 墨屏展签" })).toBeVisible();
  await expect(page.getByLabel("Dot API Key")).toBeVisible();
  const preview = page.getByRole("img", { name: "藏品墨屏展签预览" });
  await expect(preview).toBeVisible();
  await expect.poll(() => preview.evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight])).toEqual([296, 152]);
  await expect(page.locator("#preview-status")).toBeHidden();
  const push = page.getByRole("button", { name: "从手机发送到墨屏" });
  await expect(push).toBeVisible();
  const pushBox = await push.boundingBox();
  expect(pushBox).not.toBeNull();
  expect(pushBox!.y + pushBox!.height).toBeLessThanOrEqual(844);
  expect(pushBox!.y).toBeGreaterThan(760);
  const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  await page.getByLabel("Dot API Key").fill("dot_test_1234567890123456");
  await page.getByRole("button", { name: "读取我的设备" }).click();
  await expect(page.getByLabel("选择设备")).toHaveValue("DOT123456");
  await expect(page.getByLabel("展示方式")).toHaveValue("loop");
  await expect(push).toBeEnabled();
  await push.click();
  await expect(page.getByRole("status")).toContainText("Image API content switched");
  await expect(page.getByRole("link", { name: "测试 NFC 打开页面" })).toHaveAttribute("href", new RegExp(`/api/rpg/dot/nfc/${tokenId}$`));
});

test("单件藏品链接只展示对应 Token 并保留分享入口", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/share/?wallet=${wallet}&token=${tokenId}`);
  await expect(page.locator("#collection-title")).toHaveText("分享的藏品", { timeout: 20_000 });
  await expect(page.locator("#count")).toHaveText("1 件");
  await expect(page.locator(".card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: tokenName })).toBeVisible();
  await expect(page.getByRole("button", { name: "分享展示链接" })).toBeVisible();
  await page.getByRole("button", { name: "转赠所有权" }).click();
  await expect(page.getByRole("dialog", { name: "转赠链上藏品" })).toBeVisible();
  await expect(page.getByLabel("接收方 0x 钱包地址")).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`wallet=.*&token=${tokenId}`));
});

test("转赠请求会验证当前持有人并记录接收钱包", async ({ request }) => {
  const recipient = "0x000000000000000000000000000000000000dEaD";
  const response = await request.post(`${origin}/api/rpg/requests`, {
    data: {
      kind: "transfer",
      wallet,
      token_id: tokenId,
      to_wallet: recipient
    }
  });
  expect(response.ok()).toBe(true);
  const created = await response.json() as { request_id: string };
  const pending = await request.get(`${origin}/api/rpg/requests/${created.request_id}`);
  expect(pending.ok()).toBe(true);
  await expect(pending.json()).resolves.toMatchObject({
    status: "awaiting_signature",
    action: {
      kind: "transfer",
      wallet,
      token_id: tokenId,
      to_wallet: recipient
    }
  });
});

test("访客可在公开收藏馆留下来访笺", async ({ request }) => {
  const visitorKey = "share-mobile-visit-key-001";
  const created = await request.post(`${origin}/api/rpg/social/visits`, {
    data: { owner_wallet: wallet, visitor_key: visitorKey, seal: "暖", message: "这段冬酿记忆很温暖。" }
  });
  expect(created.status()).toBe(201);
  await expect(created.json()).resolves.toMatchObject({ visit: { seal: "暖", message: "这段冬酿记忆很温暖。" } });
  const visits = await request.get(`${origin}/api/rpg/social/visits/${wallet}`);
  expect(visits.ok()).toBe(true);
  const payload = await visits.json() as { visits: Array<{ seal: string; message: string }> };
  expect(payload.visits).toEqual(expect.arrayContaining([expect.objectContaining({ seal: "暖", message: "这段冬酿记忆很温暖。" })]));
});

test("Dot API Key 仅经后端转发并推送带 NFC 链接的展签", async ({ request }) => {
  const key = "dot_test_1234567890123456";
  const devices = await request.get(`${origin}/api/rpg/dot/devices`, { headers: { "X-Dot-Api-Key": key } });
  expect(devices.ok()).toBe(true);
  await expect(devices.json()).resolves.toMatchObject([{ id: "DOT123456", alias: "书桌墨屏", image_api_modes: { loop: true, fixed: true } }]);

  const pushed = await request.post(`${origin}/api/rpg/dot/push`, {
    headers: { "X-Dot-Api-Key": key },
    data: { device_id: "DOT123456", wallet, token_id: tokenId }
  });
  expect(pushed.ok(), await pushed.text()).toBe(true);
  expect(lastDotPush).toMatchObject({
    refreshNow: true,
    border: 0,
    ditherType: "NONE",
    taskKey: "image_task_1",
    taskAlias: `Gleanings #${tokenId}`
  });
  expect(String(lastDotPush?.image)).toContain("/api/rpg/dot/card/");
  expect(String(lastDotPush?.link)).toContain(`/api/rpg/dot/nfc/${tokenId}`);

  const fixed = await request.post(`${origin}/api/rpg/dot/push`, {
    headers: { "X-Dot-Api-Key": key },
    data: { device_id: "DOT123456", wallet, token_id: tokenId, content_mode: "fixed" }
  });
  expect(fixed.ok()).toBe(true);
  expect(lastDotPush).toMatchObject({
    refreshNow: false,
    taskKey: "fixed_image_task_1",
    taskAlias: `Gleanings #${tokenId}`
  });

  const nfc = await request.get(`${origin}/api/rpg/dot/nfc/${tokenId}`, { maxRedirects: 0 });
  expect(nfc.status()).toBe(302);
  expect(nfc.headers().location).toContain(`/share/?wallet=${wallet}&token=${tokenId}`);
});
