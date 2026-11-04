import { useState } from 'react';

import { colors } from '@/constants/theme';
import todEn from '@/data/truthordare-en.json';
import todFr from '@/data/truthordare-fr.json';
import { byLanguage, shuffle } from '@/utils/random';

export type TodLevel = 'normal' | 'couple' | 'adult';
export type TodKind = 'truth' | 'dare';
export const TOD_LEVELS: TodLevel[] = ['normal', 'couple', 'adult'];
/** Niveaux autorisés en mode filtre caméra (pas d'adulte sur TikTok / Insta). */
export const TOD_FILTER_LEVELS: TodLevel[] = ['normal', 'couple'];
export const TOD_LEVEL_COLORS: Record<TodLevel, string> = { normal: colors.cyan, couple: colors.lilac, adult: colors.pink };
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
