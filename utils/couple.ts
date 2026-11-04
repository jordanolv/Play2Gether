import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const NAMES_KEY = 'coupleNames';
const GENDERS_KEY = 'coupleGenders';

export type CoupleNames = [string, string];
/** Sexe de chaque joueur, pour accorder les textes et proposer des actions cohérentes. */
export type Gender = 'f' | 'm';
export type CoupleGenders = [Gender | null, Gender | null];

const isGender = (value: unknown): value is Gender => value === 'f' || value === 'm';

/** Profil du couple (prénoms + sexes), mémorisé sur le téléphone. Vide tant qu'il n'a pas été saisi. */
export function useCoupleNames() {
  const [names, setNames] = useState<CoupleNames>(['', '']);
  const [genders, setGenders] = useState<CoupleGenders>([null, null]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([NAMES_KEY, GENDERS_KEY])
      .then(([[, rawNames], [, rawGenders]]) => {
        const parsedNames = rawNames ? JSON.parse(rawNames) : null;
        if (Array.isArray(parsedNames) && parsedNames.length === 2) setNames([String(parsedNames[0]), String(parsedNames[1])]);
        const parsedGenders = rawGenders ? JSON.parse(rawGenders) : null;
        if (Array.isArray(parsedGenders) && parsedGenders.length === 2) {
          setGenders([isGender(parsedGenders[0]) ? parsedGenders[0] : null, isGender(parsedGenders[1]) ? parsedGenders[1] : null]);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = useCallback((nextNames: CoupleNames, nextGenders: CoupleGenders) => {
    const clean: CoupleNames = [nextNames[0].trim(), nextNames[1].trim()];
    setNames(clean);
    setGenders(nextGenders);
    AsyncStorage.multiSet([
      [NAMES_KEY, JSON.stringify(clean)],
      [GENDERS_KEY, JSON.stringify(nextGenders)],
    ]).catch(() => {});
  }, []);

  const complete = Boolean(names[0] && names[1] && genders[0] && genders[1]);
  return { names, genders, save, loaded, hasNames: complete };
}
