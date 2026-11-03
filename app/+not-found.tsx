import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { colors, fonts } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <Screen style={styles.container}>
      <Text style={styles.title}>Oups, cette page n&apos;existe pas.</Text>
      <Link href="/" style={styles.link}>Retour à l&apos;accueil</Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 20, gap: 16 },
  title: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 22, textAlign: 'center' },
  link: { color: colors.pink, fontFamily: fonts.bold, fontSize: 16, paddingVertical: 12 },
});
