import translations from "../i18n/tr.json";

export const t = (key: string, params?: Record<string, string | number>) => {
  const template = (translations as Record<string, string>)[key] ?? key;
  if (!params) return template;
  return Object.entries(params).reduce((acc, [paramKey, value]) => {
    return acc.replace(`{${paramKey}}`, String(value)).replace(`%{${paramKey}}`, String(value));
  }, template);
};
