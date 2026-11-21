import laddersEn from '@/data/ladders-en.json';
import laddersFr from '@/data/ladders-fr.json';
import { byLanguage } from '@/utils/random';
import { drawFresh } from '@/utils/seen';

/** Une échelle : le mot de départ, les mots intermédiaires d'une solution la plus courte, puis le mot d'arrivée. */
export type Ladder = string[];

/** Exemple affiché dans la règle (français) ; l'anglais a le sien. */
export const LADDER_EXAMPLE = { fr: ['coq', 'col', 'cil', 'ail', 'aie', 'âne'], en: ['cat', 'cot', 'dot', 'dog'] };

/** Nombre minimum de mots à trouver pour aller du départ à l'arrivée. */
export const ladderPar = (ladder: Ladder) => ladder.length - 1;

export function drawLadders(language: string, count: number): Ladder[] {
  const pool = byLanguage(language, { fr: laddersFr, en: laddersEn }) as Ladder[];
  return drawFresh(`ladder.${language}`, pool, count, undefined, (l) => `${l[0]}>${l[l.length - 1]}`);
}

/** Écart au par : négatif = mieux que le par. */
export type LadderVerdict = 'under' | 'par' | 'over' | 'gaveUp';
export function ladderVerdict(words: number, par: number, gaveUp: boolean): LadderVerdict {
  if (gaveUp) return 'gaveUp';
  if (words < par) return 'under';
  return words === par ? 'par' : 'over';
}
