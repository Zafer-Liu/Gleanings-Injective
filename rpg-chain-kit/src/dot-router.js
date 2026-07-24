import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { ethers } from 'ethers';
import opentype from 'opentype.js';
import QRCode from 'qrcode';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(root, '..');
const artifact = JSON.parse(fs.readFileSync(path.join(root, 'artifacts', 'RpgItem.json'), 'utf8'));
const fontBuffer = fs.readFileSync(path.join(root, 'node_modules', '@fontsource', 'noto-sans-sc', 'files', 'noto-sans-sc-chinese-simplified-400-normal.woff'));
const exhibitFont = opentype.parse(fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength));
const rpcUrl = process.env.EVM_RPC_URL;
const contractAddress = process.env.RPG_ITEM_CONTRACT_ADDRESS || '';
const chainId = Number(process.env.CHAIN_ID || 1439);
const dotOrigin = (process.env.DOT_API_ORIGIN || 'https://dot.mindreset.tech').replace(/\/$/, '');
const provider = new ethers.JsonRpcProvider(rpcUrl, { chainId, name: process.env.CHAIN_NAME || 'Injective EVM Testnet' });
const badgeArtRoot = path.join(projectRoot, 'assets', 'rpg_v2', 'collection', 'badges');

const badgeArtById = new Map([
  ['badge_ch1_winter_brew_seal', 'winter-brew-seal.png'],
  ['act1-winter-brewing', 'winter-brew-seal.png'],
  ['badge_ch1_red_koji_trace', 'red-koji-trace.png'],
  ['relic_dongniang_common', 'red-koji-trace.png'],
  ['relic_dongniang_rare', 'red-koji-trace.png'],
  ['relic_liubai_legendary', 'red-koji-trace.png'],
  ['badge_ch1_warm_wine_cup', 'warm-wine-cup.png'],
  ['relic_blue_white_cup_warm', 'warm-wine-cup.png'],
  ['relic_blue_white_cup_inherit', 'warm-wine-cup.png'],
  ['relic_blue_white_cup_remember', 'warm-wine-cup.png'],
  ['badge_ch1_fujian_aged_rice_wine', 'fujian-aged-rice-wine.png'],
  ['relic_one_jar_echo', 'fujian-aged-rice-wine.png'],
  ['badge_ch2_old_tea_scoop', 'old-tea-scoop.png'],
  ['relic_old_tea_scoop', 'old-tea-scoop.png'],
  ['badge_ch2_qingming_bud', 'qingming-bud.png'],
  ['relic_qingming_bud', 'qingming-bud.png'],
  ['badge_ch2_hand_fire_mark', 'hand-fire-mark.png'],
  ['relic_palm_fire', 'hand-fire-mark.png'],
  ['badge_ch2_west_lake_longjing', 'west-lake-longjing-tea.png'],
  ['relic_one_leaf_origin', 'west-lake-longjing-tea.png']
]);

function contract() {
  if (!ethers.isAddress(contractAddress)) throw new Error('RPG_ITEM_CONTRACT_ADDRESS is not configured');
  return new ethers.Contract(contractAddress, artifact.abi, provider);
}

function decodeMetadata(uri) {
  try {
    if (!uri.startsWith('data:application/json;base64,')) return { token_uri: uri };
    return JSON.parse(Buffer.from(uri.split(',', 2)[1], 'base64').toString());
  } catch {
    return { token_uri: uri };
  }
}

function apiKey(req) {
  const raw = String(req.get('X-Dot-Api-Key') || '').trim();
  if (!/^dot_[A-Za-z0-9_-]{16,500}$/.test(raw)) throw new Error('请输入有效的 Dot API Key');
  return raw;
}

function deviceId(value) {
  const id = String(value || '').trim();
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(id)) throw new Error('Dot 设备编号无效');
  return id;
}

async function ownedAsset(walletValue, tokenValue) {
  const wallet = ethers.getAddress(walletValue);
  const tokenId = BigInt(tokenValue);
  const c = contract();
  const owner = await c.ownerOf(tokenId);
  if (owner.toLowerCase() !== wallet.toLowerCase()) throw new Error('这件藏品已不属于该钱包');
  const metadata = decodeMetadata(await c.tokenURI(tokenId));
  return { wallet, tokenId: tokenId.toString(), item: metadata.rpg_item || metadata };
}

async function dotRequest(route, key, options = {}) {
  const response = await fetch(`${dotOrigin}${route}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    signal: AbortSignal.timeout(15_000)
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { message: text }; }
  if (!response.ok) {
    const error = new Error(body.message || `Dot API 请求失败 (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return body;
}

export function artPath(item) {
  const id = item.collectible_id || item.badge_id || item.medal_id;
  const badgeFilename = badgeArtById.get(id);
  if (badgeFilename) return path.join(badgeArtRoot, badgeFilename);
  if (id === 'item_taipo_note') return path.join(projectRoot, 'assets', 'rpg_v2', 'collection', 'taipo-note.png');
  return '';
}

function displayLines(item, tokenId) {
  const characters = Array.from(String(item.name || `链上藏品 #${tokenId}`).trim());
  return [characters.slice(0, 7).join(''), characters.slice(7, 14).join('')].filter(Boolean);
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[character]));
}

function contentMode(value) {
  return value === 'fixed' ? 'fixed' : 'loop';
}

async function imageApiTask(id, key, mode) {
  const tasks = await dotRequest(`/api/authV2/open/device/${encodeURIComponent(id)}/${mode}/list`, key);
  return (Array.isArray(tasks) ? tasks : []).find((task) => task.type === 'IMAGE_API') || null;
}

function textPath(text, x, baseline, size, bold = false) {
  const pathData = exhibitFont.getPath(String(text), x, baseline, size).toPathData(2);
  return `<path d="${pathData}" fill="#000"${bold ? ' stroke="#000" stroke-width=".25"' : ''}/>`;
}

const bayer4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5
];

async function renderBadgeArt(source) {
  const { data, info } = await sharp(source)
    .resize(124, 124, { fit: 'contain' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = Buffer.alloc(info.width * info.height);

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const sourceIndex = (y * info.width + x) * info.channels;
      const red = data[sourceIndex];
      const green = data[sourceIndex + 1];
      const blue = data[sourceIndex + 2];
      const brightest = Math.max(red, green, blue);
      const darkest = Math.min(red, green, blue);
      const targetIndex = y * info.width + x;

      if (brightest <= 24 && brightest - darkest <= 10) {
        pixels[targetIndex] = 255;
        continue;
      }

      const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      const adjusted = Math.max(
        0,
        Math.min(255, (luminance - 10) * 1.8 + 30)
      );
      const threshold = (
        bayer4[(y % 4) * 4 + (x % 4)] + 0.5
      ) * 16;
      pixels[targetIndex] = adjusted < threshold ? 0 : 255;
    }
  }

  return sharp(pixels, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 1
    }
  })
    .extend({
      top: 4,
      bottom: 4,
      left: 4,
      right: 4,
      background: '#ffffff'
    })
    .png()
    .toBuffer();
}

async function renderArt(source) {
  if (path.dirname(source) === badgeArtRoot) {
    return renderBadgeArt(source);
  }
  const base = sharp(source)
    .resize(132, 132, {
      fit: 'contain',
      background: '#ffffff'
    })
    .flatten({ background: '#ffffff' });
  if (path.extname(source).toLowerCase() === '.svg') {
    return base.png().toBuffer();
  }
  return base
    .grayscale()
    .normalize()
    .threshold(178)
    .png()
    .toBuffer();
}

export async function renderCard(asset, collectionLink) {
  const [titleOne, titleTwo = ''] = displayLines(asset.item, asset.tokenId);
  const shortWallet = `${asset.wallet.slice(0, 6)}...${asset.wallet.slice(-4)}`;
  const qrCode = await QRCode.toBuffer(collectionLink, {
    type: 'png',
    errorCorrectionLevel: 'L',
    margin: 1,
    width: 62,
    color: { dark: '#000000', light: '#ffffff' }
  });
  const svg = Buffer.from(`<svg width="296" height="152" viewBox="0 0 296 152" xmlns="http://www.w3.org/2000/svg">
    <rect width="296" height="152" fill="#fff"/>
    <rect x="1" y="1" width="294" height="150" fill="none" stroke="#000" stroke-width="2"/>
    <line x1="148" y1="8" x2="148" y2="144" stroke="#000" stroke-width="1"/>
    ${textPath('拾遗藏品', 158, 24, 10, true)}
    ${textPath(titleOne, 158, 47, 16, true)}
    ${textPath(titleTwo, 158, 65, 16, true)}
    <line x1="158" y1="74" x2="286" y2="74" stroke="#000" stroke-width="1"/>
    ${textPath('INJECTIVE EVM', 158, 91, 9)}
    ${textPath(`链上编号 #${asset.tokenId}`, 158, 106, 9)}
    ${textPath(shortWallet, 158, 121, 8)}
    <rect x="158" y="130" width="8" height="8" fill="#000"/>
    ${textPath('扫码查看', 172, 138, 9)}
  </svg>`);
  const composites = [{ input: svg, top: 0, left: 0 }, { input: qrCode, top: 82, left: 226 }];
  const source = artPath(asset.item);
  if (source && fs.existsSync(source)) {
    const art = await renderArt(source);
    composites.push({ input: art, top: 10, left: 9 });
  } else {
    const seal = Buffer.from('<svg width="132" height="132" xmlns="http://www.w3.org/2000/svg"><rect width="132" height="132" fill="#fff"/><circle cx="66" cy="66" r="45" fill="none" stroke="#000" stroke-width="4"/><text x="66" y="76" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="700">NFT</text></svg>');
    composites.push({ input: seal, top: 10, left: 9 });
  }
  return sharp({ create: { width: 296, height: 152, channels: 3, background: '#ffffff' } }).composite(composites).png().toBuffer();
}

export function createDotRouter() {
  const router = express.Router();

  router.get('/devices', async (req, res) => {
    try {
      const key = apiKey(req);
      const devices = await dotRequest('/api/authV2/open/devices', key);
      const checked = await Promise.all((Array.isArray(devices) ? devices : []).map(async (device) => {
        const [loopTask, fixedTask] = await Promise.all([
          imageApiTask(device.id, key, 'loop').catch(() => null),
          imageApiTask(device.id, key, 'fixed').catch(() => null)
        ]);
        return {
          ...device,
          image_api_ready: Boolean(loopTask || fixedTask),
          image_api_modes: { loop: Boolean(loopTask), fixed: Boolean(fixedTask) }
        };
      }));
      res.json(checked);
    } catch (error) {
      res.status(error.status || 400).json({ error: error.message });
    }
  });

  router.get('/card/:wallet/:tokenId.png', async (req, res) => {
    try {
      const asset = await ownedAsset(req.params.wallet, req.params.tokenId);
      const publicOrigin = (process.env.PUBLIC_SHARE_ORIGIN || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
      const collectionLink = `${publicOrigin}/share/?wallet=${encodeURIComponent(asset.wallet)}`;
      const card = await renderCard(asset, collectionLink);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-store');
      res.send(card);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/nfc/:tokenId', async (req, res) => {
    try {
      const tokenId = BigInt(req.params.tokenId);
      const owner = await contract().ownerOf(tokenId);
      res.setHeader('Cache-Control', 'no-store');
      res.redirect(302, `/share/?wallet=${encodeURIComponent(owner)}&token=${encodeURIComponent(tokenId.toString())}`);
    } catch {
      res.status(404).send('Collectible not found');
    }
  });

  router.post('/push', async (req, res) => {
    try {
      const key = apiKey(req);
      const id = deviceId(req.body?.device_id);
      const mode = contentMode(req.body?.content_mode);
      const asset = await ownedAsset(req.body?.wallet, req.body?.token_id);
      const imageTask = await imageApiTask(id, key, mode);
      if (!imageTask) {
        const place = mode === 'fixed' ? '固定时段任务' : 'Loop 任务';
        const error = new Error(`设备尚未配置 ${place}的 Image API。请在 Dot App 中添加后重试。`);
        error.status = 409;
        throw error;
      }
      const publicOrigin = (process.env.PUBLIC_SHARE_ORIGIN || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
      const cardUrl = `${publicOrigin}/api/rpg/dot/card/${encodeURIComponent(asset.wallet)}/${encodeURIComponent(asset.tokenId)}.png`;
      const link = `${publicOrigin}/api/rpg/dot/nfc/${encodeURIComponent(asset.tokenId)}`;
      const result = await dotRequest(`/api/authV2/open/device/${encodeURIComponent(id)}/image`, key, {
        method: 'POST',
        body: JSON.stringify({
          refreshNow: mode === 'loop',
          image: cardUrl,
          link,
          border: 0,
          ditherType: 'NONE',
          taskKey: imageTask.key || undefined,
          taskAlias: `Gleanings #${asset.tokenId}`
        })
      });
      res.json({ message: result.message || '藏品已发送到墨屏', card_url: cardUrl, link, content_mode: mode });
    } catch (error) {
      res.status(error.status || 400).json({ error: error.message });
    }
  });

  return router;
}
