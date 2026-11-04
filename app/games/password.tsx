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
import { getRandomWords } from '@/utils/gameWords';
import { updateDailyStreak } from '@/utils/streak';

const WORDS_PER_GAME = 5;
const SKIP_PENALTY = 5;
const MAX_CLUES = 20;

const GLOWS = [{ color: colors.pink, size: 460, top: 160, left: -40 }];

// La clé force une nouvelle partie quand la langue change
export default function PasswordScreen() {
  const { i18n } = useTranslation();
  return <PasswordGame key={i18n.language} />;
}

function PasswordGame() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [gameWords, setGameWords] = useState<string[]>(() => getRandomWords(i18n.language, WORDS_PER_GAME));
  const [index, setIndex] = useState(0);
  const [clues, setClues] = useState(1);
  const [scores, setScores] = useState<number[]>([]);
  const [skipped, setSkipped] = useState<boolean[]>([]);
  const [hidden, setHidden] = useState(false);
  const [finished, setFinished] = useState(false);

  const startNewGame = () => {
    setGameWords(getRandomWords(i18n.language, WORDS_PER_GAME));
    setIndex(0);
    setClues(1);
    setScores([]);
    setSkipped([]);
    setHidden(false);
    setFinished(false);
  };

  const recordWord = (score: number, wasSkipped: boolean) => {
    setScores((s) => [...s, score]);
    setSkipped((s) => [...s, wasSkipped]);
    setClues(1);
    setHidden(false);
    if (index < gameWords.length - 1) {
      setIndex(index + 1);
    } else {
      setFinished(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      updateDailyStreak();
    }
  };

  const changeClues = (delta: number) => {
    const next = Math.min(MAX_CLUES, Math.max(1, clues + delta));
    if (next !== clues) Haptics.selectionAsync().catch(() => {});
    setClues(next);
  };

  if (finished) {
    const total = scores.reduce((a, b) => a + b, 0);
    return (
      <Screen glows={GLOWS}>
        <GameHeader title={t('games.password.results')} />
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <View style={styles.totalCard}>
            <Text style={styles.totalNumber}>{total}</Text>
            <Text style={styles.totalLabel}>{t('games.password.totalLabel')}</Text>
          </View>
          <View style={styles.list}>
            {gameWords.map((word, i) => (
              <View key={word + i} style={[styles.listRow, i === gameWords.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.listWord}>{word}</Text>
                <Text style={[styles.listScore, skipped[i] && { color: colors.textMuted }]}>
                  {skipped[i]
                    ? `${t('games.password.skipped')} · +${SKIP_PENALTY}`
                    : `${scores[i]} ${scores[i] === 1 ? t('games.password.cluesSingular') : t('games.password.cluesPlural')}`}
                </Text>
              </View>
            ))}
          </View>
          <Button label={t('games.password.playAgain')} onPress={startNewGame} variant="accent" />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen glows={GLOWS}>
      <GameHeader title={t('games.password.title')} step={index + 1} total={gameWords.length || WORDS_PER_GAME} onFilm={() => router.push({ pathname: '/filter', params: { mode: 'password' } })} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.instruction}>{t('games.password.instruction')}</Text>

        <Pressable
          onPress={() => setHidden((h) => !h)}
          accessibilityRole="button"
          accessibilityLabel={hidden ? t('games.password.tapToReveal') : t('games.password.tapToHide')}
          style={styles.wordCard}
        >
          <Text style={styles.wordKicker}>{t('games.password.secretLabel')}</Text>
          <Text style={styles.word} adjustsFontSizeToFit numberOfLines={1}>
            {hidden ? '• • • • •' : gameWords[index]}
          </Text>
          <View style={styles.hint}>
            <Feather name={hidden ? 'eye' : 'eye-off'} size={15} color={colors.textMuted} />
            <Text style={styles.hintText}>{hidden ? t('games.password.tapToReveal') : t('games.password.tapToHide')}</Text>
          </View>
        </Pressable>

        <View style={styles.stepperBlock}>
          <Text style={styles.stepperLabel}>{t('games.password.cluesGiven')}</Text>
          <View style={styles.stepper}>
            <Pressable
              onPress={() => changeClues(-1)}
              disabled={clues <= 1}
              accessibilityRole="button"
              accessibilityLabel={t('games.password.removeClue')}
              style={({ pressed }) => [styles.stepBtn, clues <= 1 && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}
            >
              <Feather name="minus" size={26} color={colors.text} />
            </Pressable>
            <Text style={styles.clues} accessibilityLiveRegion="polite">{clues}</Text>
            <Pressable
              onPress={() => changeClues(1)}
              accessibilityRole="button"
              accessibilityLabel={t('games.password.addClue')}
              style={({ pressed }) => [styles.stepBtn, styles.stepBtnAccent, pressed && { opacity: 0.8 }]}
            >
              <Feather name="plus" size={26} color={colors.bg} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t('games.password.wordGuessed')} onPress={() => recordWord(clues, false)} />
        <Button label={t('games.password.skipWord')} onPress={() => recordWord(SKIP_PENALTY, true)} variant="ghost" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.screen, paddingTop: 28, gap: 28 },
  instruction: { textAlign: 'center', color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 15 },

  wordCard: {
    height: 240, borderRadius: radius.xxl, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: 'rgba(255,95,168,0.35)',
    alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 20,
    shadowColor: colors.pink, shadowOpacity: 0.35, shadowRadius: 30, shadowOffset: { width: 0, height: 20 }, elevation: 12,
  },
  wordKicker: { color: colors.pink, fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 2 },
  word: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 50, letterSpacing: -1, textTransform: 'capitalize' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintText: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 13 },

  stepperBlock: { alignItems: 'center', gap: 12 },
  stepperLabel: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 14 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  stepBtn: {
    width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong,
  },
  stepBtnAccent: { backgroundColor: colors.pink, borderWidth: 0 },
  clues: { minWidth: 80, textAlign: 'center', color: colors.text, fontFamily: fonts.extrabold, fontSize: 64, lineHeight: 70 },

  footer: { paddingHorizontal: spacing.screen, paddingBottom: 12, paddingTop: 8, gap: 6 },

  resultsContent: { padding: spacing.screen, paddingTop: 28, gap: 20 },
  totalCard: {
    alignItems: 'center', paddingVertical: 28, borderRadius: radius.xxl,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(255,95,168,0.35)',
  },
  totalNumber: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 72, lineHeight: 78 },
  totalLabel: { color: colors.pink, fontFamily: fonts.bold, fontSize: 15 },
  list: { borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 18 },
  listRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  listWord: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, textTransform: 'capitalize' },
  listScore: { color: colors.pink, fontFamily: fonts.extrabold, fontSize: 15 },
});
