import express from 'express';
import { ethers } from 'ethers';
import { createSocialStore } from './social-store.js';

const seals = new Set(['见', '念', '暖', '藏']);
const store = createSocialStore();
const recentWrites = new Map();

function ownerAddress(value) {
  if (!ethers.isAddress(value)) throw new Error('请输入有效的收藏馆钱包地址');
  return ethers.getAddress(value);
}

function visitorKey(value) {
  const key = String(value || '').trim();
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(key)) throw new Error('来访标识无效，请刷新页面后重试');
  return key;
}

function visitMessage(value) {
  const message = String(value || '').trim().replace(/\s+/g, ' ');
  if (message.length < 2 || message.length > 60) throw new Error('来访笺请填写 2–60 个字');
  return message;
}

function mayWrite(req, owner, key) {
  const now = Date.now();
  const fingerprint = `${req.ip}:${owner.toLowerCase()}:${key}`;
  const last = recentWrites.get(fingerprint) || 0;
  if (now - last < 30_000) return false;
  recentWrites.set(fingerprint, now);
  return true;
}

export function createSocialRouter() {
  const router = express.Router();

  router.get('/status', (_req, res) => {
    res.json({ visits_persistent: store.persistent });
  });

  router.get('/visits/:owner', async (req, res) => {
    try {
      const owner = ownerAddress(req.params.owner);
      res.setHeader('Cache-Control', 'no-store');
      res.json({ visits: await store.listVisits(owner), persistent: store.persistent });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/visits', async (req, res) => {
    try {
      const owner = ownerAddress(req.body?.owner_wallet);
      const key = visitorKey(req.body?.visitor_key);
      if (!mayWrite(req, owner, key)) {
        return res.status(429).json({ error: '同一位访客请 30 秒后再留言' });
      }
      const seal = String(req.body?.seal || '见');
      if (!seals.has(seal)) throw new Error('请选择有效的印记');
      const visit = await store.addVisit({ ownerWallet: owner, visitorKey: key, seal, message: visitMessage(req.body?.message) });
      res.status(201).json({ visit, persistent: store.persistent });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}
