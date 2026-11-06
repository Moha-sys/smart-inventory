import React, { useEffect, useRef } from 'react';
import { useI18n } from '../i18n.jsx';

export default function Modal({ title, children, onClose, onSubmit, submitLabel, danger }) {
  const { t } = useI18n();
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector('input')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      >
        <h2>{title}</h2>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button type="submit" className={`btn ${danger ? 'danger' : 'primary'}`}>{submitLabel || t('common.confirm')}</button>
        </div>
      </form>
    </div>
  );
}
