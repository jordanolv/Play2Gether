import { getCurrentStreak } from '@/utils/streak';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import gamesData from '@/data/games.json';

interface GameItem {
  id: string;
  title: string;
  description: string;
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
      
      {/* Formes décoratives en arrière-plan */}
      <View style={styles.backgroundShapes}>
        <View style={[styles.shape, styles.shape1]} />
        <View style={[styles.shape, styles.shape2]} />
        <View style={[styles.shape, styles.shape3]} />
        <Text style={styles.heartDecor1}>🎮</Text>
        <Text style={styles.heartDecor2}>✨</Text>
        <Text style={styles.heartDecor3}>🎯</Text>
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
    backgroundColor: '#2D1B69',
    position: 'relative',
  },
  backgroundShapes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  shape: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.1,
  },
  shape1: {
    width: 120,
    height: 120,
    backgroundColor: '#4ECDC4',
    top: 100,
    right: -30,
  },
  shape2: {
    width: 80,
    height: 80,
    backgroundColor: '#45B7D1',
    bottom: 200,
    left: -20,
  },
  shape3: {
    width: 100,
    height: 100,
    backgroundColor: '#96CEB4',
    top: 300,
    left: 50,
  },
  heartDecor1: {
    position: 'absolute',
    fontSize: 30,
    opacity: 0.15,
    top: 150,
    left: 30,
  },
  heartDecor2: {
    position: 'absolute',
    fontSize: 25,
    opacity: 0.2,
    bottom: 300,
    right: 40,
  },
  heartDecor3: {
    position: 'absolute',
    fontSize: 35,
    opacity: 0.1,
    top: 400,
    right: 80,
  },
  header: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 1,
    position: 'relative',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  streakContainer: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  streakText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
    zIndex: 1,
    position: 'relative',
  },
  dashboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 25,
  },
  gameCard: {
    width: '48%',
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    height: 170,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  gameContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameIcon: {
    fontSize: 50,
    marginBottom: 12,
    lineHeight: 55,
  },
  gameTitle: {
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '700',
    color: '#fff',
  },
  gameDescription: {
    opacity: 0.9,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    color: '#fff',
    fontWeight: '500',
  },
  gameCardDisabled: {
    opacity: 0.6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gameTextDisabled: {
    opacity: 0.4,
  },
  languageSelector: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    flexDirection: 'row',
    gap: 10,
    zIndex: 10,
  },
  languageButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  flagText: {
    fontSize: 24,
  },
});
