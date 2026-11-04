import { useState } from 'react';

import { colors } from '@/constants/theme';
import todEn from '@/data/truthordare-en.json';
import todFr from '@/data/truthordare-fr.json';
import { byLanguage, shuffle } from '@/utils/random';

export type TodLevel = 'normal' | 'couple' | 'spicy' | 'adult';
export type TodKind = 'truth' | 'dare';
export const TOD_LEVELS: TodLevel[] = ['normal', 'couple', 'spicy', 'adult'];
/** Niveaux qui demandent de confirmer avoir plus de 18 ans. */
export const TOD_ADULT_LEVELS: TodLevel[] = ['spicy', 'adult'];
/** Niveaux autorisés en mode filtre caméra (rien de coquin sur TikTok / Insta). */
export const TOD_FILTER_LEVELS: TodLevel[] = ['normal', 'couple'];
export const TOD_LEVEL_COLORS: Record<TodLevel, string> = { normal: colors.cyan, couple: colors.lilac, spicy: colors.peach, adult: colors.pink };
export const TOD_KIND_COLORS: Record<TodKind, string> = { truth: colors.cyan, dare: colors.pink };

type Key = `${TodLevel}.${TodKind}`;

/** Paquets mélangés pour chaque niveau et type, qui se remélangent quand ils sont épuisés. */
export function useTodDecks(language: string) {
  const content = byLanguage(language, { fr: todFr, en: todEn });
  const [decks, setDecks] = useState(() => {
    const all = {} as Record<Key, { cards: string[]; next: number }>;
    for (const level of TOD_LEVELS) {
      for (const kind of ['truth', 'dare'] as const) {
        all[`${level}.${kind}`] = { cards: shuffle(content[level][kind]), next: 0 };
      }
    }
    return all;
  });

  const draw = (level: TodLevel, kind: TodKind): string => {
    const key: Key = `${level}.${kind}`;
    const deck = decks[key];
    const exhausted = deck.next >= deck.cards.length;
    const cards = exhausted ? shuffle(content[level][kind]) : deck.cards;
    const index = exhausted ? 0 : deck.next;
    setDecks((prev) => ({ ...prev, [key]: { cards, next: index + 1 } }));
    return cards[index];
  };

  return draw;
}

/** Durée en secondes indiquée dans une action (« pendant 1 minute », « 30 seconds »…), ou null. */
export function parseDuration(text: string): number | null {
  const seconds = text.match(/(\d+)[\s-]*(?:secondes?|seconds?)\b/i);
  if (seconds) return Number(seconds[1]);
  const minutes = text.match(/(\d+)[\s-]*(?:minutes?|min)\b/i);
  if (minutes) return Number(minutes[1]) * 60;
  if (/\b(?:d'une|une|one)[\s-]minute\b/i.test(text)) return 60;
  return null;
}
