import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { WithCoupleNames } from '@/components/ui/WithCoupleNames';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import questionsEn from '@/data/questions-en.json';
import questionsFr from '@/data/questions-fr.json';
import whoEn from '@/data/whoofus-en.json';
import whoFr from '@/data/whoofus-fr.json';
import wyrEn from '@/data/wouldyourather-en.json';
import wyrFr from '@/data/wouldyourather-fr.json';
import { CoupleNames } from '@/utils/couple';
import { byLanguage, shuffle } from '@/utils/random';

type Mode = 'whoofus' | 'wouldyourather' | 'questions';
const MODES: Mode[] = ['whoofus', 'wouldyourather', 'questions'];
const isMode = (value: unknown): value is Mode => MODES.includes(value as Mode);
const SIDE_COLORS = [colors.pink, colors.cyan] as const;
type Side = 0 | 1;
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
      {(names) => <Filter key={i18n.language} names={names} mode={mode} />}
    </WithCoupleNames>
  );
}

function Filter({ names, mode }: { names: CoupleNames; mode: Mode }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [filming, setFilming] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const sideNames: CoupleNames = swapped ? [names[1], names[0]] : names;

  // Paquets de cartes mélangés, un par mode
  const [decks] = useState(() => ({
    whoofus: shuffle(byLanguage(i18n.language, { fr: whoFr, en: whoEn })),
    wouldyourather: shuffle(byLanguage(i18n.language, { fr: wyrFr, en: wyrEn })),
    questions: (() => {
      const q = byLanguage(i18n.language, { fr: questionsFr, en: questionsEn });
      return shuffle([...q.light, ...q.deep]);
    })(),
  }));
  const [indexes, setIndexes] = useState<Record<Mode, number>>({ whoofus: 0, wouldyourather: 0, questions: 0 });

  // Roulette « Qui de nous deux »
  const [highlight, setHighlight] = useState<Side | null>(null);
  const [rolling, setRolling] = useState(false);
  const [picked, setPicked] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Animation d'entrée de chaque nouvelle carte
  const [cardAnim] = useState(() => new Animated.Value(1));
  const [pickAnim] = useState(() => new Animated.Value(0));
  const popCard = () => {
    cardAnim.setValue(0);
    Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }).start();
  };

  const resetRoulette = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setHighlight(null);
    setRolling(false);
    setPicked(false);
    pickAnim.setValue(0);
  };

  const nextCard = () => {
    resetRoulette();
    setIndexes((prev) => ({ ...prev, [mode]: (prev[mode] + 1) % decks[mode].length }));
    popCard();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const spin = () => {
    setRolling(true);
    setPicked(false);
    const target = randomSide();
    // Le nombre d'étapes est pair : on commence sur le côté opposé pour finir sur la cible
    let side: Side = (ROULETTE_STEPS.length % 2 === 0 ? 1 - target : target) as Side;
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
            pickAnim.setValue(0);
            Animated.spring(pickAnim, { toValue: 1, useNativeDriver: true, friction: 4, tension: 90 }).start();
          }
        }, elapsed)
      );
      side = (1 - side) as Side;
    });
  };

  // Un appui n'importe où fait avancer le jeu
  const onTap = () => {
    if (rolling) return;
    if (mode === 'whoofus' && !picked) spin();
    else nextCard();
  };

  const card = decks[mode][indexes[mode]];
  const cardStyle = {
    opacity: cardAnim,
    transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
  };
  const pickScale = pickAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

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
        {/* Carte du jeu, en haut */}
        <View style={[styles.top, { paddingTop: insets.top + (filming ? 24 : 72) }]} pointerEvents="none">
          <Text style={styles.kicker}>{t(`filter.kickers.${mode}`)}</Text>
          <Animated.View style={[styles.card, cardStyle]}>
            {mode === 'wouldyourather' ? (
              <Text style={styles.cardText}>{t('games.wouldyourather.prompt')}</Text>
            ) : (
              <Text style={styles.cardText}>{card as string}</Text>
            )}
          </Animated.View>
        </View>

        {/* Bas de l'écran : les deux côtés */}
        <View style={[styles.sides, { bottom: insets.bottom + (filming ? 40 : 150) }]} pointerEvents="none">
          {([0, 1] as const).map((side) => {
            const label = mode === 'wouldyourather' ? (card as string[])[side] : sideNames[side];
            const lit = mode === 'whoofus' ? highlight === side : true;
            const isPick = mode === 'whoofus' && picked && highlight === side;
            return (
              <Animated.View
                key={side}
                style={[
                  styles.side,
                  side === 1 && styles.sideRight,
                  { backgroundColor: lit ? SIDE_COLORS[side] : 'rgba(18,16,34,0.75)' },
                  mode === 'wouldyourather' && styles.sideOption,
                  isPick && { transform: [{ scale: pickScale }] },
                ]}
              >
                {side === 0 && mode !== 'wouldyourather' && <Feather name="arrow-left" size={20} color={lit ? colors.bg : colors.text} />}
                <Text
                  style={[styles.sideText, { color: lit ? colors.bg : colors.text }, mode === 'wouldyourather' && styles.sideOptionText]}
                  numberOfLines={mode === 'wouldyourather' ? 4 : 1}
                >
                  {label}
                </Text>
                {side === 1 && mode !== 'wouldyourather' && <Feather name="arrow-right" size={20} color={lit ? colors.bg : colors.text} />}
              </Animated.View>
            );
          })}
        </View>

        {mode === 'wouldyourather' && (
          <View style={[styles.orWrap, { bottom: insets.bottom + (filming ? 40 : 150) }]} pointerEvents="none">
            <Text style={styles.or}>{t('filter.or')}</Text>
          </View>
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
            <Pressable onPress={() => setSwapped((s) => !s)} accessibilityRole="button" accessibilityLabel={t('filter.swap')} style={styles.iconBtn}>
              <Feather name="repeat" size={20} color={colors.text} />
            </Pressable>
          </View>

          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
            <Text style={styles.hint}>
              {mode === 'whoofus' ? t(picked ? 'filter.hintNext' : 'filter.hintSpin') : t('filter.hintNext')}
            </Text>
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
  kicker: {
    overflow: 'hidden', backgroundColor: colors.yellow, color: colors.bg, fontFamily: fonts.extrabold, fontSize: 12,
    letterSpacing: 1.8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.bg, borderRadius: radius.lg, paddingHorizontal: 18, paddingVertical: 14,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  cardText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 30, textAlign: 'center' },

  sides: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  side: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 52, paddingHorizontal: 18, borderRadius: radius.pill, maxWidth: '48%' },
  sideRight: { justifyContent: 'flex-end' },
  sideText: { fontFamily: fonts.extrabold, fontSize: 20, flexShrink: 1 },
  sideOption: { flex: 1, height: 'auto', minHeight: 110, borderRadius: radius.lg, paddingVertical: 14, justifyContent: 'center', maxWidth: undefined },
  sideOptionText: { fontSize: 18, lineHeight: 22, textAlign: 'center' },
  orWrap: { position: 'absolute', left: 0, right: 0, height: 110, alignItems: 'center', justifyContent: 'center' },
  or: {
    overflow: 'hidden', backgroundColor: colors.bg, color: colors.yellow, fontFamily: fonts.extrabold, fontSize: 14,
    width: 44, height: 44, lineHeight: 44, textAlign: 'center', borderRadius: 22,
  },

  brand: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  brandText: {
    overflow: 'hidden', backgroundColor: 'rgba(18,16,34,0.75)', color: colors.pink, fontFamily: fonts.extrabold, fontSize: 12,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill,
  },

  header: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(18,16,34,0.7)', alignItems: 'center', justifyContent: 'center' },
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
