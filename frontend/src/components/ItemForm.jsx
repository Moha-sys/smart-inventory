import React, { useState } from 'react';
import { useI18n } from '../i18n.jsx';

const empty = { sku: '', name: '', category: 'General', quantity: 0, reorder_level: 10, unit_price: 0 };

export default function ItemForm({ onSave, onCancel }) {
  const { t } = useI18n();
  const [form, setForm] = useState(empty);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      quantity: Number(form.quantity),
      reorder_level: Number(form.reorder_level),
      unit_price: Number(form.unit_price),
    });
  };

  return (
    <form className="panel form" onSubmit={submit}>
      <h2 className="form-title">{t('items.newItem')}</h2>
      <label>{t('items.sku')}<input required value={form.sku} onChange={set('sku')} dir="ltr" /></label>
      <label>{t('items.name')}<input required value={form.name} onChange={set('name')} /></label>
      <label>{t('items.category')}<input value={form.category} onChange={set('category')} /></label>
      <label>{t('items.qty')}<input type="number" min="0" value={form.quantity} onChange={set('quantity')} /></label>
      <label>{t('items.reorderLevel')}<input type="number" min="0" value={form.reorder_level} onChange={set('reorder_level')} /></label>
      <label>{t('items.unitPrice')}<input type="number" min="0" step="0.01" value={form.unit_price} onChange={set('unit_price')} /></label>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>{t('common.cancel')}</button>
        <button type="submit" className="btn primary">{t('common.save')}</button>
      </div>
    </form>
  );
}
