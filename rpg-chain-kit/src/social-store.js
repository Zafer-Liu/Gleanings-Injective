import crypto from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;

export function createSocialStore() {
  const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
  const memoryVisits = [];
  const memoryRelays = [];
  let initialized = false;

  async function initialize() {
    if (!pool || initialized) return;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gleanings_visits (
        id UUID PRIMARY KEY,
        owner_wallet TEXT NOT NULL,
        visitor_key TEXT NOT NULL,
        seal TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS gleanings_visits_owner_created
        ON gleanings_visits (owner_wallet, created_at DESC);
      CREATE TABLE IF NOT EXISTS gleanings_story_relays (
        id UUID PRIMARY KEY,
        owner_wallet TEXT NOT NULL,
        token_id TEXT NOT NULL,
        visitor_key TEXT NOT NULL,
        theme TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS gleanings_story_relays_token_created
        ON gleanings_story_relays (owner_wallet, token_id, created_at DESC);
    `);
    initialized = true;
  }

  function publicVisit(row) {
    return {
      id: row.id,
      seal: row.seal,
      message: row.message,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
    };
  }

  async function addVisit({ ownerWallet, visitorKey, seal, message }) {
    const id = crypto.randomUUID();
    if (!pool) {
      const row = { id, owner_wallet: ownerWallet, visitor_key: visitorKey, seal, message, created_at: new Date().toISOString() };
      memoryVisits.unshift(row);
      memoryVisits.splice(120);
      return publicVisit(row);
    }
    await initialize();
    const { rows } = await pool.query(
      `INSERT INTO gleanings_visits (id, owner_wallet, visitor_key, seal, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, seal, message, created_at`,
      [id, ownerWallet, visitorKey, seal, message]
    );
    return publicVisit(rows[0]);
  }

  async function listVisits(ownerWallet) {
    if (!pool) {
      return memoryVisits
        .filter((row) => row.owner_wallet.toLowerCase() === ownerWallet.toLowerCase())
        .slice(0, 12)
        .map(publicVisit);
    }
    await initialize();
    const { rows } = await pool.query(
      `SELECT id, seal, message, created_at
       FROM gleanings_visits
       WHERE lower(owner_wallet) = lower($1)
       ORDER BY created_at DESC
       LIMIT 12`,
      [ownerWallet]
    );
    return rows.map(publicVisit);
  }

  function publicRelay(row) {
    return {
      id: row.id,
      token_id: String(row.token_id),
      theme: row.theme,
      message: row.message,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
    };
  }

  async function addRelay({ ownerWallet, tokenId, visitorKey, theme, message }) {
    const id = crypto.randomUUID();
    if (!pool) {
      const row = { id, owner_wallet: ownerWallet, token_id: tokenId, visitor_key: visitorKey, theme, message, created_at: new Date().toISOString() };
      memoryRelays.unshift(row);
      memoryRelays.splice(240);
      return publicRelay(row);
    }
    await initialize();
    const { rows } = await pool.query(
      `INSERT INTO gleanings_story_relays (id, owner_wallet, token_id, visitor_key, theme, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, token_id, theme, message, created_at`,
      [id, ownerWallet, tokenId, visitorKey, theme, message]
    );
    return publicRelay(rows[0]);
  }

  async function listRelays(ownerWallet) {
    if (!pool) {
      return memoryRelays
        .filter((row) => row.owner_wallet.toLowerCase() === ownerWallet.toLowerCase())
        .slice(0, 48)
        .map(publicRelay);
    }
    await initialize();
    const { rows } = await pool.query(
      `SELECT id, token_id, theme, message, created_at
       FROM gleanings_story_relays
       WHERE lower(owner_wallet) = lower($1)
       ORDER BY created_at DESC
       LIMIT 48`,
      [ownerWallet]
    );
    return rows.map(publicRelay);
  }

  return { addVisit, listVisits, addRelay, listRelays, persistent: Boolean(pool) };
}
