import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { GameHeader } from '@/components/ui/GameHeader';
import { Screen } from '@/components/ui/Screen';
import { WithCoupleNames } from '@/components/ui/WithCoupleNames';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import daresEn from '@/data/defis-en.json';
import daresFr from '@/data/defis-fr.json';
import { CoupleNames } from '@/utils/couple';
import { byLanguage, pickRandom } from '@/utils/random';
import { updateDailyStreak } from '@/utils/streak';

/** Nombre total de défis, en alternant les joueurs. */
const ROUNDS = 10;
const PLAYER_COLORS = [colors.pink, colors.cyan] as const;
const GLOWS = [
  { color: colors.peach, size: 420, top: -160, right: -160 },
  { color: colors.pink, size: 340, bottom: 40, left: -180 },
];

export default function DaresScreen() {
  const { t, i18n } = useTranslation();
  return (
    <WithCoupleNames title={t('games.defis.title')} glows={GLOWS}>
      {(names) => <DaresGame key={i18n.language} names={names} />}
    </WithCoupleNames>
  );
}

function DaresGame({ names }: { names: CoupleNames }) {
  const { t, i18n } = useTranslation();
  const draw = () => pickRandom(byLanguage(i18n.language, { fr: daresFr, en: daresEn }), ROUNDS);
  const [dares, setDares] = useState<string[]>(draw);
  const [round, setRound] = useState(0);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const player = (round % 2) as 0 | 1;
  const finished = round >= dares.length;

  const resolve = (done: boolean) => {
    if (done) {
      const next: [number, number] = [...scores];
      next[player] += 1;
      setScores(next);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (round + 1 >= dares.length) updateDailyStreak();
    setRound(round + 1);
  };

  const restart = () => {
    setDares(draw());
    setRound(0);
    setScores([0, 0]);
  };

  if (finished) {
    const [s1, s2] = scores;
    const winner = s1 === s2 ? null : s1 > s2 ? 0 : 1;
    return (
      <Screen glows={GLOWS}>
        <GameHeader title={t('games.defis.results')} />
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <View style={styles.winnerCard}>
            <Feather name="award" size={32} color={winner === null ? colors.yellow : PLAYER_COLORS[winner]} />
            <Text style={styles.winnerText}>
              {winner === null ? t('games.defis.tie') : t('games.defis.winner', { player: names[winner] })}
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
          <Button label={t('games.defis.playAgain')} onPress={restart} variant="accent" />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen glows={GLOWS}>
      <GameHeader title={t('games.defis.title')} step={round + 1} total={dares.length} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scoreBar}>
          {([0, 1] as const).map((p) => (
            <View key={p} style={[styles.scorePill, p === player && { borderColor: PLAYER_COLORS[p], backgroundColor: colors.surfaceRaised }]}>
              <Text style={[styles.scorePillName, { color: PLAYER_COLORS[p] }]} numberOfLines={1}>{names[p]}</Text>
              <Text style={styles.scorePillValue}>{scores[p]}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { borderColor: PLAYER_COLORS[player] }]}>
          <Text style={[styles.kicker, { color: PLAYER_COLORS[player] }]}>{t('games.defis.forPlayer', { player: names[player] })}</Text>
          <Text style={styles.dare}>{dares[round]}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t('games.defis.done')} onPress={() => resolve(true)} variant="accent" />
        <Button label={t('games.defis.pass')} onPress={() => resolve(false)} variant="ghost" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.screen, paddingTop: 20, gap: 20 },
  scoreBar: { flexDirection: 'row', gap: 10 },
  scorePill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    height: 48, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  scorePillName: { flex: 1, fontFamily: fonts.extrabold, fontSize: 15 },
  scorePillValue: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 20 },
  card: {
    minHeight: 300, borderRadius: radius.xxl, backgroundColor: colors.surface, borderWidth: 1,
    padding: 28, gap: 18, justifyContent: 'center',
  },
  kicker: { fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase' },
  dare: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 33 },
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
