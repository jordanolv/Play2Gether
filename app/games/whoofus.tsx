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
import questionsEn from '@/data/whoofus-en.json';
import questionsFr from '@/data/whoofus-fr.json';
import { CoupleNames } from '@/utils/couple';
import { byLanguage } from '@/utils/random';
import { drawFresh } from '@/utils/seen';
import { updateDailyStreak } from '@/utils/streak';

const QUESTIONS_PER_GAME = 10;
const PLAYER_COLORS = [colors.pink, colors.cyan] as const;
const GLOWS = [
  { color: colors.yellow, size: 420, top: -160, right: -160 },
  { color: colors.pink, size: 360, bottom: 40, left: -180 },
];

/** 0 / 1 : les deux ont pointé la même personne. 'split' : désaccord. */
type Answer = 0 | 1 | 'split';

export default function WhoOfUsScreen() {
  const { t, i18n } = useTranslation();
  return (
    <WithCoupleNames title={t('games.whoofus.title')} glows={GLOWS}>
      {(names, editNames) => <WhoOfUsGame key={i18n.language} names={names} onEditNames={editNames} />}
    </WithCoupleNames>
  );
}

function WhoOfUsGame({ names, onEditNames }: { names: CoupleNames; onEditNames: () => void }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const draw = () => drawFresh(`whoofus.${i18n.language}`, byLanguage(i18n.language, { fr: questionsFr, en: questionsEn }), QUESTIONS_PER_GAME);
  const [questions, setQuestions] = useState<string[]>(draw);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const index = answers.length;
  const finished = index >= questions.length;

  const answer = (a: Answer) => {
    Haptics.impactAsync(a === 'split' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const next = [...answers, a];
    setAnswers(next);
    if (next.length === questions.length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      updateDailyStreak();
    }
  };

  const restart = () => {
    setQuestions(draw());
    setAnswers([]);
  };

  if (finished) {
    const agreed = answers.filter((a) => a !== 'split').length;
    const percent = Math.round((agreed / answers.length) * 100);
    const counts = [answers.filter((a) => a === 0).length, answers.filter((a) => a === 1).length];
    return (
      <Screen glows={GLOWS}>
        <GameHeader title={t('games.whoofus.results')} />
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <View style={styles.matchCard}>
            <Text style={styles.matchKicker}>{t('games.whoofus.matchLabel')}</Text>
            <Text style={styles.matchValue}>{percent}%</Text>
            <Text style={styles.matchSub}>{t('games.whoofus.matchSub', { agreed, total: answers.length })}</Text>
          </View>
          <View style={styles.tallyRow}>
            {([0, 1] as const).map((p) => (
              <View key={p} style={[styles.tally, { borderColor: PLAYER_COLORS[p] }]}>
                <Text style={[styles.tallyName, { color: PLAYER_COLORS[p] }]} numberOfLines={1}>{names[p]}</Text>
                <Text style={styles.tallyValue}>{counts[p]}</Text>
                <Text style={styles.tallySub}>{t('games.whoofus.timesPointed')}</Text>
              </View>
            ))}
          </View>
          <Button label={t('games.whoofus.playAgain')} onPress={restart} />
        </ScrollView>
      </Screen>
    );
  }

  const question = questions[index];

  return (
    <Screen glows={GLOWS}>
      <GameHeader
        title={t('games.whoofus.title')}
        step={index + 1}
        total={questions.length}
        onFilm={() => router.push({ pathname: '/filter', params: { mode: 'whoofus' } })}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.countdown}>
          <Text style={styles.countdownText}>{t('games.whoofus.instruction')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.question}>{question}</Text>
        </View>

        <View style={styles.tools}>
          <Pressable onPress={onEditNames} accessibilityRole="button" style={({ pressed }) => [styles.tool, pressed && { opacity: 0.7 }]}>
            <Feather name="edit-2" size={15} color={colors.textMuted} />
            <Text style={styles.toolText}>{t('games.whoofus.editNames')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>{t('games.whoofus.whoWasPointed')}</Text>
        <View style={styles.playersRow}>
          {([0, 1] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => answer(p)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.playerBtn, { backgroundColor: PLAYER_COLORS[p] }, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
            >
              <Text style={styles.playerBtnText} numberOfLines={1}>{names[p]}</Text>
            </Pressable>
          ))}
        </View>
        <Button label={t('games.whoofus.disagree')} onPress={() => answer('split')} variant="ghost" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.screen, paddingTop: 24, gap: 18 },
  countdown: { alignSelf: 'center', backgroundColor: colors.yellow, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  countdownText: { color: colors.bg, fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  card: {
    minHeight: 260, borderRadius: radius.xxl, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: 'rgba(255,216,77,0.35)', padding: 28, justifyContent: 'center',
    shadowColor: colors.yellow, shadowOpacity: 0.25, shadowRadius: 30, shadowOffset: { width: 0, height: 20 }, elevation: 10,
  },
  question: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 37, textAlign: 'center', letterSpacing: -0.5 },
  tools: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingHorizontal: 14 },
  toolText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 14 },

  footer: { paddingHorizontal: spacing.screen, paddingBottom: 8, gap: 10 },
  footerLabel: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 14, textAlign: 'center' },
  playersRow: { flexDirection: 'row', gap: 12 },
  playerBtn: { flex: 1, height: 64, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  playerBtnText: { color: colors.bg, fontFamily: fonts.extrabold, fontSize: 20 },

  resultsContent: { padding: spacing.screen, paddingTop: 28, gap: 16 },
  matchCard: {
    alignItems: 'center', paddingVertical: 28, borderRadius: radius.xxl, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: 'rgba(255,216,77,0.35)', gap: 4,
  },
  matchKicker: { color: colors.yellow, fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase' },
  matchValue: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 76, lineHeight: 84 },
  matchSub: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 14 },
  tallyRow: { flexDirection: 'row', gap: 12 },
  tally: { flex: 1, alignItems: 'center', paddingVertical: 18, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, paddingHorizontal: 8 },
  tallyName: { fontFamily: fonts.extrabold, fontSize: 15 },
  tallyValue: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 40, lineHeight: 46 },
  tallySub: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 12 },
});
