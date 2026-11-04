import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Countdown } from '@/components/ui/Countdown';
import { GameHeader } from '@/components/ui/GameHeader';
import { Screen } from '@/components/ui/Screen';
import { WithCoupleNames } from '@/components/ui/WithCoupleNames';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { CoupleGenders, CoupleNames } from '@/utils/couple';
import { updateDailyStreak } from '@/utils/streak';
import {
  TOD_ADULT_LEVELS, TOD_KIND_COLORS, TOD_LEVELS, TOD_LEVEL_COLORS, TodKind, TodLevel, parseDuration, useTodDecks,
} from '@/utils/truthordare';

/** Nombre de tours, en alternant les joueurs. */
const ROUNDS = 12;
const JOKERS = 2;
const PLAYER_COLORS = [colors.pink, colors.cyan] as const;
const GLOWS = [
  { color: colors.pink, size: 420, top: -160, right: -160 },
  { color: colors.cyan, size: 340, bottom: 40, left: -180 },
];

export default function TruthOrDareScreen() {
  const { t, i18n } = useTranslation();
  return (
    <WithCoupleNames title={t('games.truthordare.title')} glows={GLOWS}>
      {(names, _edit, genders) => <TruthOrDareGame key={i18n.language} names={names} genders={genders} />}
    </WithCoupleNames>
  );
}

function TruthOrDareGame({ names, genders }: { names: CoupleNames; genders: CoupleGenders }) {
  const { t, i18n } = useTranslation();
  const draw = useTodDecks(i18n.language);
  const [level, setLevel] = useState<TodLevel>('normal');
  const [adultOk, setAdultOk] = useState(false);
  const [round, setRound] = useState(0);
  const [current, setCurrent] = useState<{ kind: TodKind; text: string } | null>(null);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [jokers, setJokers] = useState<[number, number]>([JOKERS, JOKERS]);
  const player = (round % 2) as 0 | 1;
  const finished = round >= ROUNDS;

  const changeLevel = (next: TodLevel) => {
    if (next === level) return;
    if (TOD_ADULT_LEVELS.includes(next) && !adultOk) {
      Alert.alert(t('games.truthordare.adultTitle'), t('games.truthordare.adultBody'), [
        { text: t('games.truthordare.adultCancel'), style: 'cancel' },
        {
          text: t('games.truthordare.adultConfirm'),
          onPress: () => {
            setAdultOk(true);
            setLevel(next);
          },
        },
      ]);
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    setLevel(next);
  };

  const choose = (kind: TodKind) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const other = player === 0 ? 1 : 0;
    const players = {
      player: { name: names[player], gender: genders[player] },
      other: { name: names[other], gender: genders[other] },
    };
    setCurrent({ kind, text: draw(level, kind, players) });
  };

  const resolve = (done: boolean) => {
    if (done) {
      const next: [number, number] = [...scores];
      next[player] += 1;
      setScores(next);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      const next: [number, number] = [...jokers];
      next[player] -= 1;
      setJokers(next);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (round + 1 >= ROUNDS) updateDailyStreak();
    setCurrent(null);
    setRound(round + 1);
  };

  const restart = () => {
    setRound(0);
    setCurrent(null);
    setScores([0, 0]);
    setJokers([JOKERS, JOKERS]);
  };

  if (finished) {
    const [s1, s2] = scores;
    const winner = s1 === s2 ? null : s1 > s2 ? 0 : 1;
    return (
      <Screen glows={GLOWS}>
        <GameHeader title={t('games.truthordare.results')} />
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <View style={styles.winnerCard}>
            <Feather name="award" size={32} color={winner === null ? colors.yellow : PLAYER_COLORS[winner]} />
            <Text style={styles.winnerText}>
              {winner === null ? t('games.truthordare.tie') : t('games.truthordare.winner', { player: names[winner] })}
            </Text>
          </View>
          <View style={styles.scoresRow}>
            {([0, 1] as const).map((p) => (
              <View key={p} style={[styles.scoreTile, { borderColor: PLAYER_COLORS[p] }]}>
                <Text style={[styles.scoreName, { color: PLAYER_COLORS[p] }]} numberOfLines={1}>{names[p]}</Text>
                <Text style={styles.scoreValue}>{scores[p]}</Text>
              </View>
            ))}
          </View>
          <Button label={t('games.truthordare.playAgain')} onPress={restart} variant="accent" />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen glows={GLOWS}>
      <GameHeader title={t('games.truthordare.title')} step={round + 1} total={ROUNDS} />

      <View style={styles.levels} accessibilityRole="radiogroup">
        {TOD_LEVELS.map((l) => {
          const active = l === level;
          return (
            <Pressable
              key={l}
              onPress={() => changeLevel(l)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              style={[styles.level, active && { backgroundColor: TOD_LEVEL_COLORS[l], borderColor: TOD_LEVEL_COLORS[l] }]}
            >
              <Text style={[styles.levelText, active && { color: colors.bg }]} numberOfLines={1}>
                {t(`games.truthordare.levels.${l}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scoreBar}>
          {([0, 1] as const).map((p) => (
            <View key={p} style={[styles.scorePill, p === player && { borderColor: PLAYER_COLORS[p], backgroundColor: colors.surfaceRaised }]}>
              <Text style={[styles.scorePillName, { color: PLAYER_COLORS[p] }]} numberOfLines={1}>{names[p]}</Text>
              <Text style={styles.scorePillValue}>{scores[p]}</Text>
            </View>
          ))}
        </View>

        {current ? (
          <View style={[styles.card, { borderColor: TOD_KIND_COLORS[current.kind] }]}>
            <Text style={[styles.kicker, { color: TOD_KIND_COLORS[current.kind] }]}>
              {t(`games.truthordare.${current.kind}For`, { player: names[player] })}
            </Text>
            <Text style={styles.cardText}>{current.text}</Text>
            {current.kind === 'dare' && parseDuration(current.text) !== null && (
              <Countdown key={`${round}-${current.text}`} seconds={parseDuration(current.text)!} color={TOD_KIND_COLORS.dare} />
            )}
          </View>
        ) : (
          <View style={styles.choice}>
            <Text style={styles.turn}>
              <Text style={{ color: PLAYER_COLORS[player] }}>{names[player]}</Text>
              {t('games.truthordare.turnSuffix')}
            </Text>
            <View style={styles.choiceRow}>
              {(['truth', 'dare'] as const).map((kind) => (
                <Pressable
                  key={kind}
                  onPress={() => choose(kind)}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.choiceBtn, { backgroundColor: TOD_KIND_COLORS[kind] }, pressed && { transform: [{ scale: 0.97 }] }]}
                >
                  <Feather name={kind === 'truth' ? 'message-circle' : 'zap'} size={26} color={colors.bg} />
                  <Text style={styles.choiceText}>{t(`games.truthordare.${kind}`)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {current && (
        <View style={styles.footer}>
          <Button label={t('games.truthordare.done')} onPress={() => resolve(true)} variant="accent" />
          <Button
            label={t('games.truthordare.joker', { count: jokers[player] })}
            onPress={() => resolve(false)}
            variant="ghost"
            disabled={jokers[player] <= 0}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  levels: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.screen, paddingTop: 16 },
  level: {
    flex: 1, height: 40, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.borderStrong,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  levelText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 12 },

  content: { paddingHorizontal: spacing.screen, paddingTop: 18, gap: 20 },
  scoreBar: { flexDirection: 'row', gap: 10 },
  scorePill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    height: 48, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  scorePillName: { flex: 1, fontFamily: fonts.extrabold, fontSize: 15 },
  scorePillValue: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 20 },

  choice: { gap: 18, paddingTop: 12 },
  turn: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 28, textAlign: 'center', letterSpacing: -0.5 },
  choiceRow: { flexDirection: 'row', gap: 12 },
  choiceBtn: { flex: 1, height: 170, borderRadius: radius.xxl, alignItems: 'center', justifyContent: 'center', gap: 10 },
  choiceText: { color: colors.bg, fontFamily: fonts.extrabold, fontSize: 24 },

  card: {
    minHeight: 280, borderRadius: radius.xxl, backgroundColor: colors.surface, borderWidth: 1.5,
    padding: 28, gap: 18, justifyContent: 'center',
  },
  kicker: { fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase' },
  cardText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 27, lineHeight: 32 },
  footer: { paddingHorizontal: spacing.screen, paddingBottom: 8, gap: 6 },

  resultsContent: { padding: spacing.screen, paddingTop: 28, gap: 20 },
  winnerCard: {
    alignItems: 'center', gap: 12, paddingVertical: 32, paddingHorizontal: 16, borderRadius: radius.xxl,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  winnerText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 26, textAlign: 'center' },
  scoresRow: { flexDirection: 'row', gap: 12 },
  scoreTile: { flex: 1, alignItems: 'center', paddingVertical: 20, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, paddingHorizontal: 8 },
  scoreName: { fontFamily: fonts.bold, fontSize: 14 },
  scoreValue: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 44, lineHeight: 50 },
});
