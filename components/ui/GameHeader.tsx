import { colors, fonts, spacing } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface GameHeaderProps {
  title: string;
  /** Étape courante, à partir de 1. */
  step?: number;
  total?: number;
  /** Ouvre le jeu en mode filtre caméra : affiche une icône caméra à droite. */
  onFilm?: () => void;
  /** Affiche un bouton « ? » (règles du jeu). */
  onHelp?: () => void;
}

export function GameHeader({ title, step, total, onFilm, onHelp }: GameHeaderProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const hasProgress = step !== undefined && total !== undefined;

  return (
    <View>
      <View style={styles.row}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.backLabel')}
          style={({ pressed }) => [styles.back, pressed && { opacity: 0.7 }]}
          hitSlop={8}
        >
          <Feather name="chevron-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {hasProgress && <Text style={styles.count}>{step} / {total}</Text>}
        {onHelp && (
          <Pressable
            onPress={onHelp}
            accessibilityRole="button"
            accessibilityLabel={t('common.helpLabel')}
            style={({ pressed }) => [styles.film, pressed && { opacity: 0.7 }]}
            hitSlop={8}
          >
            <Feather name="help-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
        {onFilm && (
          <Pressable
            onPress={onFilm}
            accessibilityRole="button"
            accessibilityLabel={t('common.filmLabel')}
            style={({ pressed }) => [styles.film, pressed && { opacity: 0.7 }]}
            hitSlop={8}
          >
            <Feather name="video" size={18} color={colors.pink} />
          </Pressable>
        )}
      </View>
      {hasProgress && (
        <View style={styles.progress}>
          {Array.from({ length: total }, (_, i) => (
            <View key={i} style={[styles.segment, { backgroundColor: i < step ? colors.pink : colors.track }]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.screen, paddingTop: 12 },
  back: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  film: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,95,168,0.12)', borderWidth: 1, borderColor: 'rgba(255,95,168,0.4)',
  },
  title: { flex: 1, color: colors.text, fontFamily: fonts.extrabold, fontSize: 18 },
  count: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 14 },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.screen, paddingTop: 16 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
});
