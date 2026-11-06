import React, { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { useI18n } from './i18n.jsx';
import Summary from './components/Summary.jsx';
import ItemsTable from './components/ItemsTable.jsx';
import ItemForm from './components/ItemForm.jsx';
import AlertsPanel from './components/AlertsPanel.jsx';
import Reports from './components/Reports.jsx';
import { LanguageSwitch, ThemeSwitch } from './components/Controls.jsx';
import { Alert, Bell, Box, Chart, Grid, List, Plus, Search } from './components/Icons.jsx';

const TABS = [
  { id: 'overview', icon: Grid },
  { id: 'items', icon: List },
  { id: 'alerts', icon: Bell },
  { id: 'reports', icon: Chart },
];

export default function App() {
  const { t, fmt } = useI18n();
  const [tab, setTab] = useState('overview');
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [i, s, a] = await Promise.all([api.listItems(search), api.summary(), api.alerts()]);
      setItems(i);
      setSummary(s);
      setAlerts(a);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [search]);

  // Real-time-ish: poll every 5 seconds
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  const run = async (fn) => {
    try {
      await fn();
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo"><Box width={22} height={22} /></span>
          <div>
            <h1>{t('appName')}</h1>
            <p className="tagline">{t('appTagline')}</p>
          </div>
        </div>
        <div className="top-actions">
          <LanguageSwitch />
          <ThemeSwitch />
        </div>
      </header>

      <nav className="tabs" aria-label="Sections">
        {TABS.map(({ id, icon: Icon }) => (
          <button key={id} className={id === tab ? 'active' : ''} onClick={() => setTab(id)} aria-current={id === tab ? 'page' : undefined}>
            <Icon width={17} height={17} />
            <span>{t(`tab.${id}`)}</span>
            {id === 'alerts' && alerts.length > 0 && <span className="badge">{fmt.number(alerts.length)}</span>}
          </button>
        ))}
      </nav>

      {error && <div className="error" role="alert"><Alert width={18} height={18} />{error}</div>}

      <main>
        {tab === 'overview' && (
          <>
            <Summary summary={summary} />
            <AlertsPanel alerts={alerts.slice(0, 5)} compact />
          </>
        )}

        {tab === 'items' && (
          <>
            <div className="toolbar">
              <div className="search">
                <Search width={17} height={17} />
                <input
                  type="search"
                  placeholder={t('items.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="btn primary" onClick={() => setShowForm(true)}><Plus width={16} height={16} />{t('items.add')}</button>
            </div>
            {showForm && (
              <ItemForm
                onCancel={() => setShowForm(false)}
                onSave={(item) => run(async () => { await api.createItem(item); setShowForm(false); })}
              />
            )}
            <ItemsTable
              items={items}
              searching={!!search}
              onAdjust={(id, delta, reason) => run(() => api.adjust(id, delta, reason))}
              onDelete={(id) => run(() => api.deleteItem(id))}
            />
          </>
        )}

        {tab === 'alerts' && <AlertsPanel alerts={alerts} onCheck={() => run(api.checkAlerts)} />}
        {tab === 'reports' && <Reports summary={summary} items={items} />}
      </main>
    </div>
  );
}
