const express = require('express');
const cors = require('cors');
const client = require('prom-client');
const { pool, init } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Prometheus metrics ----------
client.collectDefaultMetrics({ prefix: 'inventory_' });

const httpDuration = new client.Histogram({
  name: 'inventory_http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
});
const totalItems = new client.Gauge({ name: 'inventory_items_total', help: 'Number of distinct items' });
const lowStockItems = new client.Gauge({ name: 'inventory_low_stock_items', help: 'Items at or below reorder level' });
const stockValue = new client.Gauge({ name: 'inventory_stock_value', help: 'Total stock value' });
const stockMovements = new client.Counter({
  name: 'inventory_stock_movements_total',
  help: 'Stock adjustments',
  labelNames: ['direction'],
});

app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route ? req.route.path : req.path, status: res.statusCode });
  });
  next();
});

async function refreshGauges() {
  const { rows } = await pool.query(`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE quantity <= reorder_level)::int AS low,
           COALESCE(SUM(quantity * unit_price), 0)::float AS value
    FROM items`);
  totalItems.set(rows[0].total);
  lowStockItems.set(rows[0].low);
  stockValue.set(rows[0].value);
}

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'SKU already exists' });
    if (err.code === '23514') return res.status(400).json({ error: 'Quantity cannot go below zero' });
    res.status(500).json({ error: 'Internal server error' });
  });

// ---------- Health & metrics ----------
app.get('/health', wrap(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok' });
}));

app.get('/metrics', wrap(async (_req, res) => {
  await refreshGauges();
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
}));

// ---------- Items ----------
app.get('/items', wrap(async (req, res) => {
  const { search, category } = req.query;
  const params = [];
  let where = 'WHERE 1=1';
  if (search) {
    params.push(`%${search}%`);
    where += ` AND (name ILIKE $${params.length} OR sku ILIKE $${params.length})`;
  }
  if (category) {
    params.push(category);
    where += ` AND category = $${params.length}`;
  }
  const { rows } = await pool.query(`SELECT * FROM items ${where} ORDER BY name`, params);
  res.json(rows);
}));

app.get('/items/:id', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM items WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}));

app.post('/items', wrap(async (req, res) => {
  const { sku, name, category = 'General', quantity = 0, reorder_level = 10, unit_price = 0 } = req.body;
  if (!sku || !name) return res.status(400).json({ error: 'sku and name are required' });
  const { rows } = await pool.query(
    `INSERT INTO items (sku, name, category, quantity, reorder_level, unit_price)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [sku, name, category, quantity, reorder_level, unit_price]
  );
  res.status(201).json(rows[0]);
}));

app.put('/items/:id', wrap(async (req, res) => {
  const { name, category, reorder_level, unit_price } = req.body;
  const { rows } = await pool.query(
    `UPDATE items SET
       name = COALESCE($1, name),
       category = COALESCE($2, category),
       reorder_level = COALESCE($3, reorder_level),
       unit_price = COALESCE($4, unit_price),
       updated_at = now()
     WHERE id = $5 RETURNING *`,
    [name, category, reorder_level, unit_price, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}));

app.post('/items/:id/adjust', wrap(async (req, res) => {
  const delta = Number(req.body.delta);
  if (!Number.isInteger(delta) || delta === 0) {
    return res.status(400).json({ error: 'delta must be a non-zero integer' });
  }
  const conn = await pool.connect();
  try {
    await conn.query('BEGIN');
    const { rows } = await conn.query(
      'UPDATE items SET quantity = quantity + $1, updated_at = now() WHERE id = $2 RETURNING *',
      [delta, req.params.id]
    );
    if (!rows[0]) {
      await conn.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }
    await conn.query('INSERT INTO stock_movements (item_id, delta, reason) VALUES ($1,$2,$3)', [
      req.params.id, delta, req.body.reason || null,
    ]);
    await conn.query('COMMIT');
    stockMovements.inc({ direction: delta > 0 ? 'in' : 'out' }, Math.abs(delta));
    res.json(rows[0]);
  } catch (err) {
    await conn.query('ROLLBACK');
    throw err;
  } finally {
    conn.release();
  }
}));

app.delete('/items/:id', wrap(async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM items WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
}));

// ---------- Low stock & reports ----------
app.get('/low-stock', wrap(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM items WHERE quantity <= reorder_level ORDER BY quantity ASC');
  res.json(rows);
}));

app.get('/reports/summary', wrap(async (_req, res) => {
  const totals = await pool.query(`
    SELECT COUNT(*)::int AS total_items,
           COALESCE(SUM(quantity),0)::int AS total_units,
           COALESCE(SUM(quantity * unit_price),0)::float AS total_value,
           COUNT(*) FILTER (WHERE quantity <= reorder_level)::int AS low_stock,
           COUNT(*) FILTER (WHERE quantity = 0)::int AS out_of_stock
    FROM items`);
  const byCategory = await pool.query(`
    SELECT category, COUNT(*)::int AS items, COALESCE(SUM(quantity),0)::int AS units,
           COALESCE(SUM(quantity * unit_price),0)::float AS value
    FROM items GROUP BY category ORDER BY value DESC`);
  const movements = await pool.query(`
    SELECT to_char(created_at, 'YYYY-MM-DD') AS day,
           COALESCE(SUM(delta) FILTER (WHERE delta > 0),0)::int AS stock_in,
           COALESCE(-SUM(delta) FILTER (WHERE delta < 0),0)::int AS stock_out
    FROM stock_movements
    WHERE created_at > now() - interval '14 days'
    GROUP BY 1 ORDER BY 1`);
  res.json({ ...totals.rows[0], by_category: byCategory.rows, movements: movements.rows });
}));

app.get('/reports/movements', wrap(async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT m.id, m.delta, m.reason, m.created_at, i.sku, i.name
    FROM stock_movements m JOIN items i ON i.id = m.item_id
    ORDER BY m.created_at DESC LIMIT 100`);
  res.json(rows);
}));

// ---------- Start ----------
const port = Number(process.env.PORT || 3000);
init()
  .then(() => app.listen(port, () => console.log(`inventory-service listening on ${port}`)))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
