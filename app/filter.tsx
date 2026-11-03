import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, GestureResponderEvent, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { WithCoupleNames } from '@/components/ui/WithCoupleNames';
import { Secret, SecretRound, Side, otherSide } from '@/components/wouldyourather/SecretRound';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import questionsEn from '@/data/questions-en.json';
import questionsFr from '@/data/questions-fr.json';
import whoEn from '@/data/whoofus-en.json';
import whoFr from '@/data/whoofus-fr.json';
import { CoupleNames } from '@/utils/couple';
import { byLanguage, shuffle } from '@/utils/random';
import { updateDailyStreak } from '@/utils/streak';

type Mode = 'whoofus' | 'wouldyourather' | 'questions';
const MODES: Mode[] = ['whoofus', 'wouldyourather', 'questions'];
const isMode = (value: unknown): value is Mode => MODES.includes(value as Mode);
const SIDE_COLORS = [colors.pink, colors.cyan] as const;
/** Délais successifs de la roulette : elle accélère puis ralentit avant de s'arrêter. */
const ROULETTE_STEPS = [90, 80, 70, 70, 70, 80, 90, 110, 130, 160, 200, 250, 320, 400];

const randomSide = (): Side => (Math.random() < 0.5 ? 0 : 1);

export default function FilterScreen() {
  const { t, i18n } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: Mode = isMode(params.mode) ? params.mode : 'whoofus';

  if (!permission) return <Screen><View /></Screen>;

  if (!permission.granted) {
    return (
      <Screen style={styles.permission}>
        <View style={styles.permissionIcon}>
          <Feather name="camera" size={28} color={colors.bg} />
        </View>
        <Text style={styles.permissionTitle}>{t('filter.permissionTitle')}</Text>
        <Text style={styles.permissionBody}>{t('filter.permissionBody')}</Text>
        <Button label={t('filter.allowCamera')} onPress={requestPermission} variant="accent" style={{ alignSelf: 'stretch' }} />
      </Screen>
    );
  }

  return (
    <WithCoupleNames title={t('filter.title')}>
      {(names) =>
        mode === 'wouldyourather' ? (
          <WouldYouRatherFilter key={i18n.language} names={names} />
        ) : (
          <Filter key={i18n.language} names={names} mode={mode} />
        )
      }
    </WithCoupleNames>
  );
}

/** Tu préfères : réponses secrètes hors caméra, puis l'autre devine devant la caméra. */
function WouldYouRatherFilter({ names }: { names: CoupleNames }) {
  const { t } = useTranslation();
  const [secret, setSecret] = useState<Secret | null>(null);
  const [gameId, setGameId] = useState(0);

  if (!secret) {
    return (
      <SecretRound
        key={gameId}
        names={names}
        startLabel={t('games.wouldyourather.handoffFilter')}
        onReady={setSecret}
      />
    );
  }

  return (
    <Filter
      key={gameId}
      names={names}
      mode="wouldyourather"
      secret={secret}
      onRestart={() => {
        setSecret(null);
        setGameId((id) => id + 1);
      }}
    />
  );
}

interface FilterProps {
  names: CoupleNames;
  mode: Mode;
  /** Tu préfères uniquement : les réponses à deviner. */
  secret?: Secret;
  onRestart?: () => void;
}

function Filter({ names, mode, secret, onRestart }: FilterProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [filming, setFilming] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const sideNames: CoupleNames = swapped ? [names[1], names[0]] : names;

  // Paquet de cartes mélangé
  const [deck] = useState<(string | string[])[]>(() => {
    if (mode === 'wouldyourather') return secret?.dilemmas ?? [];
    if (mode === 'whoofus') return shuffle(byLanguage(i18n.language, { fr: whoFr, en: whoEn }));
    const q = byLanguage(i18n.language, { fr: questionsFr, en: questionsEn });
    return shuffle([...q.light, ...q.deep]);
  });
  const [index, setIndex] = useState(0);

  // Roulette « Qui de nous deux »
  const [highlight, setHighlight] = useState<Side | null>(null);
  const [rolling, setRolling] = useState(false);
  const [picked, setPicked] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // « Tu préfères » : choix deviné et score
  const [guess, setGuess] = useState<Side | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  // Animations : entrée de chaque carte, côté choisi, verdict
  const [cardAnim] = useState(() => new Animated.Value(1));
  const [pickAnim] = useState(() => new Animated.Value(0));
  const popCard = () => {
    cardAnim.setValue(0);
    Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }).start();
  };
  const popPick = () => {
    pickAnim.setValue(0);
    Animated.spring(pickAnim, { toValue: 1, useNativeDriver: true, friction: 4, tension: 90 }).start();
  };

  const resetRound = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setHighlight(null);
    setRolling(false);
    setPicked(false);
    setGuess(null);
    pickAnim.setValue(0);
  };

  const nextCard = () => {
    resetRound();
    if (mode === 'wouldyourather' && index + 1 >= deck.length) {
      setFinished(true);
      updateDailyStreak();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      setIndex((i) => (i + 1) % deck.length);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    popCard();
  };

  const spin = () => {
    setRolling(true);
    setPicked(false);
    const target = randomSide();
    // Le nombre d'étapes est pair : on commence sur le côté opposé pour finir sur la cible
    let side: Side = ROULETTE_STEPS.length % 2 === 0 ? otherSide(target) : target;
    let elapsed = 0;
    ROULETTE_STEPS.forEach((delay, i) => {
      elapsed += delay;
      const current = side;
      timers.current.push(
        setTimeout(() => {
          setHighlight(current);
          Haptics.selectionAsync().catch(() => {});
          if (i === ROULETTE_STEPS.length - 1) {
            setRolling(false);
            setPicked(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            popPick();
          }
        }, elapsed)
      );
      side = otherSide(side);
    });
  };

  const makeGuess = (side: Side) => {
    if (!secret) return;
    const correct = secret.answers[index] === side;
    setGuess(side);
    setResults((r) => [...r, correct]);
    Haptics.notificationAsync(correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
    popPick();
  };

  // Un appui fait avancer le jeu. Pour « Tu préfères », le côté touché est la réponse devinée.
  const onTap = (e: GestureResponderEvent) => {
    if (rolling) return;
    if (mode === 'wouldyourather') {
      if (finished) onRestart?.();
      else if (guess === null) makeGuess(e.nativeEvent.pageX < width / 2 ? 0 : 1);
      else nextCard();
    } else if (mode === 'whoofus' && !picked) spin();
    else nextCard();
  };

  const card = deck[index];
  const cardStyle = {
    opacity: cardAnim,
    transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
  };
  const pickScale = pickAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const verdictStyle = {
    opacity: pickAnim,
    transform: [
      { scale: pickAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
      { rotate: '-6deg' },
    ],
  };

  const isWyr = mode === 'wouldyourather' && secret;
  const answerer = secret?.answerer ?? 0;
  const guesser = otherSide(answerer);
  const score = results.filter(Boolean).length;
  const lastCorrect = results[results.length - 1];
  const sidesBottom = insets.bottom + (filming ? 40 : 150);

  const hint = (() => {
    if (isWyr) return finished ? t('filter.hintRestart') : guess === null ? t('filter.hintGuess') : t('filter.hintNext');
    if (mode === 'whoofus' && !picked) return t('filter.hintSpin');
    return t('filter.hintNext');
  })();

  return (
    <View style={styles.root}>
      <CameraView style={StyleSheet.absoluteFill} facing="front" mirror />

      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onTap}
        onLongPress={() => filming && setFilming(false)}
        delayLongPress={700}
        accessibilityRole="button"
        accessibilityLabel={t('filter.tapToPlay')}
      >
        {isWyr && finished ? (
          <View style={styles.endWrap} pointerEvents="none">
            <Animated.View style={[styles.endCard, cardStyle]}>
              <Text style={styles.endKicker}>
                {t('games.wouldyourather.resultKicker', { guesser: names[guesser], answerer: names[answerer] })}
              </Text>
              <Text style={styles.endValue}>{Math.round((score / Math.max(results.length, 1)) * 100)}%</Text>
              <Text style={styles.endScore}>{score}/{results.length}</Text>
            </Animated.View>
          </View>
        ) : (
          <>
            {/* Carte du jeu, en haut */}
            <View style={[styles.top, { paddingTop: insets.top + (filming ? 24 : 72) }]} pointerEvents="none">
              <View style={styles.kickerRow}>
                <Text style={styles.kicker}>
                  {isWyr ? t('games.wouldyourather.guessKicker', { guesser: names[guesser] }) : t(`filter.kickers.${mode}`)}
                </Text>
                {isWyr && results.length > 0 && <Text style={styles.scorePill}>{score}/{results.length}</Text>}
              </View>
              <Animated.View style={[styles.card, cardStyle]}>
                <Text style={styles.cardText}>
                  {isWyr ? t('games.wouldyourather.guessQuestion', { answerer: names[answerer] }) : (card as string)}
                </Text>
              </Animated.View>
            </View>

            {/* Verdict de « Tu préfères » */}
            {isWyr && guess !== null && (
              <View style={styles.verdictWrap} pointerEvents="none">
                <Animated.Text style={[styles.verdict, { backgroundColor: lastCorrect ? colors.mint : colors.pink }, verdictStyle]}>
                  {t(lastCorrect ? 'games.wouldyourather.right' : 'games.wouldyourather.wrong')}
                </Animated.Text>
              </View>
            )}

            {/* Bas de l'écran : les deux côtés */}
            {mode !== 'questions' && (
              <View style={[styles.sides, { bottom: sidesBottom }]} pointerEvents="none">
                {([0, 1] as const).map((side) => {
                  if (isWyr) {
                    const revealed = guess !== null;
                    const isAnswer = revealed && secret.answers[index] === side;
                    return (
                      <Animated.View
                        key={side}
                        style={[
                          styles.side,
                          styles.sideOption,
                          { backgroundColor: !revealed || isAnswer ? SIDE_COLORS[side] : 'rgba(18,16,34,0.75)' },
                          isAnswer && { transform: [{ scale: pickScale }] },
                        ]}
                      >
                        {isAnswer && (
                          <Text style={styles.answerTag} numberOfLines={1}>
                            {t('games.wouldyourather.answerTag', { name: names[answerer] })}
                          </Text>
                        )}
                        <Text
                          style={[styles.sideText, styles.sideOptionText, { color: !revealed || isAnswer ? colors.bg : colors.text }]}
                          numberOfLines={4}
                        >
                          {(card as string[])[side]}
                        </Text>
                      </Animated.View>
                    );
                  }
                  const lit = highlight === side;
                  const isPick = picked && lit;
                  return (
                    <Animated.View
                      key={side}
                      style={[
                        styles.side,
                        side === 1 && styles.sideRight,
                        { backgroundColor: lit ? SIDE_COLORS[side] : 'rgba(18,16,34,0.75)' },
                        isPick && { transform: [{ scale: pickScale }] },
                      ]}
                    >
                      {side === 0 && <Feather name="arrow-left" size={20} color={lit ? colors.bg : colors.text} />}
                      <Text style={[styles.sideText, { color: lit ? colors.bg : colors.text }]} numberOfLines={1}>
                        {sideNames[side]}
                      </Text>
                      {side === 1 && <Feather name="arrow-right" size={20} color={lit ? colors.bg : colors.text} />}
                    </Animated.View>
                  );
                })}
              </View>
            )}

            {isWyr && guess === null && (
              <View style={[styles.orWrap, { bottom: sidesBottom }]} pointerEvents="none">
                <Text style={styles.or}>{t('filter.or')}</Text>
              </View>
            )}
          </>
        )}

        {/* Signature */}
        <View style={[styles.brand, { bottom: insets.bottom + (filming ? 12 : 120) }]} pointerEvents="none">
          <Text style={styles.brandText}>Play2Gether</Text>
        </View>
      </Pressable>

      {!filming && (
        <>
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('common.backLabel')} style={styles.iconBtn}>
              <Feather name="x" size={22} color={colors.text} />
            </Pressable>
            <View style={styles.titlePill}>
              <Feather name="video" size={14} color={colors.pink} />
              <Text style={styles.titleText} numberOfLines={1}>{t(`games.${mode}.title`)}</Text>
            </View>
            {mode === 'whoofus' ? (
              <Pressable onPress={() => setSwapped((s) => !s)} accessibilityRole="button" accessibilityLabel={t('filter.swap')} style={styles.iconBtn}>
                <Feather name="repeat" size={20} color={colors.text} />
              </Pressable>
            ) : (
              <View style={styles.iconSpacer} />
            )}
          </View>

          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
            <Text style={styles.hint}>{hint}</Text>
            <Button
              label={t('filter.startFilming')}
              onPress={() =>
                Alert.alert(t('filter.filmingTitle'), t('filter.filmingBody'), [
                  { text: t('filter.filmingCancel'), style: 'cancel' },
                  { text: t('filter.filmingGo'), onPress: () => setFilming(true) },
                ])
              }
              variant="accent"
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  permission: { alignItems: 'center', justifyContent: 'center', padding: spacing.screen, gap: 16 },
  permissionIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  permissionTitle: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 24, textAlign: 'center' },
  permissionBody: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 15, textAlign: 'center', lineHeight: 21, marginBottom: 8 },

  top: { position: 'absolute', left: 16, right: 16, alignItems: 'center', gap: 10 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kicker: {
    overflow: 'hidden', backgroundColor: colors.yellow, color: colors.bg, fontFamily: fonts.extrabold, fontSize: 12,
    letterSpacing: 1.8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, textTransform: 'uppercase',
  },
  scorePill: {
    overflow: 'hidden', backgroundColor: colors.bg, color: colors.text, fontFamily: fonts.extrabold, fontSize: 13,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill,
  },
  card: {
    backgroundColor: colors.bg, borderRadius: radius.lg, paddingHorizontal: 18, paddingVertical: 14,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  cardText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 30, textAlign: 'center' },

  verdictWrap: { position: 'absolute', left: 0, right: 0, top: '42%', alignItems: 'center' },
  verdict: {
    overflow: 'hidden', color: colors.bg, fontFamily: fonts.extrabold, fontSize: 34,
    paddingHorizontal: 22, paddingVertical: 10, borderRadius: radius.lg,
  },

  sides: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  side: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 52, paddingHorizontal: 18, borderRadius: radius.pill, maxWidth: '48%' },
  sideRight: { justifyContent: 'flex-end' },
  sideText: { fontFamily: fonts.extrabold, fontSize: 20, flexShrink: 1 },
  sideOption: {
    flex: 1, flexDirection: 'column', height: 'auto', minHeight: 110, borderRadius: radius.lg, paddingVertical: 14,
    justifyContent: 'center', maxWidth: undefined,
  },
  sideOptionText: { fontSize: 18, lineHeight: 22, textAlign: 'center' },
  answerTag: {
    overflow: 'hidden', backgroundColor: colors.bg, color: colors.text, fontFamily: fonts.extrabold, fontSize: 11,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, maxWidth: '100%',
  },
  orWrap: { position: 'absolute', left: 0, right: 0, height: 110, alignItems: 'center', justifyContent: 'center' },
  or: {
    overflow: 'hidden', backgroundColor: colors.bg, color: colors.yellow, fontFamily: fonts.extrabold, fontSize: 14,
    width: 44, height: 44, lineHeight: 44, textAlign: 'center', borderRadius: 22,
  },

  endWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: 24 },
  endCard: { alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.xxl, paddingVertical: 26, paddingHorizontal: 28, gap: 2 },
  endKicker: { color: colors.mint, fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center' },
  endValue: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 80, lineHeight: 88 },
  endScore: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 16 },

  brand: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  brandText: {
    overflow: 'hidden', backgroundColor: 'rgba(18,16,34,0.75)', color: colors.pink, fontFamily: fonts.extrabold, fontSize: 12,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill,
  },

  header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(18,16,34,0.7)', alignItems: 'center', justifyContent: 'center' },
  iconSpacer: { width: 44, height: 44 },
  titlePill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44,
    backgroundColor: 'rgba(18,16,34,0.7)', borderRadius: radius.pill, paddingHorizontal: 14,
  },
  titleText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 15, flexShrink: 1 },

  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.screen, gap: 10 },
  hint: {
    alignSelf: 'center', overflow: 'hidden', color: colors.text, fontFamily: fonts.bold, fontSize: 13,
    backgroundColor: 'rgba(18,16,34,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill,
  },
});
