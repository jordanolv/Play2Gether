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
        <StatusBar barStyle="light-content" backgroundColor="#2D1B69" />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>{t('common.back')}</Text>
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
      <StatusBar barStyle="light-content" backgroundColor="#2D1B69" />
      
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
  roundInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  roundText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.7,
  },
  gameCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  themeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  lettersText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 15,
    letterSpacing: 8,
  },
  instruction: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  currentScore: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
    opacity: 0.8,
  },
  pointButton: {
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  player1Button: {
    backgroundColor: '#4CAF50',
  },
  player2Button: {
    backgroundColor: '#2196F3',
  },
  nextRoundButton: {
    backgroundColor: '#FF9800',
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
  finalScoreContainer: {
    alignItems: 'center',
  },
  finalScoreTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  playerScore: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  winnerContainer: {
    marginTop: 30,
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  winnerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
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