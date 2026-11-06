import React from 'react';
import { useI18n } from '../i18n.jsx';
import { Alert, Box, Chart, Inbox, List } from './Icons.jsx';

export default function Summary({ summary }) {
  const { t, fmt } = useI18n();
  if (!summary) return <p className="muted">{t('common.loading')}</p>;
  const cards = [
    { key: 'products', icon: Box, label: t('summary.products'), value: fmt.number(summary.total_items) },
    { key: 'units', icon: List, label: t('summary.units'), value: fmt.number(summary.total_units) },
    { key: 'value', icon: Chart, label: t('summary.value'), value: fmt.currency(summary.total_value) },
    { key: 'low', icon: Alert, label: t('summary.low'), value: fmt.number(summary.low_stock), tone: summary.low_stock > 0 ? 'warn' : '' },
    { key: 'out', icon: Inbox, label: t('summary.out'), value: fmt.number(summary.out_of_stock), tone: summary.out_of_stock > 0 ? 'danger' : '' },
  ];
  return (
    <section className="cards">
      {cards.map(({ key, icon: Icon, label, value, tone }) => (
        <div key={key} className={`card ${tone || ''}`}>
          <span className="card-icon"><Icon /></span>
          <div className="card-value">{value}</div>
          <div className="card-label">{label}</div>
        </div>
      ))}
    </section>
  );
}
