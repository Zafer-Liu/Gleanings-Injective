import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { ethers } from 'ethers';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(root, '..');
const artifact = JSON.parse(fs.readFileSync(path.join(root, 'artifacts', 'RpgItem.json'), 'utf8'));
const rpcUrl = process.env.EVM_RPC_URL;
const contractAddress = process.env.RPG_ITEM_CONTRACT_ADDRESS || '';
const chainId = Number(process.env.CHAIN_ID || 1439);
const dotOrigin = (process.env.DOT_API_ORIGIN || 'https://dot.mindreset.tech').replace(/\/$/, '');
const provider = new ethers.JsonRpcProvider(rpcUrl, { chainId, name: process.env.CHAIN_NAME || 'Injective EVM Testnet' });

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

function artPath(item) {
  const id = item.collectible_id || item.medal_id;
  if (id === 'item_taipo_note') return path.join(projectRoot, 'assets', 'rpg_v2', 'collection', 'taipo-note.png');
  if (id === 'act1-winter-brewing') return path.join(projectRoot, 'assets', 'rpg_v2', 'collection', 'winter-brewing.png');
  return '';
}

function displayLines(item, tokenId) {
  const id = item.collectible_id || item.medal_id;
  if (id === 'item_taipo_note') return ["GRANDMOTHER'S", 'NOTE'];
  if (id === 'act1-winter-brewing') return ['WINTER', 'BREWING'];
  const ascii = String(item.name || '').replace(/[^\x20-\x7E]/g, '').trim();
  const words = (ascii || `COLLECTIBLE #${tokenId}`).split(/\s+/);
  const first = [];
  const second = [];
  for (const word of words) ((first.join(' ').length + word.length < 15) ? first : second).push(word);
  return [first.join(' ').slice(0, 16), second.join(' ').slice(0, 16)].filter(Boolean).slice(0, 2);
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[character]));
}

async function renderCard(asset) {
  const [titleOne, titleTwo = ''] = displayLines(asset.item, asset.tokenId).map(escapeXml);
  const shortWallet = `${asset.wallet.slice(0, 6)}...${asset.wallet.slice(-4)}`;
  const svg = Buffer.from(`<svg width="296" height="152" viewBox="0 0 296 152" xmlns="http://www.w3.org/2000/svg">
    <rect width="296" height="152" fill="#fff"/>
    <rect x="1" y="1" width="294" height="150" fill="none" stroke="#000" stroke-width="2"/>
    <line x1="148" y1="8" x2="148" y2="144" stroke="#000" stroke-width="1"/>
    <text x="158" y="24" font-family="sans-serif" font-size="10" font-weight="700" letter-spacing="1.2">GLEANINGS</text>
    <text x="158" y="47" font-family="sans-serif" font-size="15" font-weight="700">${titleOne}</text>
    <text x="158" y="64" font-family="sans-serif" font-size="15" font-weight="700">${titleTwo}</text>
    <line x1="158" y1="74" x2="286" y2="74" stroke="#000" stroke-width="1"/>
    <text x="158" y="91" font-family="monospace" font-size="9">INJECTIVE EVM</text>
    <text x="158" y="106" font-family="monospace" font-size="9">TOKEN #${escapeXml(asset.tokenId)}</text>
    <text x="158" y="121" font-family="monospace" font-size="8">${escapeXml(shortWallet)}</text>
    <rect x="158" y="130" width="8" height="8" fill="#000"/>
    <text x="172" y="138" font-family="sans-serif" font-size="9">TAP TO OPEN</text>
  </svg>`);
  const composites = [{ input: svg, top: 0, left: 0 }];
  const source = artPath(asset.item);
  if (source && fs.existsSync(source)) {
    const art = await sharp(source).resize(132, 132, { fit: 'contain', background: '#ffffff' }).grayscale().normalize().threshold(178).png().toBuffer();
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
        try {
          const tasks = await dotRequest(`/api/authV2/open/device/${encodeURIComponent(device.id)}/loop/list`, key);
          const imageTask = (Array.isArray(tasks) ? tasks : []).find((task) => task.type === 'IMAGE_API');
          return { ...device, image_api_ready: Boolean(imageTask), image_task_key: imageTask?.key || null };
        } catch {
          return { ...device, image_api_ready: null, image_task_key: null };
        }
      }));
      res.json(checked);
    } catch (error) {
      res.status(error.status || 400).json({ error: error.message });
    }
  });

  router.get('/card/:wallet/:tokenId.png', async (req, res) => {
    try {
      const card = await renderCard(await ownedAsset(req.params.wallet, req.params.tokenId));
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-store');
      res.send(card);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/push', async (req, res) => {
    try {
      const key = apiKey(req);
      const id = deviceId(req.body?.device_id);
      const asset = await ownedAsset(req.body?.wallet, req.body?.token_id);
      const tasks = await dotRequest(`/api/authV2/open/device/${encodeURIComponent(id)}/loop/list`, key);
      const imageTask = (Array.isArray(tasks) ? tasks : []).find((task) => task.type === 'IMAGE_API');
      if (!imageTask) {
        const error = new Error('设备尚未配置 Image API。请在 Dot App 打开 Content Studio，把“Image API”加入该设备的 Loop 任务后重试。');
        error.status = 409;
        throw error;
      }
      const publicOrigin = (process.env.PUBLIC_SHARE_ORIGIN || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
      const cardUrl = `${publicOrigin}/api/rpg/dot/card/${encodeURIComponent(asset.wallet)}/${encodeURIComponent(asset.tokenId)}.png`;
      const link = `${publicOrigin}/share/?wallet=${encodeURIComponent(asset.wallet)}&token=${encodeURIComponent(asset.tokenId)}`;
      const result = await dotRequest(`/api/authV2/open/device/${encodeURIComponent(id)}/image`, key, {
        method: 'POST',
        body: JSON.stringify({
          refreshNow: true,
          image: cardUrl,
          link,
          border: 0,
          ditherType: 'NONE',
          taskKey: imageTask.key || undefined,
          taskAlias: `Gleanings #${asset.tokenId}`
        })
      });
      res.json({ message: result.message || '藏品已发送到墨屏', card_url: cardUrl, link });
    } catch (error) {
      res.status(error.status || 400).json({ error: error.message });
    }
  });

  return router;
}
