import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { TOD_ADULT_LEVELS, TOD_FILTER_LEVELS, TOD_LEVELS, TOD_LEVEL_COLORS, TodLevel } from '@/utils/truthordare';

interface Props {
  /** Jeu à présenter ; null : la feuille est fermée. */
  game: { id: string; filmable?: boolean } | null;
  onClose: () => void;
  /** Lance le jeu (Action ou Vérité : avec le thème choisi). */
  onPlay: (level?: TodLevel) => void;
}

/** Mini-instruction à l'ouverture d'un jeu ; pour Action ou Vérité, elle porte aussi le choix du thème. */
export function LaunchSheet({ game, onClose, onPlay }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // On garde le dernier jeu affiché pendant la fermeture de la feuille
  const [shown, setShown] = useState(game);
  if (game && game !== shown) setShown(game);
  const current = game ?? shown;

  const pick = (level: TodLevel) => {
    if (!TOD_ADULT_LEVELS.includes(level)) return onPlay(level);
    Alert.alert(t('games.truthordare.adultTitle'), t('games.truthordare.adultBody'), [
      { text: t('games.truthordare.adultCancel'), style: 'cancel' },
      { text: t('games.truthordare.adultConfirm'), onPress: () => onPlay(level) },
    ]);
  };

  const isTod = current?.id === 'truthordare';

  return (
    <Modal visible={game !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('home.launchCancel')} />
      {current && (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16, maxHeight: '88%' }]}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} bounces={false}>
            <Text style={styles.title}>{t(`games.${current.id}.title`)}</Text>
            <Text style={styles.sub}>{t(`games.${current.id}.description`)}</Text>

            {current.filmable && (
              <View style={styles.camera}>
                <View style={styles.cameraHead}>
                  <Feather name="video" size={15} color={colors.pink} />
                  <Text style={styles.cameraTitle}>{t('intro.cameraTitle')}</Text>
                </View>
                <Text style={styles.cameraText}>{t('intro.cameraBody')}</Text>
                <Text style={styles.cameraText}>{t(`intro.gestures.${current.id}`)}</Text>
                <Text style={styles.cameraText}>{t('intro.cameraSettings')}</Text>
              </View>
            )}

            {isTod ? (
              <>
                <Text style={styles.pickLevel}>{t('games.truthordare.pickLevel')}</Text>
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
                    {TOD_ADULT_LEVELS.includes(level) && <Text style={styles.badge}>16+</Text>}
                    {TOD_FILTER_LEVELS.includes(level) && <Feather name="video" size={15} color={colors.textMuted} />}
                    <Feather name="chevron-right" size={20} color={colors.textMuted} />
                  </Pressable>
                ))}
              </>
            ) : (
              <Button label={t('intro.play')} onPress={() => onPlay()} variant="accent" />
            )}
          </ScrollView>
        </View>
      )}
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
  body: { gap: 10 },
  title: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 24 },
  sub: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 19 },
  camera: {
    gap: 6, padding: 14, borderRadius: radius.lg, backgroundColor: 'rgba(255,95,168,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,95,168,0.3)',
  },
  cameraHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cameraTitle: { color: colors.pink, fontFamily: fonts.extrabold, fontSize: 14 },
  cameraText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  pickLevel: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 15, marginTop: 2 },
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
