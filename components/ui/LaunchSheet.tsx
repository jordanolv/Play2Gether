import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '@/constants/theme';
import { TOD_ADULT_LEVELS, TOD_FILTER_LEVELS, TOD_LEVELS, TOD_LEVEL_COLORS, TodLevel } from '@/utils/truthordare';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPick: (level: TodLevel) => void;
}

/** Choix du thème au lancement d'Action ou Vérité. */
export function LaunchSheet({ visible, onClose, onPick }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const pick = (level: TodLevel) => {
    if (!TOD_ADULT_LEVELS.includes(level)) return onPick(level);
    Alert.alert(t('games.truthordare.adultTitle'), t('games.truthordare.adultBody'), [
      { text: t('games.truthordare.adultCancel'), style: 'cancel' },
      { text: t('games.truthordare.adultConfirm'), onPress: () => onPick(level) },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('home.launchCancel')} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>{t('games.truthordare.title')}</Text>
        <Text style={styles.sub}>{t('games.truthordare.pickLevel')}</Text>
        {TOD_LEVELS.map((level) => (
          <Pressable
            key={level}
            onPress={() => pick(level)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.option, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.dot, { backgroundColor: TOD_LEVEL_COLORS[level] }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>{t(`games.truthordare.levels.${level}`)}</Text>
              <Text style={styles.optionSub}>{t(`games.truthordare.levelsSub.${level}`)}</Text>
            </View>
            {TOD_ADULT_LEVELS.includes(level) && <Text style={styles.badge}>18+</Text>}
            {TOD_FILTER_LEVELS.includes(level) && <Feather name="video" size={15} color={colors.textMuted} />}
            <Feather name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, gap: 10, paddingHorizontal: spacing.screen, paddingTop: 10,
    backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    borderWidth: 1, borderColor: colors.border,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginBottom: 6 },
  title: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 24 },
  sub: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 14, marginBottom: 4 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: radius.lg,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  optionTitle: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 16 },
  optionSub: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 13, lineHeight: 17 },
  badge: {
    overflow: 'hidden', color: colors.pink, borderWidth: 1, borderColor: 'rgba(255,95,168,0.5)', fontFamily: fonts.extrabold,
    fontSize: 11, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.pill,
  },
});
