// src/utils/countries.js
// Shared country data for user management and applicant forms

export const COUNTRIES_DATA = [
  { value: "es-ar", labelKey: "countryArgentina", flag: "🇦🇷" },
  { value: "es-bo", labelKey: "countryBolivia", flag: "🇧🇴" },
  { value: "es-br", labelKey: "countryBrazil", flag: "🇧🇷" },
  { value: "es-cl", labelKey: "countryChile", flag: "🇨🇱" },
  { value: "es-co", labelKey: "countryColombia", flag: "🇨🇴" },
  { value: "es-cr", labelKey: "countryCostaRica", flag: "🇨🇷" },
  { value: "es-cu", labelKey: "countryCuba", flag: "🇨🇺" },
  { value: "es-do", labelKey: "countryDominicanRepublic", flag: "🇩🇴" },
  { value: "es-ec", labelKey: "countryEcuador", flag: "🇪🇨" },
  { value: "es-sv", labelKey: "countryElSalvador", flag: "🇸🇻" },
  { value: "es-gt", labelKey: "countryGuatemala", flag: "🇬🇹" },
  { value: "es-hn", labelKey: "countryHonduras", flag: "🇭🇳" },
  { value: "es-mx", labelKey: "countryMexico", flag: "🇲🇽" },
  { value: "es-ni", labelKey: "countryNicaragua", flag: "🇳🇮" },
  { value: "es-pa", labelKey: "countryPanama", flag: "🇵🇦" },
  { value: "es-py", labelKey: "countryParaguay", flag: "🇵🇾" },
  { value: "es-pe", labelKey: "countryPeru", flag: "🇵🇪" },
  { value: "es-uy", labelKey: "countryUruguay", flag: "🇺🇾" },
  { value: "es-ve", labelKey: "countryVenezuela", flag: "🇻🇪" },
];

// Helper function to get translated countries list
export const getTranslatedCountries = (t) => {
  return COUNTRIES_DATA.map(country => ({
    value: country.value,
    label: t(country.labelKey, country.labelKey.replace('country', '')),
    flag: country.flag
  })).sort((a, b) => a.label.localeCompare(b.label));
};

// For backward compatibility - exports countries with English labels
export const ALL_COUNTRIES = [
  { value: "es-ar", label: "Argentina", flag: "🇦🇷" },
  { value: "es-bo", label: "Bolivia", flag: "🇧🇴" },
  { value: "es-br", label: "Brazil", flag: "🇧🇷" },
  { value: "es-cl", label: "Chile", flag: "🇨🇱" },
  { value: "es-co", label: "Colombia", flag: "🇨🇴" },
  { value: "es-cr", label: "Costa Rica", flag: "🇨🇷" },
  { value: "es-cu", label: "Cuba", flag: "🇨🇺" },
  { value: "es-do", label: "Dominican Republic", flag: "🇩🇴" },
  { value: "es-ec", label: "Ecuador", flag: "🇪🇨" },
  { value: "es-sv", label: "El Salvador", flag: "🇸🇻" },
  { value: "es-gt", label: "Guatemala", flag: "🇬🇹" },
  { value: "es-hn", label: "Honduras", flag: "🇭🇳" },
  { value: "es-mx", label: "Mexico", flag: "🇲🇽" },
  { value: "es-ni", label: "Nicaragua", flag: "🇳🇮" },
  { value: "es-pa", label: "Panama", flag: "🇵🇦" },
  { value: "es-py", label: "Paraguay", flag: "🇵🇾" },
  { value: "es-pe", label: "Peru", flag: "🇵🇪" },
  { value: "es-uy", label: "Uruguay", flag: "🇺🇾" },
  { value: "es-ve", label: "Venezuela", flag: "🇻🇪" },
];
