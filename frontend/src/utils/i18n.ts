import tr from "../i18n/tr.json";

type TranslationParams = Record<string, string | number>;

export const t = (key: keyof typeof tr | string, params?: TranslationParams) => {
  const template = (tr as Record<string, string>)[key] ?? key;
  if (!params) return template;
  return Object.entries(params).reduce((acc, [paramKey, value]) => {
    return acc.replace(`{${paramKey}}`, String(value));
  }, template);
};
