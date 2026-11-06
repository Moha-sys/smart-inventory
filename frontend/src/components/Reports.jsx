import React from 'react';
import { downloadCsv } from '../api.js';
import { useI18n } from '../i18n.jsx';
import { Download } from './Icons.jsx';

export default function Reports({ summary, items }) {
  const { t, fmt } = useI18n();
  if (!summary) return <p className="muted">{t('common.loading')}</p>;
  const maxValue = Math.max(1, ...summary.by_category.map((c) => c.value));

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h2>{t('reports.byCategory')}</h2>
          <button className="btn" onClick={() => downloadCsv('inventory.csv', items)}><Download width={15} height={15} />{t('reports.export')}</button>
        </div>
        {summary.by_category.length === 0 && <p className="muted">{t('reports.noData')}</p>}
        {summary.by_category.map((c) => (
          <div key={c.category} className="bar-row">
            <span className="bar-label">{c.category}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(c.value / maxValue) * 100}%` }} />
            </div>
            <span className="bar-value">{fmt.currency(c.value)} · {fmt.number(c.units)} {t('common.units')}</span>
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="panel-head"><h2>{t('reports.movements')}</h2></div>
        {summary.movements.length === 0 ? (
          <p className="muted">{t('reports.noMovements')}</p>
        ) : (
          <div className="table-wrap flat">
            <table>
              <thead><tr><th>{t('reports.day')}</th><th className="num">{t('reports.in')}</th><th className="num">{t('reports.out')}</th></tr></thead>
              <tbody>
                {summary.movements.map((m) => (
                  <tr key={m.day}>
                    <td>{fmt.date(String(m.day).slice(0, 10))}</td>
                    <td className="num in">+{fmt.number(m.stock_in)}</td>
                    <td className="num out">−{fmt.number(m.stock_out)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
