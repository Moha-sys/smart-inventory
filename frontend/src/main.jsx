import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { I18nProvider } from './i18n.jsx';
import { ThemeProvider } from './theme.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <I18nProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </I18nProvider>,
);
