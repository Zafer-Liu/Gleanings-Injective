import crypto from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;

export function createSocialStore() {
  const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
  const memoryVisits = [];
  const memoryVotes = new Map();
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
      CREATE TABLE IF NOT EXISTS gleanings_exhibit_votes (
        owner_wallet TEXT NOT NULL,
        visitor_key TEXT NOT NULL,
        token_id TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (owner_wallet, visitor_key)
      );
      CREATE INDEX IF NOT EXISTS gleanings_exhibit_votes_owner_token
        ON gleanings_exhibit_votes (owner_wallet, token_id);
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

  function voteSummary(rows) {
    return rows.reduce((summary, row) => {
      const tokenId = String(row.token_id);
      summary[tokenId] = Number(row.votes);
      return summary;
    }, {});
  }

  async function castVote({ ownerWallet, visitorKey, tokenId }) {
    if (!pool) {
      memoryVotes.set(`${ownerWallet.toLowerCase()}:${visitorKey}`, { owner_wallet: ownerWallet, visitor_key: visitorKey, token_id: tokenId });
      return listVotes(ownerWallet);
    }
    await initialize();
    await pool.query(
      `INSERT INTO gleanings_exhibit_votes (owner_wallet, visitor_key, token_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (owner_wallet, visitor_key)
       DO UPDATE SET token_id = EXCLUDED.token_id, updated_at = NOW()`,
      [ownerWallet, visitorKey, tokenId]
    );
    return listVotes(ownerWallet);
  }

  async function listVotes(ownerWallet) {
    if (!pool) {
      const rows = [...memoryVotes.values()]
        .filter((row) => row.owner_wallet.toLowerCase() === ownerWallet.toLowerCase())
        .reduce((counts, row) => {
          counts[row.token_id] = (counts[row.token_id] || 0) + 1;
          return counts;
        }, {});
      return rows;
    }
    await initialize();
    const { rows } = await pool.query(
      `SELECT token_id, COUNT(*)::int AS votes
       FROM gleanings_exhibit_votes
       WHERE lower(owner_wallet) = lower($1)
       GROUP BY token_id`,
      [ownerWallet]
    );
    return voteSummary(rows);
  }

  return { addVisit, listVisits, castVote, listVotes, persistent: Boolean(pool) };
}
