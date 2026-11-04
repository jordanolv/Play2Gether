import AsyncStorage from '@react-native-async-storage/async-storage';

import { shuffle } from '@/utils/random';

/*
 * Mémoire des cartes déjà tombées, par jeu (et par langue ou niveau).
 * Une carte ne revient qu'une fois toute la liste passée, même d'une partie
 * ou d'un jour à l'autre. Chargée une fois au démarrage, puis lue sans attendre.
 */

const STORAGE_KEY = 'seenCards';
let seen: Record<string, string[]> = {};
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export async function loadSeen() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') seen = parsed;
  } catch {
    seen = {};
  }
}

function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seen)).catch(() => {});
  }, 500);
}

/**
 * Tire `count` cartes de `pool` qui ne sont pas encore tombées et les marque comme vues.
 * `accept` filtre les cartes possibles (sexe des joueurs, niveau…), `id` donne la clé d'une carte.
 * Quand il n'en reste plus assez, la mémoire de cette liste repart à zéro.
 */
export function drawFresh<T>(
  key: string,
  pool: readonly T[],
  count: number,
  accept: (card: T) => boolean = () => true,
  id: (card: T) => string = (card) => (typeof card === 'string' ? card : JSON.stringify(card)),
): T[] {
  const allowed = pool.filter(accept);
  if (allowed.length === 0) return [];
  const history = seen[key] ?? [];
  const already = new Set(history);
  let fresh = allowed.filter((card) => !already.has(id(card)));
  if (fresh.length < count) {
    // Tout est passé : on recommence, sans reprendre tout de suite les dernières cartes vues
    const recent = new Set(history.slice(-Math.floor(allowed.length / 2)));
    seen[key] = [];
    fresh = allowed.filter((card) => !recent.has(id(card)));
    if (fresh.length < count) fresh = allowed;
  }
  const picked = shuffle(fresh).slice(0, count);
  seen[key] = [...(seen[key] ?? []), ...picked.map(id)];
  persist();
  return picked;
}

export const drawOneFresh = <T,>(key: string, pool: readonly T[], accept?: (card: T) => boolean): T | undefined =>
  drawFresh(key, pool, 1, accept)[0];
