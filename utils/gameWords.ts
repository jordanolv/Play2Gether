import wordsFr from '@/data/words-fr.json';
import wordsEn from '@/data/words-en.json';
import themesFr from '@/data/themes-fr.json';
import themesEn from '@/data/themes-en.json';

export const getWordsForLanguage = (language: string): string[] => {
  switch (language) {
    case 'en':
      return wordsEn;
    case 'fr':
    default:
      return wordsFr;
  }
};

export const getRandomWords = (language: string, count: number = 5): string[] => {
  const words = getWordsForLanguage(language);
  const shuffled = [...words].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const getThemesForLanguage = (language: string): string[] => {
  switch (language) {
    case 'en':
      return themesEn;
    case 'fr':
    default:
      return themesFr;
  }
};

export const getRandomTheme = (language: string): string => {
  const themes = getThemesForLanguage(language);
  return themes[Math.floor(Math.random() * themes.length)];
};