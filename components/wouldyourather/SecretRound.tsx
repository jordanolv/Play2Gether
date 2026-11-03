import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { GameHeader } from '@/components/ui/GameHeader';
import { Glow, Screen } from '@/components/ui/Screen';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import dilemmasEn from '@/data/wouldyourather-en.json';
import dilemmasFr from '@/data/wouldyourather-fr.json';
import { CoupleNames } from '@/utils/couple';
import { byLanguage, pickRandom } from '@/utils/random';

export const WYR_ROUNDS = 8;
export const PLAYER_COLORS = [colors.pink, colors.cyan] as const;
export const OPTION_COLORS = [colors.mint, colors.yellow] as const;

export type Side = 0 | 1;

/** Réponses secrètes d'un joueur, que l'autre doit deviner. */
export interface Secret {
  answerer: Side;
  dilemmas: string[][];
  answers: Side[];
}

export const otherSide = (side: Side): Side => (side === 0 ? 1 : 0);

interface Props {
  names: CoupleNames;
  glows?: Glow[];
  /** Joueur qui répond, s'il est déjà connu (ex. « inverser les rôles »). */
  initialAnswerer?: Side;
  /** Libellé du bouton final : « C'est parti » ou « Lancer la caméra ». */
  startLabel: string;
  onReady: (secret: Secret) => void;
}

/** Première phase : un joueur répond en secret aux dilemmes. */
export function SecretRound({ names, glows, initialAnswerer, startLabel, onReady }: Props) {
  const { t, i18n } = useTranslation();
  const [dilemmas] = useState<string[][]>(() =>
    pickRandom(byLanguage(i18n.language, { fr: dilemmasFr, en: dilemmasEn }), WYR_ROUNDS)
  );
  const [answerer, setAnswerer] = useState<Side | null>(initialAnswerer ?? null);
  const [answers, setAnswers] = useState<Side[]>([]);

  if (answerer === null) {
    return (
      <Screen glows={glows}>
        <GameHeader title={t('games.wouldyourather.title')} />
        <View style={styles.center}>
          <Text style={styles.title}>{t('games.wouldyourather.whoAnswers')}</Text>
          <Text style={styles.sub}>{t('games.wouldyourather.whoAnswersSub')}</Text>
          <View style={styles.playersRow}>
            {([0, 1] as const).map((p) => (
              <Pressable
                key={p}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  setAnswerer(p);
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.playerBtn, { backgroundColor: PLAYER_COLORS[p] }, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.playerBtnText} numberOfLines={1}>{names[p]}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Screen>
    );
  }

  const guesser = otherSide(answerer);

  if (answers.length >= dilemmas.length) {
    return (
      <Screen glows={glows}>
        <GameHeader title={t('games.wouldyourather.title')} />
        <View style={styles.center}>
          <View style={[styles.doneIcon, { backgroundColor: PLAYER_COLORS[guesser] }]}>
            <Feather name="lock" size={26} color={colors.bg} />
          </View>
          <Text style={styles.title}>{t('games.wouldyourather.handoffTitle')}</Text>
          <Text style={styles.sub}>
            {t('games.wouldyourather.handoffBody', { guesser: names[guesser], answerer: names[answerer] })}
          </Text>
          <Button
            label={startLabel}
            onPress={() => onReady({ answerer, dilemmas, answers })}
            variant="accent"
            style={{ alignSelf: 'stretch', marginTop: 8 }}
          />
        </View>
      </Screen>
    );
  }

  const round = answers.length;
  const choose = (side: Side) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setAnswers([...answers, side]);
  };

  return (
    <Screen glows={glows}>
      <GameHeader title={t('games.wouldyourather.title')} step={round + 1} total={dilemmas.length} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.warning}>
          <Feather name="eye-off" size={15} color={colors.bg} />
          <Text style={styles.warningText} numberOfLines={1}>
            {t('games.wouldyourather.dontLook', { other: names[guesser] })}
          </Text>
        </View>
        <Text style={styles.prompt}>
          <Text style={{ color: PLAYER_COLORS[answerer] }}>{names[answerer]}</Text>
          {t('games.wouldyourather.secretPrompt')}
        </Text>
        {dilemmas[round].map((label, i) => (
          <Pressable
            key={`${round}-${i}`}
            onPress={() => choose(i as Side)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.option, { borderColor: OPTION_COLORS[i] }, pressed && { transform: [{ scale: 0.98 }] }]}
          >
            <Text style={[styles.optionLetter, { color: OPTION_COLORS[i] }]}>{i === 0 ? 'A' : 'B'}</Text>
            <Text style={styles.optionText}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

export const wyrStyles = StyleSheet.create({
  option: {
    minHeight: 140, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth: 1.5,
    padding: 22, gap: 8, justifyContent: 'center',
  },
  optionLetter: { fontFamily: fonts.extrabold, fontSize: 14, letterSpacing: 1.5 },
  optionText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 28 },
  prompt: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 24, textAlign: 'center', marginVertical: 6 },
});

const styles = StyleSheet.create({
  ...wyrStyles,
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.screen, gap: 12, alignItems: 'center' },
  title: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 28, textAlign: 'center', letterSpacing: -0.5 },
  sub: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21, textAlign: 'center', marginBottom: 8 },
  playersRow: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  playerBtn: { flex: 1, height: 64, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  playerBtnText: { color: colors.bg, fontFamily: fonts.extrabold, fontSize: 20 },
  doneIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  content: { paddingHorizontal: spacing.screen, paddingTop: 20, paddingBottom: 16, gap: 14 },
  warning: {
    flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 8, maxWidth: '100%',
    backgroundColor: colors.yellow, borderRadius: radius.pill, paddingHorizontal: 14, height: 34,
  },
  warningText: { color: colors.bg, fontFamily: fonts.extrabold, fontSize: 13, flexShrink: 1 },
});
