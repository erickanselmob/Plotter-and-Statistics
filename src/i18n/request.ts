export async function getMessages(locale: string) {
  const supported = ["pt-BR", "en"] as const;
  const chosen = supported.includes(locale as any) ? locale : "pt-BR";
  const mod = await import(`./messages/${chosen}.json`);
  return mod.default as Record<string, any>;
}


