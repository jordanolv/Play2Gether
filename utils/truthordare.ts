import { useState } from 'react';

import { colors } from '@/constants/theme';
import todEn from '@/data/truthordare-en.json';
import todFr from '@/data/truthordare-fr.json';
import { Gender } from '@/utils/couple';
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

/** Joueur dont c'est le tour (p) et son ou sa partenaire (o). */
export interface TodPlayers {
  player: { name: string; gender: Gender | null };
  other: { name: string; gender: Gender | null };
}

/*
 * Syntaxe des cartes :
 * - « @o:f », « @o:m », « @p:f », « @p:m » en tête : carte réservée à ce sexe (o = partenaire, p = joueur).
 * - « [o:féminin|masculin] », « [p:féminin|masculin] » : accord selon le sexe.
 * - « {o} », « {p} » : prénom du ou de la partenaire, du joueur.
 */
const TAG = /^@([po]):([fm])\s+/;

function parseTags(text: string) {
  const tags: { who: 'p' | 'o'; gender: Gender }[] = [];
  let rest = text;
  for (let m = rest.match(TAG); m; m = rest.match(TAG)) {
    tags.push({ who: m[1] as 'p' | 'o', gender: m[2] as Gender });
    rest = rest.slice(m[0].length);
  }
  return { tags, rest };
}

/** La carte convient-elle à ce couple ? */
export function fitsPlayers(text: string, players: TodPlayers): boolean {
  return parseTags(text).tags.every(({ who, gender }) => {
    const actual = (who === 'p' ? players.player : players.other).gender;
    return actual === null || actual === gender;
  });
}

/** Remplace prénoms et accords dans une carte. */
export function renderCard(text: string, players: TodPlayers): string {
  return parseTags(text)
    .rest.replace(/\[([po]):([^|\]]*)\|([^\]]*)\]/g, (_, who: string, fem: string, masc: string) =>
      (who === 'p' ? players.player : players.other).gender === 'm' ? masc : fem
    )
    .replace(/\{o\}/g, players.other.name)
    .replace(/\{p\}/g, players.player.name);
}

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

  /** Tire la prochaine carte qui convient au couple, déjà personnalisée. */
  const draw = (level: TodLevel, kind: TodKind, players: TodPlayers): string => {
    const key: Key = `${level}.${kind}`;
    let { cards, next } = decks[key];
    let index = cards.findIndex((card, i) => i >= next && fitsPlayers(card, players));
    if (index === -1) {
      cards = shuffle(content[level][kind]);
      index = Math.max(0, cards.findIndex((card) => fitsPlayers(card, players)));
    }
    next = index + 1;
    setDecks((prev) => ({ ...prev, [key]: { cards, next } }));
    return renderCard(cards[index], players);
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
