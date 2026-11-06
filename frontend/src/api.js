async function request(base, path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const inv = (path, opts) => request('/api/inventory', path, opts);
const alr = (path, opts) => request('/api/alerts', path, opts);

export const api = {
  listItems: (search = '') => inv(`/items${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createItem: (item) => inv('/items', { method: 'POST', body: JSON.stringify(item) }),
  updateItem: (id, item) => inv(`/items/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  adjust: (id, delta, reason) => inv(`/items/${id}/adjust`, { method: 'POST', body: JSON.stringify({ delta, reason }) }),
  deleteItem: (id) => inv(`/items/${id}`, { method: 'DELETE' }),
  summary: () => inv('/reports/summary'),
  movements: () => inv('/reports/movements'),
  alerts: (status = 'active') => alr(`/alerts?status=${status}`),
  checkAlerts: () => alr('/alerts/check', { method: 'POST' }),
};

export function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
