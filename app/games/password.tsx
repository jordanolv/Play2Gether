import { getRandomWords } from '@/utils/gameWords';
import { updateDailyStreak } from '@/utils/streak';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function DevineGame() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [gameWords, setGameWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [guessCount, setGuessCount] = useState('');
  const [scores, setScores] = useState<number[]>([]);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    startNewGame();
  }, []);

  // Redémarrer le jeu quand la langue change
  useEffect(() => {
    startNewGame();
  }, [i18n.language]);

  const startNewGame = () => {
    const randomWords = getRandomWords(i18n.language, 5);
    setGameWords(randomWords);
    setCurrentWordIndex(0);
    setScores([]);
    setGameFinished(false);
    setGuessCount('');
  };

  const handleWordGuessed = () => {
    const count = parseInt(guessCount);
    if (!count || count < 1) {
      Alert.alert(t('common.error'), t('games.password.cluesError'));
      return;
    }

    const newScores = [...scores, count];
    setScores(newScores);
    setGuessCount('');

    if (currentWordIndex < gameWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      setGameFinished(true);
      // Mettre à jour la streak à la fin de la partie
      updateDailyStreak();
    }
  };

  const handleSkipWord = () => {
    const newScores = [...scores, 5];
    setScores(newScores);

    if (currentWordIndex < gameWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      setGameFinished(true);
      // Mettre à jour la streak à la fin de la partie
      updateDailyStreak();
    }
  };

  const getTotalScore = () => {
    return scores.reduce((total, score) => total + score, 0);
  };

  if (gameFinished) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#121326" />
        
        <View style={styles.backgroundShapes}>
          <View style={[styles.shape, styles.shape1]} />
          <View style={[styles.shape, styles.shape2]} />
          <View style={[styles.shape, styles.shape3]} />
        </View>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('games.password.results')}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.finalScore}>{t('games.password.totalScore', { score: getTotalScore() })}</Text>
          
          <View style={styles.wordScores}>
            {gameWords.map((word, index) => (
              <View key={index} style={styles.scoreRow}>
                <Text style={styles.wordText}>{word}</Text>
                <Text style={styles.scoreText}>
                  {scores[index]} {scores[index] === 1 ? t('games.password.cluesSingular') : t('games.password.cluesPlural')}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.playAgainButton} onPress={startNewGame}>
            <Text style={styles.buttonText}>{t('games.password.playAgain')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121326" />
      
      <View style={styles.backgroundShapes}>
        <View style={[styles.shape, styles.shape1]} />
        <View style={[styles.shape, styles.shape2]} />
        <View style={[styles.shape, styles.shape3]} />
      </View>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('games.password.title')}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {t('games.password.wordProgress', { current: currentWordIndex + 1, total: gameWords.length })}
          </Text>
        </View>

        <View style={styles.wordCard}>
          <Text style={styles.wordToGuess}>{gameWords[currentWordIndex]}</Text>
        </View>

        <Text style={styles.instruction}>
          {t('games.password.instruction')}
        </Text>

        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('games.password.cluesGiven')}</Text>
          <TextInput
            style={styles.input}
            value={guessCount}
            onChangeText={setGuessCount}
            keyboardType="numeric"
            placeholder={t('games.password.cluesPlaceholder')}
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.guessedButton} onPress={handleWordGuessed}>
            <Text style={styles.buttonText}>{t('games.password.wordGuessed')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleSkipWord}>
            <Text style={styles.buttonText}>{t('games.password.skipWord')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121326',
    position: 'relative',
  },
  backgroundShapes: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 0,
  },
  shape: {
    position: 'absolute',
    borderRadius: 200,
    opacity: 0.15,
  },
  shape1: {
    width: 320,
    height: 320,
    backgroundColor: '#a78bfa',
    top: -120,
    left: -80,
    transform: [{ rotate: '-25deg' }],
  },
  shape2: {
    width: 200,
    height: 200,
    backgroundColor: '#7dd3fc',
    top: 200,
    right: -70,
    transform: [{ rotate: '30deg' }],
  },
  shape3: {
    width: 260,
    height: 260,
    backgroundColor: '#fcd34d',
    bottom: -80,
    left: -120,
    transform: [{ rotate: '15deg' }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'transparent',
    zIndex: 1,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
  },
  backText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  content: {
    flex: 1,
    padding: 24,
    zIndex: 1,
    position: 'relative',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
  },
  wordCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 26,
    padding: 40,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
  },
  wordToGuess: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  instruction: {
    color: '#cbd5e1',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
    opacity: 0.9,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    color: '#f8fafc',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 18,
    color: '#f8fafc',
    fontSize: 18,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonsContainer: {
    gap: 15,
  },
  guessedButton: {
    backgroundColor: 'rgba(76,175,80,0.9)',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  skipButton: {
    backgroundColor: 'rgba(255,107,107,0.9)',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  finalScore: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  wordScores: {
    marginBottom: 30,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  wordText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  scoreText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.9,
  },
  playAgainButton: {
    backgroundColor: 'rgba(33,150,243,0.9)',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
});