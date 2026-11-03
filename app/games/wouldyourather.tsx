import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { GameHeader } from '@/components/ui/GameHeader';
import { Screen } from '@/components/ui/Screen';
import { WithCoupleNames } from '@/components/ui/WithCoupleNames';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import dilemmasEn from '@/data/wouldyourather-en.json';
import dilemmasFr from '@/data/wouldyourather-fr.json';
import { CoupleNames } from '@/utils/couple';
import { byLanguage, pickRandom } from '@/utils/random';
import { updateDailyStreak } from '@/utils/streak';

const ROUNDS = 8;
const PLAYER_COLORS = [colors.pink, colors.cyan] as const;
const OPTION_COLORS = [colors.mint, colors.yellow] as const;
const GLOWS = [
  { color: colors.mint, size: 420, top: -160, right: -160 },
  { color: colors.yellow, size: 340, bottom: 40, left: -180 },
];

type Choice = 0 | 1;
/** Étape d'une manche : le joueur 1 choisit, puis le joueur 2, puis on révèle. */
type Step = 'p1' | 'p2' | 'reveal';

export default function WouldYouRatherScreen() {
  const { t, i18n } = useTranslation();
  return (
    <WithCoupleNames title={t('games.wouldyourather.title')} glows={GLOWS}>
      {(names) => <WouldYouRatherGame key={i18n.language} names={names} />}
    </WithCoupleNames>
  );
}

function WouldYouRatherGame({ names }: { names: CoupleNames }) {
  const { t, i18n } = useTranslation();
  const draw = () => pickRandom(byLanguage(i18n.language, { fr: dilemmasFr, en: dilemmasEn }), ROUNDS);
  const [dilemmas, setDilemmas] = useState<string[][]>(draw);
  const [round, setRound] = useState(0);
  const [step, setStep] = useState<Step>('p1');
  const [picks, setPicks] = useState<[Choice | null, Choice | null]>([null, null]);
  const [matches, setMatches] = useState<boolean[]>([]);
  const finished = matches.length >= dilemmas.length;

  const choose = (choice: Choice) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (step === 'p1') {
      setPicks([choice, null]);
      setStep('p2');
    } else if (step === 'p2') {
      setPicks([picks[0], choice]);
      setStep('reveal');
      const matched = picks[0] === choice;
      if (matched) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setMatches([...matches, matched]);
    }
  };

  const next = () => {
    if (matches.length >= dilemmas.length) {
      updateDailyStreak();
    }
    setRound(round + 1);
    setStep('p1');
    setPicks([null, null]);
  };

  const restart = () => {
    setDilemmas(draw());
    setRound(0);
    setStep('p1');
    setPicks([null, null]);
    setMatches([]);
  };

  if (finished && round >= dilemmas.length) {
    const score = matches.filter(Boolean).length;
    return (
      <Screen glows={GLOWS}>
        <GameHeader title={t('games.wouldyourather.results')} />
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <View style={styles.resultCard}>
            <Text style={styles.resultKicker}>{t('games.wouldyourather.sameTaste')}</Text>
            <Text style={styles.resultValue}>{score}/{matches.length}</Text>
            <Text style={styles.resultSub}>{t(score >= matches.length * 0.75 ? 'games.wouldyourather.verdictHigh' : score >= matches.length * 0.4 ? 'games.wouldyourather.verdictMid' : 'games.wouldyourather.verdictLow')}</Text>
          </View>
          <Button label={t('games.wouldyourather.playAgain')} onPress={restart} variant="accent" />
        </ScrollView>
      </Screen>
    );
  }

  const [a, b] = dilemmas[round];
  const chooser = step === 'p1' ? 0 : 1;
  const matched = matches[round];

  return (
    <Screen glows={GLOWS}>
      <GameHeader title={t('games.wouldyourather.title')} step={round + 1} total={dilemmas.length} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 'reveal' ? (
          <View style={[styles.banner, { backgroundColor: matched ? colors.mint : colors.surfaceRaised }]}>
            <Feather name={matched ? 'heart' : 'shuffle'} size={18} color={matched ? colors.bg : colors.text} />
            <Text style={[styles.bannerText, { color: matched ? colors.bg : colors.text }]}>
              {t(matched ? 'games.wouldyourather.match' : 'games.wouldyourather.noMatch')}
            </Text>
          </View>
        ) : (
          <View style={styles.turn}>
            <Text style={[styles.turnName, { color: PLAYER_COLORS[chooser] }]}>{names[chooser]}</Text>
            <Text style={styles.turnHint}>{t('games.wouldyourather.secretPick', { other: names[chooser === 0 ? 1 : 0] })}</Text>
          </View>
        )}

        <Text style={styles.prompt}>{t('games.wouldyourather.prompt')}</Text>

        {[a, b].map((label, i) => {
          const option = i as Choice;
          const pickedBy = step === 'reveal' ? ([0, 1] as const).filter((p) => picks[p] === option) : [];
          return (
            <Pressable
              key={i}
              onPress={() => choose(option)}
              disabled={step === 'reveal'}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.option,
                { borderColor: OPTION_COLORS[i] },
                step === 'reveal' && pickedBy.length === 0 && { opacity: 0.45 },
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={[styles.optionLetter, { color: OPTION_COLORS[i] }]}>{i === 0 ? 'A' : 'B'}</Text>
              <Text style={styles.optionText}>{label}</Text>
              {pickedBy.length > 0 && (
                <View style={styles.pickedRow}>
                  {pickedBy.map((p) => (
                    <Text key={p} style={[styles.pickedBy, { backgroundColor: PLAYER_COLORS[p] }]} numberOfLines={1}>{names[p]}</Text>
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {step === 'reveal' && (
        <View style={styles.footer}>
          <Button label={t(round + 1 >= dilemmas.length ? 'games.wouldyourather.seeResults' : 'games.wouldyourather.next')} onPress={next} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.screen, paddingTop: 24, paddingBottom: 16, gap: 14 },
  turn: { alignItems: 'center', gap: 4 },
  turnName: { fontFamily: fonts.extrabold, fontSize: 22 },
  turnHint: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 14, textAlign: 'center' },
  banner: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 16, height: 44, borderRadius: radius.pill },
  bannerText: { fontFamily: fonts.extrabold, fontSize: 15 },
  prompt: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 24, textAlign: 'center', marginVertical: 6 },
  option: {
    minHeight: 150, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1.5,
    padding: 22, gap: 8, justifyContent: 'center',
  },
  optionLetter: { fontFamily: fonts.extrabold, fontSize: 14, letterSpacing: 1.5 },
  optionText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 28 },
  pickedRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  pickedBy: {
    overflow: 'hidden', color: colors.bg, fontFamily: fonts.extrabold, fontSize: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, maxWidth: 140,
  },
  footer: { paddingHorizontal: spacing.screen, paddingBottom: 12 },

  resultsContent: { padding: spacing.screen, paddingTop: 28, gap: 16 },
  resultCard: {
    alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, borderRadius: radius.xxl,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(134,239,172,0.4)', gap: 4,
  },
  resultKicker: { color: colors.mint, fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase' },
  resultValue: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 72, lineHeight: 80 },
  resultSub: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 15, textAlign: 'center' },
});
