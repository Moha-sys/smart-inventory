const express = require('express');
const cors = require('cors');
const client = require('prom-client');
const { Pool } = require('pg');

const INVENTORY_URL = process.env.INVENTORY_URL || 'http://localhost:3000';
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 15000);
const WEBHOOK_URL = process.env.WEBHOOK_URL || ''; // optional: Slack/Teams/any webhook

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'inventory',
  password: process.env.DB_PASSWORD || 'inventory',
  database: process.env.DB_NAME || 'inventory',
});

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Metrics ----------
client.collectDefaultMetrics({ prefix: 'alert_' });
const activeAlerts = new client.Gauge({ name: 'alert_active_total', help: 'Unresolved alerts' });
const alertsRaised = new client.Counter({ name: 'alert_raised_total', help: 'Alerts raised', labelNames: ['severity'] });
const pollFailures = new client.Counter({ name: 'alert_poll_failures_total', help: 'Failed polls of inventory service' });

async function init(retries = 15) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS alerts (
          id SERIAL PRIMARY KEY,
          item_id INTEGER NOT NULL,
          sku TEXT NOT NULL,
          name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          reorder_level INTEGER NOT NULL,
          severity TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          resolved_at TIMESTAMPTZ
        );
        CREATE UNIQUE INDEX IF NOT EXISTS one_active_alert_per_item
          ON alerts (item_id) WHERE status = 'active';
      `);
      return;
    } catch (err) {
      console.log(`DB not ready (${err.message}), retry ${i + 1}/${retries}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('Could not connect to database');
}

async function notify(alert) {
  console.log(`[ALERT:${alert.severity}] ${alert.name} (${alert.sku}) qty=${alert.quantity} <= ${alert.reorder_level}`);
  if (!WEBHOOK_URL) return;
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `Low stock (${alert.severity}): ${alert.name} [${alert.sku}] has ${alert.quantity} left (reorder level ${alert.reorder_level})`,
      }),
    });
  } catch (err) {
    console.error('Webhook failed:', err.message);
  }
}

async function poll() {
  try {
    const res = await fetch(`${INVENTORY_URL}/low-stock`);
    if (!res.ok) throw new Error(`inventory responded ${res.status}`);
    const lowItems = await res.json();
    const lowIds = lowItems.map((i) => i.id);

    for (const item of lowItems) {
      const severity = item.quantity === 0 ? 'critical' : 'warning';
      const { rows } = await pool.query(
        `INSERT INTO alerts (item_id, sku, name, quantity, reorder_level, severity)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (item_id) WHERE status = 'active'
         DO UPDATE SET quantity = EXCLUDED.quantity, severity = EXCLUDED.severity,
                       name = EXCLUDED.name, reorder_level = EXCLUDED.reorder_level
         RETURNING *, (xmax = 0) AS inserted`,
        [item.id, item.sku, item.name, item.quantity, item.reorder_level, severity]
      );
      if (rows[0].inserted) {
        alertsRaised.inc({ severity });
        await notify(rows[0]);
      }
    }

    // auto-resolve alerts for items that are restocked (or deleted)
    await pool.query(
      `UPDATE alerts SET status = 'resolved', resolved_at = now()
       WHERE status = 'active' AND NOT (item_id = ANY($1::int[]))`,
      [lowIds]
    );

    const { rows } = await pool.query("SELECT COUNT(*)::int AS c FROM alerts WHERE status = 'active'");
    activeAlerts.set(rows[0].c);
  } catch (err) {
    pollFailures.inc();
    console.error('Poll failed:', err.message);
  }
}

// ---------- Routes ----------
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.get('/alerts', async (req, res) => {
  try {
    const status = req.query.status || 'active';
    const { rows } = await pool.query(
      `SELECT * FROM alerts WHERE ($1 = 'all' OR status = $1)
       ORDER BY created_at DESC LIMIT 200`,
      [status]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/alerts/check', async (_req, res) => {
  await poll();
  res.json({ status: 'checked' });
});

const port = Number(process.env.PORT || 3001);
init()
  .then(() => {
    app.listen(port, () => console.log(`alert-service listening on ${port}`));
    poll();
    setInterval(poll, POLL_INTERVAL_MS);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
