import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-selector-container">
      <div className="language-selector-wrapper">
        <label htmlFor="language-select" className="language-label">
          {t('language')}:
        </label>
        <select
          id="language-select"
          className="language-select"
          value={i18n.language}
          onChange={e => changeLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
    </div>
  );
};

export default LanguageSelector;
