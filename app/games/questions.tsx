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
import questionsEn from '@/data/questions-en.json';
import questionsFr from '@/data/questions-fr.json';
import { byLanguage, shuffle } from '@/utils/random';
import { updateDailyStreak } from '@/utils/streak';

type Level = 'light' | 'deep' | 'spicy';
const LEVELS: Level[] = ['light', 'deep', 'spicy'];
const LEVEL_COLORS: Record<Level, string> = { light: colors.cyan, deep: colors.lilac, spicy: colors.pink };
/** Nombre de questions avant de compter la partie pour la série. */
const STREAK_AFTER = 5;
const GLOWS = [
  { color: colors.lilac, size: 420, top: -160, right: -160 },
  { color: colors.pink, size: 360, bottom: 40, left: -180 },
];

export default function QuestionsScreen() {
  const { i18n } = useTranslation();
  return <QuestionsGame key={i18n.language} />;
}

function QuestionsGame() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const content = byLanguage(i18n.language, { fr: questionsFr, en: questionsEn });

  const [level, setLevel] = useState<Level>('light');
  const [deck, setDeck] = useState<string[]>(() => shuffle(content.light));
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState(1);

  const changeLevel = (next: Level) => {
    if (next === level) return;
    Haptics.selectionAsync().catch(() => {});
    setLevel(next);
    setDeck(shuffle(content[next]));
    setIndex(0);
  };

  const nextQuestion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (index + 1 >= deck.length) {
      setDeck(shuffle(content[level]));
      setIndex(0);
    } else {
      setIndex(index + 1);
    }
    const nextSeen = seen + 1;
    setSeen(nextSeen);
    if (nextSeen === STREAK_AFTER) updateDailyStreak();
  };

  const question = deck[index];
  const accent = LEVEL_COLORS[level];

  return (
    <Screen glows={GLOWS}>
      <GameHeader title={t('games.questions.title')} />

      <View style={styles.levels} accessibilityRole="radiogroup">
        {LEVELS.map((l) => {
          const active = l === level;
          return (
            <Pressable
              key={l}
              onPress={() => changeLevel(l)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              style={[styles.level, active ? { backgroundColor: LEVEL_COLORS[l], borderColor: LEVEL_COLORS[l] } : null]}
            >
              <Text style={[styles.levelText, active && styles.levelTextActive]}>{t(`games.questions.levels.${l}`)}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={nextQuestion} accessibilityRole="button" accessibilityHint={t('games.questions.tapForNext')} style={[styles.card, { borderColor: accent }]}>
          <Text style={[styles.kicker, { color: accent }]}>{t('games.questions.number', { count: seen })}</Text>
          <Text style={styles.question}>{question}</Text>
          <View style={styles.hint}>
            <Feather name="corner-down-right" size={15} color={colors.textMuted} />
            <Text style={styles.hintText}>{t('games.questions.tapForNext')}</Text>
          </View>
        </Pressable>
        <Text style={styles.rule}>{t('games.questions.rule')}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => router.push({ pathname: '/story', params: { template: 'question', question } })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.storyBtn, pressed && { opacity: 0.7 }]}
        >
          <Feather name="smartphone" size={18} color={colors.text} />
          <Text style={styles.storyText}>{t('games.questions.toStory')}</Text>
        </Pressable>
        <Button label={t('games.questions.next')} onPress={nextQuestion} style={{ flex: 1 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  levels: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.screen, paddingTop: 20 },
  level: {
    flex: 1, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.borderStrong,
  },
  levelText: { color: colors.text, fontFamily: fonts.bold, fontSize: 14 },
  levelTextActive: { color: colors.bg, fontFamily: fonts.extrabold },

  content: { paddingHorizontal: spacing.screen, paddingTop: 28, gap: 16 },
  card: {
    minHeight: 360, borderRadius: radius.xxl, backgroundColor: colors.surface, borderWidth: 1,
    padding: 28, justifyContent: 'space-between',
  },
  kicker: { fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase' },
  question: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 35, letterSpacing: -0.4 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintText: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 13 },
  rule: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 13, textAlign: 'center', lineHeight: 18 },

  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: spacing.screen, paddingBottom: 12 },
  storyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 58, paddingHorizontal: 18, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong,
  },
  storyText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 15 },
});
