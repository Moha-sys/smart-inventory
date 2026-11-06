const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'inventory',
  password: process.env.DB_PASSWORD || 'inventory',
  database: process.env.DB_NAME || 'inventory',
});

async function init(retries = 15) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS items (
          id SERIAL PRIMARY KEY,
          sku TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'General',
          quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
          reorder_level INTEGER NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
          unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS stock_movements (
          id SERIAL PRIMARY KEY,
          item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
          delta INTEGER NOT NULL,
          reason TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
      return;
    } catch (err) {
      console.log(`DB not ready (${err.message}), retry ${i + 1}/${retries}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('Could not connect to database');
}

module.exports = { pool, init };
