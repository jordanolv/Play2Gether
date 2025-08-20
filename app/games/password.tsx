import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { updateDailyStreak } from '@/utils/streak';
import { getRandomWords } from '@/utils/gameWords';

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
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        
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
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
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
    backgroundColor: '#2D1B69',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.7,
  },
  wordCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  wordToGuess: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.8,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 18,
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  buttonsContainer: {
    gap: 15,
  },
  guessedButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  finalScore: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.7,
  },
  playAgainButton: {
    backgroundColor: '#2196F3',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});