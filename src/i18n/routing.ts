export const routing = {
  locales: ["pt-BR", "en"],
  defaultLocale: "pt-BR",
} as const;

export type Locale = typeof routing.locales[number];


