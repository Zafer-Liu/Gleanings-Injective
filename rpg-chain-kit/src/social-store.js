import crypto from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;

export function createSocialStore() {
  const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
  const memoryVisits = [];
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

  return { addVisit, listVisits, persistent: Boolean(pool) };
}
