import { updateDailyStreak } from '@/utils/streak';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getRandomTheme } from '@/utils/gameWords';

export default function RebusGame() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  const [currentTheme, setCurrentTheme] = useState('');
  const [currentLetters, setCurrentLetters] = useState('');
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [round, setRound] = useState(1);
  const [gameFinished, setGameFinished] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const maxRounds = 5;
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  useEffect(() => {
    startNewGame();
  }, []);

  useEffect(() => {
    startNewGame();
  }, [i18n.language]);

  const generateRandomLetters = () => {
    const shuffled = alphabet.split('').sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2).join(' ');
  };

  const startNewGame = () => {
    setPlayer1Score(0);
    setPlayer2Score(0);
    setRound(1);
    setGameFinished(false);
    setWinner(null);
    generateNewRound();
  };

  const generateNewRound = () => {
    setCurrentTheme(getRandomTheme(i18n.language));
    setCurrentLetters(generateRandomLetters());
  };

  const givePointToPlayer = (player: 1 | 2) => {
    if (gameFinished) return;

    let newPlayer1Score = player1Score;
    let newPlayer2Score = player2Score;

    if (player === 1) {
      newPlayer1Score = player1Score + 1;
      setPlayer1Score(newPlayer1Score);
    } else {
      newPlayer2Score = player2Score + 1;
      setPlayer2Score(newPlayer2Score);
    }

    if (round >= maxRounds) {
      endGame(newPlayer1Score, newPlayer2Score);
    } else {
      setRound(prev => prev + 1);
      generateNewRound();
    }
  };

  const endGame = (finalPlayer1Score: number, finalPlayer2Score: number) => {
    setGameFinished(true);
    updateDailyStreak();
    
    if (finalPlayer1Score > finalPlayer2Score) {
      setWinner(t('games.scattergories.player1'));
    } else if (finalPlayer2Score > finalPlayer1Score) {
      setWinner(t('games.scattergories.player2'));
    } else {
      setWinner(null); // Égalité
    }
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
            <Text style={styles.backText}>← {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('games.scattergories.gameOver')}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.finalScoreContainer}>
            <Text style={styles.finalScoreTitle}>{t('games.scattergories.finalScore')}</Text>
            
            <View style={styles.scoreRow}>
              <Text style={styles.playerName}>{t('games.scattergories.player1')}</Text>
              <Text style={styles.playerScore}>{t('games.scattergories.score', { score: player1Score })}</Text>
            </View>
            
            <View style={styles.scoreRow}>
              <Text style={styles.playerName}>{t('games.scattergories.player2')}</Text>
              <Text style={styles.playerScore}>{t('games.scattergories.score', { score: player2Score })}</Text>
            </View>

            <View style={styles.winnerContainer}>
              {winner ? (
                <Text style={styles.winnerText}>{t('games.scattergories.winner', { player: winner })}</Text>
              ) : (
                <Text style={styles.winnerText}>{t('games.scattergories.tie')}</Text>
              )}
            </View>

            <TouchableOpacity style={styles.playAgainButton} onPress={startNewGame}>
              <Text style={styles.buttonText}>{t('games.scattergories.playAgain')}</Text>
            </TouchableOpacity>
          </View>
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
        <Text style={styles.title}>{t('games.scattergories.title')}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.roundInfo}>
          <Text style={styles.roundText}>Manche {round}/{maxRounds}</Text>
        </View>

        <View style={styles.gameCard}>
          <Text style={styles.themeText}>{t('games.scattergories.theme', { theme: currentTheme })}</Text>
          <Text style={styles.lettersText}>{currentLetters}</Text>
          <Text style={styles.instruction}>{t('games.scattergories.instruction')}</Text>
        </View>

        <View style={styles.scoresContainer}>
          <View style={styles.playerContainer}>
            <Text style={styles.playerName}>{t('games.scattergories.player1')}</Text>
            <Text style={styles.currentScore}>{t('games.scattergories.score', { score: player1Score })}</Text>
            <TouchableOpacity 
              style={[styles.pointButton, styles.player1Button]}
              onPress={() => givePointToPlayer(1)}
            >
              <Text style={styles.buttonText}>+1 Point</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.playerContainer}>
            <Text style={styles.playerName}>{t('games.scattergories.player2')}</Text>
            <Text style={styles.currentScore}>{t('games.scattergories.score', { score: player2Score })}</Text>
            <TouchableOpacity 
              style={[styles.pointButton, styles.player2Button]}
              onPress={() => givePointToPlayer(2)}
            >
              <Text style={styles.buttonText}>+1 Point</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.nextRoundButton} onPress={generateNewRound}>
          <Text style={styles.buttonText}>{t('games.scattergories.newRound')}</Text>
        </TouchableOpacity>
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
    width: 200,
    height: 200,
    backgroundColor: '#f0abfc',
    top: -80,
    right: -60,
    transform: [{ rotate: '28deg' }],
  },
  shape2: {
    width: 320,
    height: 320,
    backgroundColor: '#ff6161ff',
    top: 200,
    left: -160,
    transform: [{ rotate: '-18deg' }],
  },
  shape3: {
    width: 240,
    height: 240,
    backgroundColor: '#7dd3fc',
    bottom: -120,
    right: -100,
    transform: [{ rotate: '42deg' }],
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
  roundInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  roundText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
  },
  gameCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 26,
    padding: 30,
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
  themeText: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  lettersText: {
    color: '#f8fafc',
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 15,
    letterSpacing: 8,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  instruction: {
    color: '#cbd5e1',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.9,
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  playerContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  playerName: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  currentScore: {
    color: '#cbd5e1',
    fontSize: 16,
    marginBottom: 15,
    fontWeight: '600',
    opacity: 0.9,
  },
  pointButton: {
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  player1Button: {
    backgroundColor: 'rgba(76,175,80,0.9)',
  },
  player2Button: {
    backgroundColor: 'rgba(33,150,243,0.9)',
  },
  nextRoundButton: {
    backgroundColor: 'rgba(255,152,0,0.9)',
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
  finalScoreContainer: {
    alignItems: 'center',
  },
  finalScoreTitle: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 30,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  playerScore: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  winnerContainer: {
    marginTop: 30,
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  winnerText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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