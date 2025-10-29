import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0.5rem 1.2rem',
        background: '#f7f7fa',
        borderRadius: '10px',
        border: '1px solid #e0e0e0',
        marginBottom: '0.75rem',
        minHeight: '44px',
        maxWidth: '260px',
        marginLeft: 'auto',
        marginRight: '2.5rem',
        marginTop: '1.2rem'
      }}
    >
      <label
        htmlFor="language-select"
        style={{
          fontWeight: 500,
          fontSize: '0.95rem',
          marginRight: '0.5rem',
          color: '#444',
          letterSpacing: '0.01em'
        }}
      >
        {t('language')}:
      </label>
      <select
        id="language-select"
        value={i18n.language}
        onChange={e => changeLanguage(e.target.value)}
        style={{
          fontSize: '0.95rem',
          padding: '0.2rem 0.7rem',
          borderRadius: '4px',
          border: '1px solid #ccc',
          background: '#fff',
          color: '#222',
          fontWeight: 400,
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
