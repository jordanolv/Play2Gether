import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { GameHeader } from '@/components/ui/GameHeader';
import { Screen } from '@/components/ui/Screen';
import { WithCoupleNames } from '@/components/ui/WithCoupleNames';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { CoupleNames } from '@/utils/couple';
import { LADDER_EXAMPLE, Ladder, LadderVerdict, drawLadders, ladderPar, ladderVerdict } from '@/utils/ladder';
import { byLanguage } from '@/utils/random';
import { updateDailyStreak } from '@/utils/streak';

const ROUNDS = 5;
const PLAYER_COLORS = [colors.pink, colors.cyan] as const;
const GLOWS = [
  { color: colors.violet, size: 420, top: -160, right: -160 },
  { color: colors.mint, size: 340, bottom: 40, left: -180 },
];
const VERDICT_COLORS: Record<LadderVerdict, string> = {
  under: colors.mint,
  par: colors.yellow,
  over: colors.cyan,
  gaveUp: colors.textMuted,
};

interface RoundResult {
  words: number;
  par: number;
  gaveUp: boolean;
}

export default function LadderScreen() {
  const { t, i18n } = useTranslation();
  return (
    <WithCoupleNames title={t('games.ladder.title')} glows={GLOWS}>
      {(names) => <LadderGame key={i18n.language} names={names} />}
    </WithCoupleNames>
  );
}

/** Un mot en tuiles de lettres. `diff` met en valeur les lettres différentes d'un autre mot. */
export function WordTiles({ word, color, diff, size = 'lg' }: { word: string; color: string; diff?: string; size?: 'lg' | 'sm' }) {
  const small = size === 'sm';
  return (
    <View style={styles.tiles}>
      {[...word.toUpperCase()].map((letter, i) => {
        const changed = diff !== undefined && diff[i]?.toUpperCase() !== letter;
        return (
          <View
            key={i}
            style={[
              small ? styles.tileSm : styles.tile,
              { borderColor: color },
              changed && { backgroundColor: color },
            ]}
          >
            <Text style={[small ? styles.tileTextSm : styles.tileText, changed && { color: colors.bg }]}>{letter}</Text>
          </View>
        );
      })}
    </View>
  );
}

function LadderGame({ names }: { names: CoupleNames }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [ladders, setLadders] = useState<Ladder[]>(() => drawLadders(i18n.language, ROUNDS));
  const [results, setResults] = useState<RoundResult[]>([]);
  const [words, setWords] = useState(0);
  const [revealed, setRevealed] = useState<RoundResult | null>(null);

  const round = results.length;
  const finished = round >= ladders.length;
  const ladder = ladders[Math.min(round, ladders.length - 1)];
  const par = ladder ? ladderPar(ladder) : 0;
  // Chacun son tour ; celui qui commence change à chaque manche
  const turn = ((round + words) % 2) as 0 | 1;

  const found = () => {
    setWords((w) => w + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const endRound = (gaveUp: boolean) => {
    // « On y est » : le dernier mot trouvé est le mot d'arrivée, il compte comme un coup
    const result = { words: gaveUp ? words : words + 1, par, gaveUp };
    setRevealed(result);
    Haptics.notificationAsync(
      gaveUp ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
    ).catch(() => {});
  };

  const next = () => {
    if (!revealed) return;
    const all = [...results, revealed];
    setResults(all);
    setRevealed(null);
    setWords(0);
    if (all.length >= ladders.length) updateDailyStreak();
  };

  const restart = () => {
    setLadders(drawLadders(i18n.language, ROUNDS));
    setResults([]);
    setWords(0);
    setRevealed(null);
  };

  if (!ladder) return <Screen glows={GLOWS}><GameHeader title={t('games.ladder.title')} /></Screen>;

  if (finished) {
    const played = results.filter((r) => !r.gaveUp);
    const totalWords = played.reduce((s, r) => s + r.words, 0);
    const totalPar = played.reduce((s, r) => s + r.par, 0);
    const gap = totalWords - totalPar;
    const gaveUps = results.length - played.length;
    const mood = played.length === 0 ? 'ok' : gap <= 0 && gaveUps === 0 ? 'perfect' : gap <= 3 && gaveUps <= 1 ? 'good' : 'ok';
    return (
      <Screen glows={GLOWS}>
        <GameHeader title={t('games.ladder.results')} />
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <View style={styles.resultCard}>
            <Text style={styles.resultKicker}>{t(`games.ladder.${mood}`)}</Text>
            {played.length > 0 && <Text style={styles.resultValue}>{gap > 0 ? `+${gap}` : gap}</Text>}
            {played.length > 0 && <Text style={styles.resultSub}>{t('games.ladder.total', { words: totalWords, par: totalPar })}</Text>}
          </View>
          {results.map((r, i) => {
            const l = ladders[i];
            const v = ladderVerdict(r.words, r.par, r.gaveUp);
            return (
              <View key={i} style={styles.recap}>
                <Text style={styles.recapWords} numberOfLines={1}>
                  {l[0].toUpperCase()} → {l[l.length - 1].toUpperCase()}
                </Text>
                <Text style={[styles.recapVerdict, { color: VERDICT_COLORS[v] }]}>
                  {r.gaveUp ? '—' : `${r.words} / ${r.par}`}
                </Text>
              </View>
            );
          })}
          <Button label={t('games.ladder.playAgain')} onPress={restart} variant="accent" />
        </ScrollView>
      </Screen>
    );
  }

  const start = ladder[0];
  const goal = ladder[ladder.length - 1];
  const example = byLanguage(i18n.language, LADDER_EXAMPLE).map((w) => w.toUpperCase()).join(' → ');

  return (
    <Screen glows={GLOWS}>
      <GameHeader
        title={t('games.ladder.title')}
        step={round + 1}
        total={ladders.length}
        onFilm={() => router.push({ pathname: '/filter', params: { mode: 'ladder' } })}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.label}>{t('games.ladder.from')}</Text>
          <WordTiles word={start} color={colors.violet} />
          <View style={styles.middle}>
            <Feather name="arrow-down" size={22} color={colors.textMuted} />
            <Text style={styles.par}>{t('games.ladder.par', { count: par })}</Text>
          </View>
          <Text style={styles.label}>{t('games.ladder.to')}</Text>
          <WordTiles word={goal} color={colors.mint} />
        </View>

        {revealed ? (
          <View style={styles.reveal}>
            {(() => {
              const v = ladderVerdict(revealed.words, revealed.par, revealed.gaveUp);
              return (
                <Text style={[styles.verdict, { color: VERDICT_COLORS[v] }]}>
                  {v === 'over'
                    ? t('games.ladder.verdict.over', { count: revealed.words - revealed.par })
                    : t(`games.ladder.verdict.${v}`)}
                </Text>
              );
            })()}
            <Text style={styles.solutionTitle}>{t('games.ladder.solution', { count: par })}</Text>
            {ladder.map((w, i) => (
              <WordTiles key={i} word={w} size="sm" color={i === ladder.length - 1 ? colors.mint : colors.violet} diff={i > 0 ? ladder[i - 1] : undefined} />
            ))}
          </View>
        ) : (
          <>
            <View style={styles.turnRow}>
              <Text style={[styles.turn, { color: PLAYER_COLORS[turn] }]} numberOfLines={1}>
                {t('games.ladder.turn', { name: names[turn] })}
              </Text>
              <Text style={styles.count}>{t('games.ladder.words', { count: words })}</Text>
            </View>
            {round === 0 && words === 0 && (
              <View style={styles.howTo}>
                <Text style={styles.howToText}>{t('games.ladder.howTo')}</Text>
                <Text style={styles.example}>{t('games.ladder.example', { example })}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {revealed ? (
          <Button
            label={round + 1 >= ladders.length ? t('games.ladder.seeResults') : t('games.ladder.next')}
            onPress={next}
            variant="accent"
          />
        ) : (
          <>
            <View style={styles.actions}>
              <Pressable
                onPress={found}
                accessibilityRole="button"
                style={({ pressed }) => [styles.bigBtn, { backgroundColor: PLAYER_COLORS[turn] }, pressed && styles.pressed]}
              >
                <Feather name="plus" size={20} color={colors.bg} />
                <Text style={styles.bigBtnText}>{t('games.ladder.found')}</Text>
              </Pressable>
              <Pressable
                onPress={() => endRound(false)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.bigBtn, { backgroundColor: colors.mint }, pressed && styles.pressed]}
              >
                <Feather name="flag" size={18} color={colors.bg} />
                <Text style={styles.bigBtnText}>{t('games.ladder.done')}</Text>
              </Pressable>
            </View>
            <View style={styles.tools}>
              {words > 0 && (
                <Pressable onPress={() => setWords((w) => Math.max(0, w - 1))} accessibilityRole="button" style={styles.tool}>
                  <Feather name="rotate-ccw" size={14} color={colors.textMuted} />
                  <Text style={styles.toolText}>{t('games.ladder.undo')}</Text>
                </Pressable>
              )}
              <Pressable onPress={() => endRound(true)} accessibilityRole="button" style={styles.tool}>
                <Feather name="eye" size={14} color={colors.textMuted} />
                <Text style={styles.toolText}>{t('games.ladder.giveUp')}</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.screen, paddingTop: 20, paddingBottom: 24, gap: 18 },
  card: {
    alignItems: 'center', gap: 10, borderRadius: radius.xxl, backgroundColor: colors.surface, paddingVertical: 24, paddingHorizontal: 16,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)',
    shadowColor: colors.violet, shadowOpacity: 0.25, shadowRadius: 30, shadowOffset: { width: 0, height: 20 }, elevation: 10,
  },
  label: { color: colors.textMuted, fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase' },
  middle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  par: {
    color: colors.bg, backgroundColor: colors.yellow, fontFamily: fonts.extrabold, fontSize: 13, overflow: 'hidden',
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5,
  },
  tiles: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  tile: { width: 50, height: 58, borderRadius: radius.md, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tileText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 28 },
  tileSm: { width: 34, height: 38, borderRadius: radius.sm, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tileTextSm: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 18 },

  turnRow: { alignItems: 'center', gap: 4 },
  turn: { fontFamily: fonts.extrabold, fontSize: 22, textAlign: 'center' },
  count: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 15 },
  howTo: { gap: 8, padding: 16, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.05)' },
  howToText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  example: { color: colors.yellow, fontFamily: fonts.bold, fontSize: 13 },

  reveal: { alignItems: 'center', gap: 8 },
  verdict: { fontFamily: fonts.extrabold, fontSize: 24, textAlign: 'center', marginBottom: 4 },
  solutionTitle: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 13, marginBottom: 4 },

  footer: { paddingHorizontal: spacing.screen, paddingBottom: 8, gap: 6 },
  actions: { flexDirection: 'row', gap: 12 },
  bigBtn: { flex: 1, height: 64, borderRadius: radius.xl, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  bigBtnText: { color: colors.bg, fontFamily: fonts.extrabold, fontSize: 18 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  tools: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 12 },
  toolText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 14 },

  resultsContent: { padding: spacing.screen, paddingTop: 28, gap: 12 },
  resultCard: {
    alignItems: 'center', paddingVertical: 26, borderRadius: radius.xxl, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)', gap: 4, marginBottom: 6,
  },
  resultKicker: { color: colors.yellow, fontFamily: fonts.extrabold, fontSize: 16 },
  resultValue: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 64, lineHeight: 72 },
  resultSub: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 14 },
  recap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52,
    borderRadius: radius.lg, backgroundColor: colors.surface,
  },
  recapWords: { flex: 1, color: colors.text, fontFamily: fonts.extrabold, fontSize: 16 },
  recapVerdict: { fontFamily: fonts.extrabold, fontSize: 16 },
});
