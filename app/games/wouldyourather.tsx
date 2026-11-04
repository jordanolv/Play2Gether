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
import {
  OPTION_COLORS, PLAYER_COLORS, Secret, SecretRound, Side, otherSide, wyrStyles,
} from '@/components/wouldyourather/SecretRound';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { CoupleNames } from '@/utils/couple';
import { updateDailyStreak } from '@/utils/streak';

const GLOWS = [
  { color: colors.mint, size: 420, top: -160, right: -160 },
  { color: colors.yellow, size: 340, bottom: 40, left: -180 },
];

export default function WouldYouRatherScreen() {
  const { t, i18n } = useTranslation();
  return (
    <WithCoupleNames title={t('games.wouldyourather.title')} glows={GLOWS}>
      {(names) => <WouldYouRatherGame key={i18n.language} names={names} />}
    </WithCoupleNames>
  );
}

/** Un joueur répond en secret, puis l'autre devine ses choix. */
function WouldYouRatherGame({ names }: { names: CoupleNames }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [secret, setSecret] = useState<Secret | null>(null);
  // Change à chaque partie pour repartir d'un tirage neuf
  const [gameId, setGameId] = useState(0);
  const [nextAnswerer, setNextAnswerer] = useState<Side | undefined>(undefined);

  const restart = (answerer?: Side) => {
    setNextAnswerer(answerer);
    setSecret(null);
    setGameId((id) => id + 1);
  };

  if (!secret) {
    return (
      <SecretRound
        key={gameId}
        names={names}
        glows={GLOWS}
        initialAnswerer={nextAnswerer}
        startLabel={t('games.wouldyourather.handoffScreen')}
        onReady={setSecret}
        onFilm={() => router.push({ pathname: '/filter', params: { mode: 'wouldyourather' } })}
      />
    );
  }

  return <GuessRound secret={secret} names={names} onRestart={restart} />;
}

function GuessRound({ secret, names, onRestart }: { secret: Secret; names: CoupleNames; onRestart: (answerer?: Side) => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { answerer, dilemmas, answers } = secret;
  const guesser = otherSide(answerer);
  const [results, setResults] = useState<boolean[]>([]);
  const [guess, setGuess] = useState<Side | null>(null);
  const [round, setRound] = useState(0);

  const choose = (side: Side) => {
    const correct = answers[round] === side;
    Haptics.notificationAsync(correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
    setGuess(side);
    const next = [...results, correct];
    setResults(next);
    if (next.length === dilemmas.length) updateDailyStreak();
  };

  const next = () => {
    setGuess(null);
    setRound(round + 1);
  };

  if (round >= dilemmas.length) {
    const score = results.filter(Boolean).length;
    const ratio = score / results.length;
    return (
      <Screen glows={GLOWS}>
        <GameHeader title={t('games.wouldyourather.results')} />
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <View style={styles.resultCard}>
            <Text style={styles.resultKicker}>
              {t('games.wouldyourather.resultKicker', { guesser: names[guesser], answerer: names[answerer] })}
            </Text>
            <Text style={styles.resultValue}>{Math.round(ratio * 100)}%</Text>
            <Text style={styles.resultScore}>{score}/{results.length}</Text>
            <Text style={styles.resultSub}>
              {t(ratio >= 0.75 ? 'games.wouldyourather.verdictHigh' : ratio >= 0.4 ? 'games.wouldyourather.verdictMid' : 'games.wouldyourather.verdictLow')}
            </Text>
          </View>
          <Button
            label={t('games.wouldyourather.swapRoles', { name: names[guesser] })}
            onPress={() => onRestart(guesser)}
            variant="accent"
          />
          <Button label={t('games.wouldyourather.playAgain')} onPress={() => onRestart()} />
        </ScrollView>
      </Screen>
    );
  }

  const correct = guess !== null ? guess === answers[round] : null;

  return (
    <Screen glows={GLOWS}>
      <GameHeader
        title={t('games.wouldyourather.title')}
        step={round + 1}
        total={dilemmas.length}
        onFilm={() =>
          router.push({
            pathname: '/filter',
            params: { mode: 'wouldyourather', secret: JSON.stringify({ ...secret, dilemmas: dilemmas.slice(round), answers: answers.slice(round) }) },
          })
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {correct === null ? (
          <View style={[styles.banner, { backgroundColor: PLAYER_COLORS[guesser] }]}>
            <Text style={[styles.bannerText, { color: colors.bg }]}>
              {t('games.wouldyourather.guessKicker', { guesser: names[guesser] })}
            </Text>
          </View>
        ) : (
          <View style={[styles.banner, { backgroundColor: correct ? colors.mint : colors.pink }]}>
            <Feather name={correct ? 'check' : 'x'} size={18} color={colors.bg} />
            <Text style={[styles.bannerText, { color: colors.bg }]}>
              {t(correct ? 'games.wouldyourather.right' : 'games.wouldyourather.wrong')}
            </Text>
          </View>
        )}

        <Text style={wyrStyles.prompt}>
          {t('games.wouldyourather.guessQuestion', { answerer: names[answerer] })}
        </Text>

        {dilemmas[round].map((label, i) => {
          const side = i as Side;
          const isAnswer = guess !== null && answers[round] === side;
          return (
            <Pressable
              key={i}
              onPress={() => choose(side)}
              disabled={guess !== null}
              accessibilityRole="button"
              style={({ pressed }) => [
                wyrStyles.option,
                { borderColor: OPTION_COLORS[i] },
                guess !== null && !isAnswer && { opacity: 0.4 },
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={[wyrStyles.optionLetter, { color: OPTION_COLORS[i] }]}>{i === 0 ? 'A' : 'B'}</Text>
              <Text style={wyrStyles.optionText}>{label}</Text>
              {guess !== null && (isAnswer || guess === side) && (
                <View style={styles.tags}>
                  {isAnswer && (
                    <Text style={[styles.tag, { backgroundColor: PLAYER_COLORS[answerer] }]} numberOfLines={1}>
                      {t('games.wouldyourather.answerTag', { name: names[answerer] })}
                    </Text>
                  )}
                  {guess === side && (
                    <Text style={[styles.tag, { backgroundColor: PLAYER_COLORS[guesser] }]} numberOfLines={1}>
                      {t('games.wouldyourather.guessTag', { name: names[guesser] })}
                    </Text>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {guess !== null && (
        <View style={styles.footer}>
          <Button
            label={t(round + 1 >= dilemmas.length ? 'games.wouldyourather.seeResults' : 'games.wouldyourather.next')}
            onPress={next}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.screen, paddingTop: 24, paddingBottom: 16, gap: 14 },
  banner: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 16, height: 40, borderRadius: radius.pill },
  bannerText: { fontFamily: fonts.extrabold, fontSize: 14 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  tag: {
    overflow: 'hidden', color: colors.bg, fontFamily: fonts.extrabold, fontSize: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, maxWidth: 180,
  },
  footer: { paddingHorizontal: spacing.screen, paddingBottom: 12 },

  resultsContent: { padding: spacing.screen, paddingTop: 28, gap: 16 },
  resultCard: {
    alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, borderRadius: radius.xxl,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(134,239,172,0.4)', gap: 4,
  },
  resultKicker: { color: colors.mint, fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', textAlign: 'center' },
  resultValue: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 72, lineHeight: 80 },
  resultScore: { color: colors.text, fontFamily: fonts.bold, fontSize: 16 },
  resultSub: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 15, textAlign: 'center', marginTop: 6 },
});
