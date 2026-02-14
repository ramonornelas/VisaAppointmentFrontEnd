import React from "react";
import { useTranslation } from "react-i18next";
import { Select } from "antd";
import "./LanguageSelector.css";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language?.split("-")[0] || "en";
  const value = LANGUAGE_OPTIONS.some((o) => o.value === currentLanguage)
    ? currentLanguage
    : "en";

  return (
    <div className="language-selector-container">
      <div className="language-selector-wrapper">
        <Select
          id="language-select"
          className="language-select-antd"
          value={value}
          onChange={changeLanguage}
          options={LANGUAGE_OPTIONS}
          style={{ minWidth: 100 }}
        />
      </div>
    </div>
  );
};

export default LanguageSelector;
