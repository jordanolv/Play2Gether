import { getCurrentStreak } from '@/utils/streak';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import gamesData from '@/data/games.json';

interface GameItem {
  id: string;
  icon: string;
}


export default function HomeScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [streak, setStreak] = useState(0);

  const loadStreak = useCallback(async () => {
    const currentStreak = await getCurrentStreak();
    setStreak(currentStreak);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStreak();
    }, [loadStreak])
  );


  const handleGamePress = (gameId: string) => {
    if (gameId === 'password' || gameId === 'scattergories') {
      router.push(('/games/' + gameId) as any);
    }
    // Les autres jeux ne sont pas encore disponibles
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2D1B69" />
      
      <View style={styles.backgroundShapes}>
        <View style={[styles.shape, styles.shape1]} />
        <View style={[styles.shape, styles.shape2]} />
        <View style={[styles.shape, styles.shape3]} />
        <View style={[styles.shape, styles.shape4]} />
      </View>
      
      <View style={styles.header}>
        <Text style={styles.title}>{t('app.title')}</Text>
        <View style={styles.streakContainer}>
          <Text style={styles.streakText}>{t('home.streakIcon')} {streak > 1 ? t('home.streak', { count: streak }) : t('home.streak_zero', { count: streak })}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.dashboard}>
          {gamesData.map((game: GameItem) => {
            const isAvailable = game.id === 'password' || game.id === 'scattergories';
            
            return (
              <TouchableOpacity
                key={game.id}
                style={[styles.gameCard, !isAvailable && styles.gameCardDisabled]}
                onPress={() => handleGamePress(game.id)}
                disabled={!isAvailable}
              >
                <View style={styles.gameContent}>
                  <Text style={styles.gameIcon}>{game.icon}</Text>
                  <Text style={[styles.gameTitle, !isAvailable && styles.gameTextDisabled]}>
                    {t(`games.${game.id}.title`)}
                  </Text>
                  <Text style={[styles.gameDescription, !isAvailable && styles.gameTextDisabled]}>
                    {t(`games.${game.id}.description`)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      
      {/* Sélecteur de langue */}
      <View style={styles.languageSelector}>
        <TouchableOpacity
          style={[styles.languageButton, i18n.language === 'fr' && styles.languageButtonActive]}
          onPress={() => changeLanguage('fr')}
        >
          <Text style={styles.flagText}>🇫🇷</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.languageButton, i18n.language === 'en' && styles.languageButtonActive]}
          onPress={() => changeLanguage('en')}
        >
          <Text style={styles.flagText}>🇺🇸</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121326', // fond plus profond
    position: 'relative',
  },

  // Circles
  backgroundShapes: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 0,
  },
  shape: {
    position: 'absolute',
    borderRadius: 200,
    opacity: 0.18,
  },
  shape1: {
    width: 360,
    height: 360,
    backgroundColor: '#7dd3fc',
    top: -140,
    right: -120,
    transform: [{ rotate: '18deg' }],
  },
  shape2: {
    width: 280,
    height: 280,
    backgroundColor: '#f0abfc',
    bottom: -90,
    left: -120,
    transform: [{ rotate: '-12deg' }],
  },
  shape3: {
    width: 220,
    height: 220,
    backgroundColor: '#fcd34d',
    top: 220,
    left: -100,
    transform: [{ rotate: '8deg' }],
  },
  shape4: {
    width: 260,
    height: 260,
    backgroundColor: '#ff6161ff',
    bottom: 180,
    right: -160,
    transform: [{ rotate: '-15deg' }],
  },

  // Header
  header: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 1,
    position: 'relative',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  streakContainer: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  streakText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f472b6',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // 📜 Contenu
  scrollContainer: {
    flex: 1,
    zIndex: 1,
    position: 'relative',
  },
  dashboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 24,
  },

  // 🃏 Cartes jeux
  gameCard: {
    width: '48%',
    marginBottom: 22,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.08)', // glassmorphism
    height: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  gameContent: {
    flex: 1,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameIcon: {
    fontSize: 52,
    marginBottom: 12,
    lineHeight: 58,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  gameTitle: {
    fontSize: 17,
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '800',
    color: '#f8fafc',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
  gameDescription: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    color: '#cbd5e1',
    fontWeight: '600',
    opacity: 0.9,
  },
  gameCardDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.06)',
    shadowOpacity: 0.15,
  },
  gameTextDisabled: {
    opacity: 0.4,
  },

  // 🌍 Sélecteur de langue
  languageSelector: {
    position: 'absolute',
    bottom: 45,
    right: 25,
    flexDirection: 'row',
    // on garde "gap" si ta version RN le supporte, sinon ignoré sans casser
    gap: 12,
    zIndex: 10,
  },
  languageButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  languageButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: '#f472b6',
    shadowColor: '#f472b6',
    shadowOpacity: 0.35,
    transform: [{ scale: 1.05 }],
  },
  flagText: {
    fontSize: 26,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

