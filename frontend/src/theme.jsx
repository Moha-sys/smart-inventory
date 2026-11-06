import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const MODES = ['light', 'dark', 'system'];

function initialMode() {
  try {
    const saved = localStorage.getItem('si-theme');
    if (MODES.includes(saved)) return saved;
  } catch {}
  return 'system';
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(initialMode);
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    try { localStorage.setItem('si-theme', mode); } catch {}
  }, [mode, resolved]);

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
