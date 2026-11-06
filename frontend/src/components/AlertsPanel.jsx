import React from 'react';
import { useI18n } from '../i18n.jsx';
import { Check, Refresh } from './Icons.jsx';

export default function AlertsPanel({ alerts, onCheck, compact }) {
  const { t, fmt } = useI18n();
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{compact ? t('alerts.latest') : t('alerts.active')}</h2>
        {onCheck && (
          <button className="btn" onClick={onCheck}><Refresh width={15} height={15} />{t('alerts.checkNow')}</button>
        )}
      </div>
      {alerts.length === 0 ? (
        <div className="empty"><span className="empty-icon ok"><Check /></span><p>{t('alerts.none')}</p></div>
      ) : (
        <ul className="alerts">
          {alerts.map((a) => (
            <li key={a.id} className={a.severity}>
              <span className={`dot ${a.severity === 'critical' ? 'danger' : 'warn'}`} />
              <div className="alert-main">
                <strong>{a.name}</strong>
                <span className="muted sku">{a.sku}</span>
              </div>
              <span className="muted alert-qty">{t('alerts.left', { qty: fmt.number(a.quantity), level: fmt.number(a.reorder_level) })}</span>
              <span className={`pill ${a.severity === 'critical' ? 'danger' : 'warn'}`}>{t(`severity.${a.severity}`)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
