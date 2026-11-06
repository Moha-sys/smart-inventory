import React from 'react';
import { useI18n } from '../i18n.jsx';
import { useTheme } from '../theme.jsx';
import { Globe, Moon, Monitor, Sun } from './Icons.jsx';

export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="segmented" role="group" aria-label={t('settings.language')}>
      <Globe width={15} height={15} />
      <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'} lang="en">EN</button>
      <button className={lang === 'ar' ? 'on' : ''} onClick={() => setLang('ar')} aria-pressed={lang === 'ar'} lang="ar">عربي</button>
    </div>
  );
}

export function ThemeSwitch() {
  const { mode, setMode } = useTheme();
  const { t } = useI18n();
  const opts = [
    ['light', Sun],
    ['system', Monitor],
    ['dark', Moon],
  ];
  return (
    <div className="segmented" role="group" aria-label={t('settings.theme')}>
      {opts.map(([m, Icon]) => (
        <button key={m} className={`icon ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)} aria-pressed={mode === m} title={t(`theme.${m}`)} aria-label={t(`theme.${m}`)}>
          <Icon width={15} height={15} />
        </button>
      ))}
    </div>
  );
}
