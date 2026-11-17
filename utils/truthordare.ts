import { useState } from 'react';

import { colors } from '@/constants/theme';
import todEn from '@/data/truthordare-en.json';
import todFr from '@/data/truthordare-fr.json';
import { Gender } from '@/utils/couple';
import { byLanguage } from '@/utils/random';
import { drawOneFresh } from '@/utils/seen';

export type TodLevel = 'normal' | 'couple' | 'spicy';
export type TodKind = 'truth' | 'dare';
export const TOD_LEVELS: TodLevel[] = ['normal', 'couple', 'spicy'];
/** Niveaux qui demandent de confirmer avoir 16 ans ou plus. */
export const TOD_ADULT_LEVELS: TodLevel[] = ['spicy'];
/** Niveaux autorisés en mode filtre caméra (rien de coquin sur TikTok / Insta). */
export const TOD_FILTER_LEVELS: TodLevel[] = ['normal', 'couple'];
export const TOD_LEVEL_COLORS: Record<TodLevel, string> = { normal: colors.cyan, couple: colors.lilac, spicy: colors.peach };
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
 * - « @x » en tête : acte sexuel concret, volontairement rare (au plus une action sur EXPLICIT_GAP + 1).
 * - « [o:féminin|masculin] », « [p:féminin|masculin] » : accord selon le sexe.
 * - « {o} », « {p} » : prénom du ou de la partenaire, du joueur.
 */
const TAG = /^@(?:x|([po]):([fm]))\s+/;
/** Nombre minimum d'autres cartes entre deux actes concrets. */
const EXPLICIT_GAP = 3;

function parseTags(text: string) {
  const tags: { who: 'p' | 'o'; gender: Gender }[] = [];
  let explicit = false;
  let rest = text;
  for (let m = rest.match(TAG); m; m = rest.match(TAG)) {
    if (m[1]) tags.push({ who: m[1] as 'p' | 'o', gender: m[2] as Gender });
    else explicit = true;
    rest = rest.slice(m[0].length);
  }
  return { tags, explicit, rest };
}

const isExplicit = (text: string) => parseTags(text).explicit;

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

/** Tirage des cartes, sans retomber sur celles déjà jouées (même d'une partie à l'autre). */
export function useTodDecks(language: string) {
  const content = byLanguage(language, { fr: todFr, en: todEn });
  // Nombre de cartes tirées depuis le dernier acte concret, par paquet
  const [sinceExplicit, setSinceExplicit] = useState<Partial<Record<Key, number>>>({});

  /** Tire une carte qui convient au couple, déjà personnalisée. */
  const draw = (level: TodLevel, kind: TodKind, players: TodPlayers): string => {
    const key: Key = `${level}.${kind}`;
    const since = sinceExplicit[key] ?? 1;
    const allowExplicit = since >= EXPLICIT_GAP;
    const card =
      drawOneFresh(`tod.${language}.${key}`, content[level][kind], (c) => fitsPlayers(c, players) && (allowExplicit || !isExplicit(c))) ??
      content[level][kind][0];
    setSinceExplicit((prev) => ({ ...prev, [key]: isExplicit(card) ? 0 : since + 1 }));
    return renderCard(card, players);
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
