import bacEn from '@/data/bac-en.json';
import bacFr from '@/data/bac-fr.json';
import wordsEn from '@/data/words-en.json';
import wordsFr from '@/data/words-fr.json';
import { byLanguage, shuffle } from '@/utils/random';
import { drawFresh, drawOneFresh } from '@/utils/seen';

/** Mots du Mot de Passe, sans retomber sur ceux déjà joués. */
export const getRandomWords = (language: string, count: number = 5): string[] =>
  drawFresh(`password.${language}`, byLanguage(language, { fr: wordsFr, en: wordsEn }), count);

// Table explicite plutôt que String.normalize, pas garanti sur tous les moteurs JS
const ACCENTS: Record<string, string> = {
  À: 'A', Â: 'A', Ä: 'A', Á: 'A', Ã: 'A', Ç: 'C', É: 'E', È: 'E', Ê: 'E', Ë: 'E', Î: 'I', Ï: 'I', Í: 'I',
  Ô: 'O', Ö: 'O', Ó: 'O', Õ: 'O', Ù: 'U', Û: 'U', Ü: 'U', Ú: 'U', Ÿ: 'Y', Ñ: 'N', Œ: 'OE', Æ: 'AE',
};

/** Lettres A-Z d'un mot, sans accents ni doublons (« Éléphant » → E, L, P, H, A, N, T). */
const lettersOf = (word: string) => [
  ...new Set(
    word
      .toUpperCase()
      .replace(/[^A-Z]/g, (c) => ACCENTS[c] ?? '')
      .split('')
  ),
];

export interface BacRound {
  theme: string;
  letters: string[];
  /** Réponse qui a servi au tirage : il en existe donc toujours au moins une. */
  answer: string;
}

type BacData = Record<string, string[]>;

/** Manche de Petit Bac : un thème, et deux lettres tirées d'une vraie réponse de ce thème. */
export function getBacRound(language: string): BacRound {
  const data: BacData = byLanguage<BacData>(language, { fr: bacFr, en: bacEn });
  const pairs = Object.entries(data).flatMap(([theme, answers]) => answers.map((answer) => `${theme}|${answer}`));
  const pair = drawOneFresh(`bac.${language}`, pairs, (p) => lettersOf(p.split('|')[1]).length >= 2) ?? pairs[0];
  const [theme, answer] = pair.split('|');
  return { theme, answer, letters: shuffle(lettersOf(answer)).slice(0, 2) };
}
