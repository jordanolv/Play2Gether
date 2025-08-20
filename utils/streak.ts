import AsyncStorage from '@react-native-async-storage/async-storage';

export const updateDailyStreak = async () => {
  try {
    const today = new Date().toDateString();
    const storedStreak = await AsyncStorage.getItem('dailyStreak');
    const storedDate = await AsyncStorage.getItem('lastPlayDate');
    
    // Si on a déjà joué aujourd'hui, ne pas incrémenter
    if (storedDate === today) {
      return parseInt(storedStreak || '0');
    }
    
    // Incrémenter la streak
    const currentStreak = parseInt(storedStreak || '0');
    const newStreak = currentStreak + 1;
    
    await AsyncStorage.setItem('dailyStreak', newStreak.toString());
    await AsyncStorage.setItem('lastPlayDate', today);
    
    return newStreak;
  } catch (error) {
    console.log('Erreur lors de la mise à jour de la streak:', error);
    return 0;
  }
};

export const getCurrentStreak = async () => {
  try {
    const storedStreak = await AsyncStorage.getItem('dailyStreak');
    return parseInt(storedStreak || '0');
  } catch (error) {
    console.log('Erreur lors du chargement de la streak:', error);
    return 0;
  }
};