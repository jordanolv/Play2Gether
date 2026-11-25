import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Movable, usePlacement } from '@/components/filter/Movable';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { WithCoupleNames } from '@/components/ui/WithCoupleNames';
import { Secret, SecretRound, Side, otherSide } from '@/components/wouldyourather/SecretRound';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import whoEn from '@/data/whoofus-en.json';
import whoFr from '@/data/whoofus-fr.json';
import { CoupleGenders, CoupleNames } from '@/utils/couple';
import { getBacRound, getRandomWords } from '@/utils/gameWords';
import { byLanguage } from '@/utils/random';
import { drawFresh } from '@/utils/seen';
import { updateDailyStreak } from '@/utils/streak';
import { TOD_FILTER_LEVELS, TOD_KIND_COLORS, TOD_LEVEL_COLORS, TodKind, TodLevel, useTodDecks } from '@/utils/truthordare';

type Mode = 'whoofus' | 'wouldyourather' | 'truthordare' | 'password' | 'scattergories';
const MODES: Mode[] = ['whoofus', 'wouldyourather', 'truthordare', 'password', 'scattergories'];
const isMode = (value: unknown): value is Mode => MODES.includes(value as Mode);
const TOD_KINDS: TodKind[] = ['truth', 'dare'];
const SIDE_COLORS = [colors.pink, colors.cyan] as const;
const DIM = 'rgba(18,16,34,0.75)';
/** Délais successifs de la roulette : elle accélère puis ralentit avant de s'arrêter. */
const ROULETTE_STEPS = [90, 80, 70, 70, 70, 80, 90, 110, 130, 160, 200, 250, 320, 400];
const PASSWORD_DECK = 60;

const randomSide = (): Side => (Math.random() < 0.5 ? 0 : 1);

/** Réponses secrètes transmises par l'écran « Tu préfères » quand on passe en caméra en cours de partie. */
function parseSecret(raw: string | undefined): Secret | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    const valid =
      (value.answerer === 0 || value.answerer === 1) &&
      Array.isArray(value.dilemmas) && Array.isArray(value.answers) &&
      value.dilemmas.length > 0 && value.dilemmas.length === value.answers.length;
    return valid ? (value as Secret) : null;
  } catch {
    return null;
  }
}

export default function FilterScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const params = useLocalSearchParams<{ mode?: string; level?: string; secret?: string }>();
  const mode: Mode = isMode(params.mode) ? params.mode : 'whoofus';
  const level = TOD_FILTER_LEVELS.find((l) => l === params.level) ?? 'couple';
  const initialSecret = parseSecret(params.secret);

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
        <Button label={t('filter.playClassic')} onPress={() => router.replace(`/games/${mode}` as any)} variant="ghost" style={{ alignSelf: 'stretch' }} />
      </Screen>
    );
  }

  return (
    <WithCoupleNames title={t('filter.title')}>
      {(names, _edit, genders) =>
        mode === 'wouldyourather' ? (
          <WouldYouRatherFilter key={i18n.language} names={names} initialSecret={initialSecret} />
        ) : (
          <Filter key={i18n.language} names={names} genders={genders} mode={mode} initialLevel={level} />
        )
      }
    </WithCoupleNames>
  );
}

/** Tu préfères : réponses secrètes hors caméra, puis l'autre devine devant la caméra. */
function WouldYouRatherFilter({ names, initialSecret }: { names: CoupleNames; initialSecret: Secret | null }) {
  const { t } = useTranslation();
  const [secret, setSecret] = useState<Secret | null>(initialSecret);
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
  genders?: CoupleGenders;
  /** Action ou vérité : niveau de départ. */
  initialLevel?: TodLevel;
  mode: Mode;
  /** Tu préfères uniquement : les réponses à deviner. */
  secret?: Secret;
  onRestart?: () => void;
}

function Filter({ names, genders = [null, null], mode, initialLevel = 'couple', secret, onRestart }: FilterProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Les menus restent visibles au départ, se cachent dès qu'on joue, et reviennent en touchant le haut de l'écran
  const [chrome, setChrome] = useState(true);
  const [started, setStarted] = useState(false);
  const sideNames = names;
  const sideGenders = genders;

  // Overlay déplaçable : la carte du haut et les deux côtés du bas
  const cardPlacement = usePlacement();
  const sidesPlacement = usePlacement();

  // Paquet de cartes mélangé
  const [deck] = useState<string[]>(() => {
    if (mode === 'whoofus') return drawFresh(`whoofus.${i18n.language}`, byLanguage(i18n.language, { fr: whoFr, en: whoEn }), 40);
    if (mode === 'password') return getRandomWords(i18n.language, PASSWORD_DECK);
    return [];
  });
  const [index, setIndex] = useState(0);

  // Roulette (« Qui de nous deux », « Action ou vérité »)
  const [highlight, setHighlight] = useState<Side | null>(null);
  const [rolling, setRolling] = useState(false);
  const [picked, setPicked] = useState(false);
  // « Qui de nous deux » : compte à rebours 3, 2, 1… puis « Pointez ! » (0)
  const [count, setCount] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // « Tu préfères » : choix deviné et score
  const [guess, setGuess] = useState<Side | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  // « Action ou vérité » : la roulette désigne un joueur, qui choisit ensuite
  const drawTod = useTodDecks(i18n.language);
  const [todLevel, setTodLevel] = useState<TodLevel>(initialLevel);
  const [todCard, setTodCard] = useState<{ kind: TodKind; text: string } | null>(null);

  // Scores à deux (Petit Bac) ou en équipe (Mot de passe : trouvés / passés)
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [bac, setBac] = useState(() => getBacRound(i18n.language));

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
    setCount(null);
    setGuess(null);
    setTodCard(null);
    pickAnim.setValue(0);
  };

  const nextCard = () => {
    resetRound();
    if (mode === 'wouldyourather' && index + 1 >= (secret?.dilemmas.length ?? 0)) {
      setFinished(true);
      updateDailyStreak();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else if (deck.length > 0) {
      setIndex((i) => (i + 1) % deck.length);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } else {
      setIndex((i) => i + 1);
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

  /** Les deux joueurs pointent la même personne en même temps : pas de tirage au sort. */
  const countdown = () => {
    setRolling(true);
    [3, 2, 1, 0].forEach((n, i) => {
      timers.current.push(
        setTimeout(() => {
          setCount(n);
          popPick();
          if (n > 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          else {
            setRolling(false);
            setPicked(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          }
        }, i * 800)
      );
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

  const point = (side: Side) => {
    const next: [number, number] = [...scores];
    next[side] += 1;
    setScores(next);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  // Un appui fait avancer le jeu. Pour les jeux à deux choix, le côté touché compte.
  const onTap = (x: number) => {
    if (rolling) return;
    setChrome(false);
    setStarted(true);
    const side: Side = x < width / 2 ? 0 : 1;
    switch (mode) {
      case 'wouldyourather':
        if (finished) onRestart?.();
        else if (guess === null) makeGuess(side);
        else nextCard();
        return;
      case 'whoofus':
        // Compte à rebours, puis on touche le côté de la personne pointée, puis question suivante
        if (!picked) countdown();
        else if (highlight === null) {
          setHighlight(side);
          point(side);
          popPick();
        } else nextCard();
        return;
      case 'truthordare':
        if (!picked) spin();
        else if (!todCard) {
          const player = highlight ?? 0;
          const other = otherSide(player);
          const kind = TOD_KINDS[side];
          setTodCard({
            kind,
            text: drawTod(todLevel, kind, {
              player: { name: sideNames[player], gender: sideGenders[player] },
              other: { name: sideNames[other], gender: sideGenders[other] },
            }),
          });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          popCard();
        } else nextCard();
        return;
      case 'password':
        // Gauche : trouvé, droite : on passe
        if (side === 0) point(0);
        else setScores(([found, skipped]) => [found, skipped + 1]);
        nextCard();
        return;
      case 'scattergories':
        // Le côté touché marque le point de la manche
        point(side);
        setBac(getBacRound(i18n.language));
        popCard();
    }
  };


  const cardStyle = {
    opacity: cardAnim,
    transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
  };
  const pickScale = pickAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const verdictStyle = {
    opacity: pickAnim,
    transform: [{ scale: pickAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }, { rotate: '-6deg' }],
  };

  const answerer = secret?.answerer ?? 0;
  const guesser = otherSide(answerer);
  const wyrScore = results.filter(Boolean).length;
  const lastCorrect = results[results.length - 1];
  const sidesBottom = insets.bottom + 64;

  // Contenu de la carte du haut, selon le jeu
  const top = ((): { kicker: string; text: string; sub?: string; score?: string; letters?: string[] } => {
    switch (mode) {
      case 'wouldyourather':
        return {
          kicker: t('games.wouldyourather.guessKicker', { guesser: names[guesser] }),
          text: t('games.wouldyourather.guessQuestion', { answerer: names[answerer] }),
          score: results.length > 0 ? `${wyrScore}/${results.length}` : undefined,
        };
      case 'truthordare':
        if (todCard && highlight !== null) {
          return { kicker: t(`games.truthordare.${todCard.kind}For`, { player: sideNames[highlight] }), text: todCard.text };
        }
        return {
          kicker: t('filter.kickers.truthordare'),
          text: picked && highlight !== null
            ? t('games.truthordare.filterAsk', { player: sideNames[highlight] })
            : t('games.truthordare.filterSpin'),
        };
      case 'password':
        return {
          // Celui qui fait deviner change à chaque mot
          kicker: t('filter.kickers.password', { giver: sideNames[index % 2] }),
          text: deck[index],
          sub: t('filter.passwordSub', { guesser: sideNames[(index + 1) % 2] }),
          score: t('filter.passwordScore', { count: scores[0] }),
        };
      case 'scattergories':
        return { kicker: t('filter.kickers.scattergories'), text: bac.theme, letters: bac.letters };
      default:
        return { kicker: t('filter.kickers.whoofus'), text: deck[index] };
    }
  })();

  const hint = (() => {
    if (!started) return t('filter.hintChrome');
    switch (mode) {
      case 'wouldyourather':
        return finished ? t('filter.hintRestart') : guess === null ? t('filter.hintGuess') : t('filter.hintNext');
      case 'truthordare':
        return !picked ? t('filter.hintSpinTod') : !todCard ? t('filter.hintTod') : t('filter.hintNext');
      case 'whoofus':
        return !picked ? t('filter.hintCountdown') : highlight === null ? t('filter.hintPointed') : t('filter.hintNext');
      case 'password':
        return t('filter.hintPassword');
      default:
        return t('filter.hintBac');
    }
  })();

  /** Boutons du bas : deux côtés colorés, selon le jeu. */
  const renderSides = () => {
    if (mode === 'wouldyourather') {
      const card = secret?.dilemmas[index] ?? [];
      return ([0, 1] as const).map((side) => {
        const revealed = guess !== null;
        const isAnswer = revealed && secret?.answers[index] === side;
        return (
          <Animated.View
            key={side}
            style={[
              styles.side,
              styles.sideOption,
              { backgroundColor: !revealed || isAnswer ? SIDE_COLORS[side] : DIM },
              isAnswer && { transform: [{ scale: pickScale }] },
            ]}
          >
            {isAnswer && (
              <Text style={styles.answerTag} numberOfLines={1}>
                {t('games.wouldyourather.answerTag', { name: names[answerer] })}
              </Text>
            )}
            <Text style={[styles.sideText, styles.sideOptionText, { color: !revealed || isAnswer ? colors.bg : colors.text }]} numberOfLines={4}>
              {card[side]}
            </Text>
          </Animated.View>
        );
      });
    }
    if (mode === 'truthordare' && picked && !todCard) {
      return TOD_KINDS.map((kind) => (
        <View key={kind} style={[styles.side, styles.sideOption, { backgroundColor: TOD_KIND_COLORS[kind], minHeight: 90 }]}>
          <Feather name={kind === 'truth' ? 'message-circle' : 'zap'} size={22} color={colors.bg} />
          <Text style={[styles.sideText, { color: colors.bg }]}>{t(`games.truthordare.${kind}`)}</Text>
        </View>
      ));
    }
    if (mode === 'truthordare' && todCard) return null;
    if (mode === 'password') {
      return [
        { icon: 'check' as const, label: t('filter.found'), color: colors.mint },
        { icon: 'skip-forward' as const, label: t('filter.skip'), color: DIM },
      ].map((b, i) => (
        <View key={i} style={[styles.side, styles.sideWide, { backgroundColor: b.color }]}>
          <Feather name={b.icon} size={18} color={i === 0 ? colors.bg : colors.text} />
          <Text style={[styles.sideText, { color: i === 0 ? colors.bg : colors.text }]}>{b.label}</Text>
        </View>
      ));
    }
    if (mode === 'scattergories') {
      return ([0, 1] as const).map((side) => (
        <View key={side} style={[styles.side, styles.sideWide, { backgroundColor: SIDE_COLORS[side] }]}>
          <Text style={[styles.sideText, { color: colors.bg }]} numberOfLines={1}>{sideNames[side]}</Text>
          <Text style={styles.sideScore}>{scores[side]}</Text>
        </View>
      ));
    }
    // Roulette sur les prénoms
    return ([0, 1] as const).map((side) => {
      const lit = highlight === side;
      return (
        <Animated.View
          key={side}
          style={[
            styles.side,
            side === 1 && styles.sideRight,
            { backgroundColor: lit ? SIDE_COLORS[side] : DIM },
            picked && lit && { transform: [{ scale: pickScale }] },
          ]}
        >
          {side === 0 && <Feather name="arrow-left" size={20} color={lit ? colors.bg : colors.text} />}
          <Text style={[styles.sideText, { color: lit ? colors.bg : colors.text }]} numberOfLines={1}>{sideNames[side]}</Text>
          {mode === 'whoofus' && scores[side] > 0 && <Text style={[styles.sideText, { color: lit ? colors.bg : colors.textMuted }]}>{scores[side]}</Text>}
          {side === 1 && <Feather name="arrow-right" size={20} color={lit ? colors.bg : colors.text} />}
        </Animated.View>
      );
    });
  };

  const sides = renderSides();
  const showOr = (mode === 'wouldyourather' && guess === null && !finished) || (mode === 'truthordare' && picked && !todCard);

  return (
    <View style={styles.root}>
      <CameraView style={StyleSheet.absoluteFill} facing="front" mirror />

      {/* Fond tactile : un appui n'importe où joue */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={(e) => onTap(e.nativeEvent.pageX)}
        accessibilityRole="button"
        accessibilityLabel={t('filter.tapToPlay')}
      />

      {mode === 'wouldyourather' && finished ? (
        <Movable placement={cardPlacement} onTap={onTap} style={styles.endWrap}>
          <Animated.View style={[styles.endCard, cardStyle]}>
            <Text style={styles.endKicker}>
              {t('games.wouldyourather.resultKicker', { guesser: names[guesser], answerer: names[answerer] })}
            </Text>
            <Text style={styles.endValue}>{Math.round((wyrScore / Math.max(results.length, 1)) * 100)}%</Text>
            <Text style={styles.endScore}>{wyrScore}/{results.length}</Text>
          </Animated.View>
        </Movable>
      ) : (
        <>
          {/* Carte du jeu, en haut */}
          <Movable placement={cardPlacement} onTap={onTap} style={[styles.top, { top: insets.top + (mode === 'truthordare' ? 112 : 72) }]}>
            <View style={styles.kickerRow}>
              <Text style={styles.kicker}>{top.kicker}</Text>
              {top.score && <Text style={styles.scorePill}>{top.score}</Text>}
            </View>
            <Animated.View style={[styles.card, cardStyle]}>
              <Text style={[styles.cardText, mode === 'password' && styles.cardWord]}>{top.text}</Text>
              {top.sub && <Text style={styles.cardSub}>{top.sub}</Text>}
              {top.letters && (
                <View style={styles.letters}>
                  {top.letters.map((letter, i) => (
                    <Text key={i} style={[styles.letter, { backgroundColor: SIDE_COLORS[i] }]}>{letter}</Text>
                  ))}
                </View>
              )}
            </Animated.View>
          </Movable>

          {/* Verdict de « Tu préfères » */}
          {mode === 'wouldyourather' && guess !== null && (
            <View style={styles.verdictWrap} pointerEvents="none">
              <Animated.Text style={[styles.verdict, { backgroundColor: lastCorrect ? colors.mint : colors.pink }, verdictStyle]}>
                {t(lastCorrect ? 'games.wouldyourather.right' : 'games.wouldyourather.wrong')}
              </Animated.Text>
            </View>
          )}

          {/* Compte à rebours de « Qui de nous deux » */}
          {mode === 'whoofus' && count !== null && highlight === null && (
            <View style={styles.verdictWrap} pointerEvents="none">
              <Animated.Text style={[styles.verdict, styles.countdown, { backgroundColor: count === 0 ? colors.pink : colors.yellow }, verdictStyle]}>
                {count === 0 ? t('filter.pointNow') : count}
              </Animated.Text>
            </View>
          )}

          {/* Bas de l'écran : les deux côtés */}
          {sides && (
            <Movable placement={sidesPlacement} onTap={onTap} style={[styles.sides, { bottom: sidesBottom }]}>
              {sides}
              {showOr && (
                <View style={styles.orWrap} pointerEvents="none">
                  <Text style={styles.or}>{t('filter.or')}</Text>
                </View>
              )}
            </Movable>
          )}
        </>
      )}

      {/* Signature, remplacée par l'aide quand les menus sont affichés */}
      <View style={[styles.brand, { bottom: insets.bottom + 20 }]} pointerEvents="none">
        {chrome ? <Text style={styles.hint}>{hint}</Text> : <Text style={styles.brandText}>Play2Gether</Text>}
      </View>

      {/* Bande du haut : touche pour réafficher les menus */}
      {!chrome && (
        <Pressable
          style={[styles.chromeZone, { height: insets.top + 64 }]}
          onPress={() => setChrome(true)}
          accessibilityRole="button"
          accessibilityLabel={t('filter.showMenus')}
        >
          <View style={[styles.menusPill, { marginTop: insets.top + 8 }]} pointerEvents="none">
            <Feather name="menu" size={13} color={colors.text} />
            <Text style={styles.menusPillText}>{t('filter.menusPill')}</Text>
          </View>
        </Pressable>
      )}

      {chrome && (
        <>
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('common.backLabel')} style={styles.iconBtn}>
              <Feather name="x" size={22} color={colors.text} />
            </Pressable>
            <View style={styles.titlePill}>
              <Feather name="video" size={14} color={colors.pink} />
              <Text style={styles.titleText} numberOfLines={1}>{t(`games.${mode}.title`)}</Text>
            </View>
            <View style={styles.iconSpacer} />
          </View>

          <View style={[styles.menuBar, { top: insets.top + 60 }]} pointerEvents="box-none">
            {mode === 'truthordare' && (
              <View style={styles.todLevels}>
                {TOD_FILTER_LEVELS.map((l) => (
                  <Pressable
                    key={l}
                    onPress={() => setTodLevel(l)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: l === todLevel }}
                    style={[styles.todLevel, l === todLevel && { backgroundColor: TOD_LEVEL_COLORS[l] }]}
                  >
                    <Text style={[styles.todLevelText, l === todLevel && { color: colors.bg }]}>{t(`games.truthordare.levels.${l}`)}</Text>
                  </Pressable>
                ))}
              </View>
            )}
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
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '100%' },
  kicker: {
    overflow: 'hidden', backgroundColor: colors.yellow, color: colors.bg, fontFamily: fonts.extrabold, fontSize: 12,
    letterSpacing: 1.8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, textTransform: 'uppercase', flexShrink: 1,
  },
  scorePill: {
    overflow: 'hidden', backgroundColor: colors.bg, color: colors.text, fontFamily: fonts.extrabold, fontSize: 13,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill,
  },
  card: {
    backgroundColor: colors.bg, borderRadius: radius.lg, paddingHorizontal: 18, paddingVertical: 14, gap: 6,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  cardText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 30, textAlign: 'center' },
  cardWord: { fontSize: 40, lineHeight: 46, letterSpacing: -0.5 },
  letters: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 4 },
  letter: {
    overflow: 'hidden', width: 52, height: 52, lineHeight: 52, borderRadius: 14, textAlign: 'center',
    color: colors.bg, fontFamily: fonts.extrabold, fontSize: 30,
  },
  cardSub: { color: colors.yellow, fontFamily: fonts.extrabold, fontSize: 15, textAlign: 'center' },

  countdown: { fontSize: 44, color: colors.bg },
  verdictWrap: { position: 'absolute', left: 0, right: 0, top: '42%', alignItems: 'center' },
  verdict: {
    overflow: 'hidden', color: colors.bg, fontFamily: fonts.extrabold, fontSize: 34,
    paddingHorizontal: 22, paddingVertical: 10, borderRadius: radius.lg,
  },

  sides: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  side: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 52, paddingHorizontal: 18, borderRadius: radius.pill, maxWidth: '48%' },
  sideRight: { justifyContent: 'flex-end' },
  sideWide: { flex: 1, justifyContent: 'center', maxWidth: undefined },
  sideText: { fontFamily: fonts.extrabold, fontSize: 20, flexShrink: 1 },
  sideScore: {
    overflow: 'hidden', color: colors.text, backgroundColor: colors.bg, fontFamily: fonts.extrabold, fontSize: 15,
    minWidth: 30, textAlign: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill,
  },
  sideOption: {
    flex: 1, flexDirection: 'column', height: 'auto', minHeight: 110, borderRadius: radius.lg, paddingVertical: 14,
    justifyContent: 'center', maxWidth: undefined,
  },
  sideOptionText: { fontSize: 18, lineHeight: 22, textAlign: 'center' },
  answerTag: {
    overflow: 'hidden', backgroundColor: colors.bg, color: colors.text, fontFamily: fonts.extrabold, fontSize: 11,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, maxWidth: '100%',
  },
  orWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  or: {
    overflow: 'hidden', backgroundColor: colors.bg, color: colors.yellow, fontFamily: fonts.extrabold, fontSize: 14,
    width: 44, height: 44, lineHeight: 44, textAlign: 'center', borderRadius: 22,
  },

  endWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: 24 },
  endCard: { alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.xxl, paddingVertical: 26, paddingHorizontal: 28, gap: 2 },
  endKicker: { color: colors.mint, fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center' },
  endValue: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 80, lineHeight: 88 },
  endScore: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 16 },

  brand: { position: 'absolute', left: spacing.screen, right: spacing.screen, alignItems: 'center' },
  brandText: {
    overflow: 'hidden', backgroundColor: DIM, color: colors.pink, fontFamily: fonts.extrabold, fontSize: 12,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill,
  },

  chromeZone: { position: 'absolute', top: 0, left: 0, right: 0 },
  menusPill: {
    alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, height: 30, paddingHorizontal: 12,
    borderRadius: 15, backgroundColor: 'rgba(18,16,34,0.55)',
  },
  menusPillText: { color: colors.text, fontFamily: fonts.bold, fontSize: 12 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(18,16,34,0.7)', alignItems: 'center', justifyContent: 'center' },
  iconSpacer: { width: 44, height: 44 },
  titlePill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44,
    backgroundColor: 'rgba(18,16,34,0.7)', borderRadius: radius.pill, paddingHorizontal: 14,
  },
  titleText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 15, flexShrink: 1 },
  menuBar: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  todLevels: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: radius.pill, backgroundColor: 'rgba(18,16,34,0.7)' },
  todLevel: { height: 32, paddingHorizontal: 14, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  todLevelText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 12 },

  hint: {
    overflow: 'hidden', color: colors.text, fontFamily: fonts.bold, fontSize: 13, textAlign: 'center',
    backgroundColor: 'rgba(18,16,34,0.85)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill,
  },
});
