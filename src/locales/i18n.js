import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import es from "./es.json";

const resources = {
  en: { translation: en },
  es: { translation: es },
};

// Get saved language from localStorage or use 'es' as default
const savedLanguage = localStorage.getItem("fastVisa_language") || "es";

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: "es",
  interpolation: {
    escapeValue: false,
  },
});

// Save language to localStorage whenever it changes
i18n.on("languageChanged", (lng) => {
  localStorage.setItem("fastVisa_language", lng);
});

export default i18n;
