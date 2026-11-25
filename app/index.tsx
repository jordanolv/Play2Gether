import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LaunchSheet } from '@/components/ui/LaunchSheet';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radius } from '@/constants/theme';
import gamesData from '@/data/games.json';
import { getCurrentStreak } from '@/utils/streak';
import { TodLevel } from '@/utils/truthordare';

interface GameItem {
  id: string;
  mark: string;
  tint: keyof typeof colors;
  available: boolean;
  isNew?: boolean;
  /** Jouable en mode filtre caméra. */
  filmable?: boolean;
}

const games = gamesData as GameItem[];
const FEATURED_ID = 'ladder';

export default function HomeScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [streak, setStreak] = useState(0);
  const [pickingLevel, setPickingLevel] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getCurrentStreak().then(setStreak);
    }, [])
  );

  const openGame = (game: GameItem) => {
    if (!game.available) return;
    // Action ou vérité : on choisit d'abord le thème
    if (game.id === 'truthordare') setPickingLevel(true);
    else router.push(`/games/${game.id}` as any);
  };

  const playTruthOrDare = (level: TodLevel) => {
    setPickingLevel(false);
    router.push({ pathname: '/games/truthordare', params: { level } });
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr');
  };

  const featured = games.find((g) => g.id === FEATURED_ID)!;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{t('home.greeting')}</Text>
          <Text style={styles.title}>{t('app.title')}</Text>
        </View>
        <View style={styles.streak} accessibilityLabel={t('home.streak', { count: streak })}>
          <Feather name="zap" size={15} color={colors.yellow} />
          <Text style={styles.streakText}>{t('home.streakShort', { count: streak })}</Text>
        </View>
        <Pressable
          onPress={toggleLanguage}
          accessibilityRole="button"
          accessibilityLabel={t('home.changeLanguage')}
          style={({ pressed }) => [styles.langButton, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.langText}>{i18n.language === 'fr' ? 'FR' : 'EN'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => openGame(featured)} accessibilityRole="button" style={({ pressed }) => pressed && { transform: [{ scale: 0.99 }] }}>
          <LinearGradient colors={[colors.pink, colors.violet]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Text style={styles.heroKicker}>{t('home.tonight')}</Text>
            <Text style={styles.heroTitle}>{t(`games.${featured.id}.title`)}</Text>
            <Text style={styles.heroDesc}>{t(`games.${featured.id}.description`)}</Text>
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>{t('home.play')}</Text>
              <Feather name="arrow-right" size={16} color={colors.text} />
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t('home.gamesTitle')}</Text>
          <Text style={styles.sectionMeta}>{t('home.gamesCount', { count: games.length })}</Text>
        </View>

        <View style={styles.grid}>
          {games.map((game) => (
            <Pressable
              key={game.id}
              onPress={() => openGame(game)}
              disabled={!game.available}
              accessibilityRole="button"
              accessibilityState={{ disabled: !game.available }}
              style={({ pressed }) => [styles.card, !game.available && styles.cardSoon, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.cardTop}>
                <View style={[styles.mark, { backgroundColor: colors[game.tint] }]}>
                  <Text style={styles.markText}>{game.mark}</Text>
                </View>
                <View style={styles.badges}>
                  {game.filmable && (
                    <View style={styles.badgeCam} accessible accessibilityLabel={t('home.filmable')}>
                      <Feather name="video" size={13} color={colors.pink} />
                    </View>
                  )}
                  {game.isNew && game.available && <Text style={styles.badgeNew}>{t('home.new')}</Text>}
                  {!game.available && <Text style={styles.badgeSoon}>{t('home.soon')}</Text>}
                </View>
              </View>
              <Text style={styles.cardTitle}>{t(`games.${game.id}.title`)}</Text>
              <Text style={styles.cardSub} numberOfLines={2}>{t(`games.${game.id}.tagline`)}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <LaunchSheet visible={pickingLevel} onClose={() => setPickingLevel(false)} onPick={playTruthOrDare} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  greeting: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 13 },
  title: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 28, letterSpacing: -0.5 },
  streak: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 36, borderRadius: radius.pill,
    backgroundColor: 'rgba(255,216,77,0.12)', borderWidth: 1, borderColor: 'rgba(255,216,77,0.3)',
  },
  streakText: { color: colors.yellow, fontFamily: fonts.extrabold, fontSize: 14 },
  langButton: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  langText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 13 },

  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40, gap: 20 },

  hero: { borderRadius: radius.xl, padding: 22, gap: 12 },
  heroKicker: { color: colors.text, opacity: 0.85, fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 30, letterSpacing: -0.5, lineHeight: 32 },
  heroDesc: { color: colors.text, opacity: 0.92, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 19 },
  heroCta: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.bg, paddingHorizontal: 18, height: 44, borderRadius: radius.pill, marginTop: 2,
  },
  heroCtaText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 15 },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionTitle: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 20 },
  sectionMeta: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 13 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%', flexGrow: 1, minHeight: 120, padding: 16, gap: 8, borderRadius: radius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  cardSoon: { opacity: 0.55 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 2 },
  mark: { flexShrink: 0, width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  markText: { color: colors.bg, fontFamily: fonts.extrabold, fontSize: 16 },
  badges: { flexShrink: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: 6 },
  badgeCam: {
    width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,95,168,0.14)', borderWidth: 1, borderColor: 'rgba(255,95,168,0.4)',
  },
  badgeNew: {
    overflow: 'hidden', backgroundColor: colors.yellow, color: colors.bg, fontFamily: fonts.extrabold,
    fontSize: 10, letterSpacing: 0.8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill,
  },
  badgeSoon: {
    overflow: 'hidden', borderWidth: 1, borderColor: colors.borderStrong, color: colors.textMuted, fontFamily: fonts.bold,
    fontSize: 10, letterSpacing: 0.8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill,
  },
  cardTitle: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 19 },
  cardSub: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
});
