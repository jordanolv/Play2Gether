import { Feather } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '@/constants/theme';

interface Props {
  /** Id du jeu à lancer, ou null quand la feuille est fermée. */
  gameId: string | null;
  onClose: () => void;
  onPlayScreen: (gameId: string) => void;
  onPlayFilter: (gameId: string) => void;
}

/** Feuille affichée au lancement d'un jeu filmable : jeu classique ou mode filtre caméra. */
export function LaunchSheet({ gameId, onClose, onPlayScreen, onPlayFilter }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={gameId !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('home.launchCancel')} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        {gameId && (
          <>
            <Text style={styles.title}>{t(`games.${gameId}.title`)}</Text>
            <Option
              icon="video"
              iconBg={colors.pink}
              title={t('home.launchFilter')}
              sub={t('home.launchFilterSub')}
              highlighted
              onPress={() => onPlayFilter(gameId)}
            />
            <Option
              icon="smartphone"
              iconBg={colors.surfaceRaised}
              iconColor={colors.text}
              title={t('home.launchScreen')}
              sub={t('home.launchScreenSub')}
              onPress={() => onPlayScreen(gameId)}
            />
          </>
        )}
      </View>
    </Modal>
  );
}

function Option({
  icon, iconBg, iconColor = colors.bg, title, sub, highlighted, onPress,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  iconBg: string;
  iconColor?: string;
  title: string;
  sub: string;
  highlighted?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.option, highlighted && styles.optionHighlighted, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.optionIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSub}>{sub}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, gap: 12, paddingHorizontal: spacing.screen, paddingTop: 10,
    backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    borderWidth: 1, borderColor: colors.border,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: 6 },
  title: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 24, marginBottom: 4 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.lg,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
  },
  optionHighlighted: { borderColor: 'rgba(255,95,168,0.5)' },
  optionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 16 },
  optionSub: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 13, lineHeight: 17 },
});
