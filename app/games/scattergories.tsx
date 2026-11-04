import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { GameHeader } from '@/components/ui/GameHeader';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { getRandomTheme } from '@/utils/gameWords';
import { updateDailyStreak } from '@/utils/streak';

const MAX_ROUNDS = 5;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PLAYER_COLORS = [colors.pink, colors.cyan] as const;
const GLOWS = [
  { color: colors.cyan, size: 420, top: -160, right: -160 },
  { color: colors.pink, size: 360, bottom: 40, left: -180 },
];

const randomLetters = () => {
  const shuffled = ALPHABET.split('').sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 2);
};

// La clé force une nouvelle partie quand la langue change
export default function ScattergoriesScreen() {
  const { i18n } = useTranslation();
  return <ScattergoriesGame key={i18n.language} />;
}

function ScattergoriesGame() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [theme, setTheme] = useState(() => getRandomTheme(i18n.language));
  const [letters, setLetters] = useState<string[]>(randomLetters);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [round, setRound] = useState(1);
  const [finished, setFinished] = useState(false);

  const newRound = () => {
    setTheme(getRandomTheme(i18n.language));
    setLetters(randomLetters());
  };

  const startNewGame = () => {
    setScores([0, 0]);
    setRound(1);
    setFinished(false);
    newRound();
  };

  const givePoint = (player: 0 | 1) => {
    if (finished) return;
    const next: [number, number] = [...scores];
    next[player] += 1;
    setScores(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    if (round >= MAX_ROUNDS) {
      setFinished(true);
      updateDailyStreak();
    } else {
      setRound((r) => r + 1);
      newRound();
    }
  };

  const playerName = (i: 0 | 1) => t(i === 0 ? 'games.scattergories.player1' : 'games.scattergories.player2');

  if (finished) {
    const [s1, s2] = scores;
    const winner = s1 === s2 ? null : s1 > s2 ? 0 : 1;
    return (
      <Screen glows={GLOWS}>
        <GameHeader title={t('games.scattergories.gameOver')} />
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <View style={styles.winnerCard}>
            <Feather name="award" size={32} color={winner === null ? colors.yellow : PLAYER_COLORS[winner]} />
            <Text style={styles.winnerText}>
              {winner === null ? t('games.scattergories.tie') : t('games.scattergories.winner', { player: playerName(winner) })}
            </Text>
          </View>
          <View style={styles.scoresRow}>
            {([0, 1] as const).map((p) => (
              <View key={p} style={[styles.scoreTile, { borderColor: PLAYER_COLORS[p] }]}>
                <Text style={[styles.scoreTileName, { color: PLAYER_COLORS[p] }]}>{playerName(p)}</Text>
                <Text style={styles.scoreTileValue}>{scores[p]}</Text>
              </View>
            ))}
          </View>
          <Button label={t('games.scattergories.playAgain')} onPress={startNewGame} variant="accent" />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen glows={GLOWS}>
      <GameHeader title={t('games.scattergories.title')} step={round} total={MAX_ROUNDS} onFilm={() => router.push({ pathname: '/filter', params: { mode: 'scattergories' } })} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.themePill}>
            <Text style={styles.themePillText}>{t('games.scattergories.themeLabel')}</Text>
          </View>
          <Text style={styles.theme}>{theme}</Text>
          <Text style={styles.lettersKicker}>{t('games.scattergories.lettersLabel')}</Text>
          <View style={styles.letters}>
            {letters.map((l) => (
              <View key={l} style={styles.letterTile}>
                <Text style={styles.letter}>{l}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.instruction}>{t('games.scattergories.instruction')}</Text>
        </View>

        <Pressable onPress={newRound} accessibilityRole="button" style={({ pressed }) => [styles.shuffle, pressed && { opacity: 0.7 }]}>
          <Feather name="refresh-cw" size={15} color={colors.textMuted} />
          <Text style={styles.shuffleText}>{t('games.scattergories.newRound')}</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.whoWon}>{t('games.scattergories.whoWon')}</Text>
        <View style={styles.playersRow}>
          {([0, 1] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => givePoint(p)}
              accessibilityRole="button"
              accessibilityLabel={`${playerName(p)} ${t('games.scattergories.point')}`}
              style={({ pressed }) => [styles.playerBtn, { backgroundColor: PLAYER_COLORS[p] }, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
            >
              <Text style={styles.playerBtnName}>{playerName(p)}</Text>
              <Text style={styles.playerBtnScore}>{scores[p]}</Text>
              <Text style={styles.playerBtnHint}>{t('games.scattergories.point')}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.screen, paddingTop: 28, gap: 16 },
  card: {
    borderRadius: radius.xxl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    padding: 24, alignItems: 'center', gap: 14,
  },
  themePill: { backgroundColor: colors.yellow, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  themePillText: { color: colors.bg, fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
  theme: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 28, textAlign: 'center', lineHeight: 32 },
  lettersKicker: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 2, marginTop: 6 },
  letters: { flexDirection: 'row', gap: 14 },
  letterTile: {
    width: 84, height: 96, borderRadius: radius.lg, backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center',
  },
  letter: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 56 },
  instruction: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 14, textAlign: 'center', lineHeight: 19 },
  shuffle: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 16 },
  shuffleText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 14 },

  footer: { paddingHorizontal: spacing.screen, paddingBottom: 12, gap: 12 },
  whoWon: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 14, textAlign: 'center' },
  playersRow: { flexDirection: 'row', gap: 12 },
  playerBtn: { flex: 1, borderRadius: radius.xl, paddingVertical: 16, alignItems: 'center' },
  playerBtnName: { color: colors.bg, fontFamily: fonts.bold, fontSize: 14 },
  playerBtnScore: { color: colors.bg, fontFamily: fonts.extrabold, fontSize: 40, lineHeight: 46 },
  playerBtnHint: { color: colors.bg, fontFamily: fonts.extrabold, fontSize: 13, opacity: 0.75 },

  resultsContent: { padding: spacing.screen, paddingTop: 28, gap: 20 },
  winnerCard: {
    alignItems: 'center', gap: 12, paddingVertical: 32, borderRadius: radius.xxl,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  winnerText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 26 },
  scoresRow: { flexDirection: 'row', gap: 12 },
  scoreTile: { flex: 1, alignItems: 'center', paddingVertical: 20, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1 },
  scoreTileName: { fontFamily: fonts.bold, fontSize: 14 },
  scoreTileValue: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 44, lineHeight: 50 },
});
