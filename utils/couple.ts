import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'coupleNames';

export type CoupleNames = [string, string];

/** Prénoms du couple, mémorisés sur le téléphone. Vides tant qu'ils n'ont pas été saisis. */
export function useCoupleNames() {
  const [names, setNames] = useState<CoupleNames>(['', '']);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed) && parsed.length === 2) setNames([String(parsed[0]), String(parsed[1])]);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = useCallback((next: CoupleNames) => {
    const clean: CoupleNames = [next[0].trim(), next[1].trim()];
    setNames(clean);
    AsyncStorage.setItem(KEY, JSON.stringify(clean)).catch(() => {});
  }, []);

  return { names, save, loaded, hasNames: Boolean(names[0] && names[1]) };
}
