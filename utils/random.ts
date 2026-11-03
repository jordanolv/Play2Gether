/** Mélange de Fisher-Yates (sans muter la liste d'origine). */
export function shuffle<T>(list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pickRandom<T>(list: readonly T[], count: number): T[] {
  return shuffle(list).slice(0, count);
}

/** Choisit le contenu selon la langue, en retombant sur le français. */
export function byLanguage<T>(language: string, content: { fr: T; en: T }): T {
  return language === 'en' ? content.en : content.fr;
}
