import React, { useState } from 'react';
import { useI18n } from '../i18n.jsx';
import Modal from './Modal.jsx';
import { Inbox, Minus, Plus, Trash } from './Icons.jsx';

function status(item) {
  if (item.quantity === 0) return { key: 'status.out', cls: 'danger' };
  if (item.quantity <= item.reorder_level) return { key: 'status.low', cls: 'warn' };
  return { key: 'status.ok', cls: 'ok' };
}

export default function ItemsTable({ items, searching, onAdjust, onDelete }) {
  const { t, fmt } = useI18n();
  const [adjusting, setAdjusting] = useState(null); // { item, sign }
  const [amount, setAmount] = useState('1');
  const [reason, setReason] = useState('');
  const [deleting, setDeleting] = useState(null);

  if (!items.length) {
    return (
      <div className="panel empty">
        <span className="empty-icon"><Inbox /></span>
        <p>{searching ? t('items.noResults') : t('items.empty')}</p>
      </div>
    );
  }

  const openAdjust = (item, sign) => {
    setAdjusting({ item, sign });
    setAmount('1');
    setReason(sign > 0 ? t('adjust.restock') : t('adjust.sale'));
  };

  const submitAdjust = () => {
    const n = parseInt(amount, 10);
    if (!Number.isInteger(n) || n <= 0) return;
    onAdjust(adjusting.item.id, adjusting.sign * n, reason.trim() || undefined);
    setAdjusting(null);
  };

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('items.sku')}</th><th>{t('items.name')}</th><th>{t('items.category')}</th>
              <th className="num">{t('items.qty')}</th><th className="num">{t('items.reorderAt')}</th>
              <th className="num">{t('items.price')}</th><th>{t('items.status')}</th><th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const s = status(item);
              return (
                <tr key={item.id}>
                  <td className="sku" dir="ltr">{item.sku}</td>
                  <td className="strong">{item.name}</td>
                  <td className="muted">{item.category}</td>
                  <td className="num strong">{fmt.number(item.quantity)}</td>
                  <td className="num muted">{fmt.number(item.reorder_level)}</td>
                  <td className="num">{fmt.currency(item.unit_price)}</td>
                  <td><span className={`pill ${s.cls}`}>{t(s.key)}</span></td>
                  <td className="actions">
                    <button className="btn icon-btn" onClick={() => openAdjust(item, 1)} title={t('items.addStock')} aria-label={t('items.addStock')}><Plus width={16} height={16} /></button>
                    <button className="btn icon-btn" onClick={() => openAdjust(item, -1)} title={t('items.removeStock')} aria-label={t('items.removeStock')}><Minus width={16} height={16} /></button>
                    <button className="btn icon-btn danger-text" onClick={() => setDeleting(item)} title={t('common.delete')} aria-label={t('common.delete')}><Trash width={16} height={16} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {adjusting && (
        <Modal
          title={`${adjusting.sign > 0 ? t('adjust.addTitle') : t('adjust.removeTitle')} — ${adjusting.item.name}`}
          onClose={() => setAdjusting(null)}
          onSubmit={submitAdjust}
          submitLabel={t('common.save')}
        >
          <p className="muted">{t('adjust.current')}: <strong>{fmt.number(adjusting.item.quantity)}</strong></p>
          <label className="field">{t('adjust.howMany')}
            <input type="number" min="1" step="1" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="field">{t('adjust.reason')}
            <input value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
        </Modal>
      )}

      {deleting && (
        <Modal
          title={t('delete.title')}
          danger
          submitLabel={t('common.delete')}
          onClose={() => setDeleting(null)}
          onSubmit={() => { onDelete(deleting.id); setDeleting(null); }}
        >
          <p>{t('delete.body', { name: deleting.name })}</p>
        </Modal>
      )}
    </>
  );
}
