import wordsFr from '@/data/words-fr.json';
import wordsEn from '@/data/words-en.json';

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