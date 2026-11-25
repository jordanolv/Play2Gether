import { Feather } from '@expo/vector-icons';
import { ReactNode, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius } from '@/constants/theme';

interface Props {
  title: string;
  overlayOn: boolean;
  onOverlayChange: (on: boolean) => void;
  /** Présentations proposées pour ce jeu (aucun sélecteur s'il y en a moins de deux). */
  styleOptions?: readonly string[];
  styleValue?: string;
  onStyleChange?: (value: string) => void;
  onResetPlacement: () => void;
  onClose: () => void;
  onQuit: () => void;
  /** Hauteur maximale : au-delà, le contenu défile (petits écrans, texte agrandi). */
  maxHeight: number;
  /** Hauteur réelle du panneau, pour garder l'overlay visible dessous. */
  onHeight: (height: number) => void;
  /** Réglages propres au jeu (ex. niveau d'Action ou Vérité). */
  children?: ReactNode;
}

/** Réglages du mode caméra : affichés à la demande seulement, jamais sur l'image prête à enregistrer. */
export function CameraSettings({
  title, overlayOn, onOverlayChange, styleOptions = [], styleValue, onStyleChange, onResetPlacement, onClose, onQuit, maxHeight, onHeight, children,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const doneRef = useRef<any>(null);
  // Web : le focus clavier arrive dans le panneau à l'ouverture
  useEffect(() => {
    if (Platform.OS === 'web') (doneRef.current as any)?.focus?.();
  }, []);

  return (
    <View
      style={[styles.panel, { paddingTop: insets.top + 8, maxHeight }]}
      accessibilityViewIsModal
      testID="camera-settings"
      onLayout={(e) => onHeight(Math.ceil(e.nativeEvent.layout.height))}
    >
      <View style={styles.header}>
        <Pressable onPress={onQuit} accessibilityRole="button" style={({ pressed }) => [styles.quit, pressed && { opacity: 0.8 }]}>
          <Feather name="x" size={16} color={colors.text} />
          <Text style={styles.quitText}>{t('filter.quit')}</Text>
        </Pressable>
        <View style={styles.titlePill}>
          <Feather name="video" size={14} color={colors.pink} />
          <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
        </View>
        <Pressable ref={doneRef} onPress={onClose} accessibilityRole="button" style={({ pressed }) => [styles.done, pressed && { opacity: 0.8 }]}>
          <Text style={styles.doneText}>{t('filter.done')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>{t('filter.settingsTitle')}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>{t('filter.overlay')}</Text>
        <Text style={styles.value}>{overlayOn ? t('filter.overlayOn') : t('filter.overlayOff')}</Text>
        <Switch
          value={overlayOn}
          onValueChange={onOverlayChange}
          accessibilityLabel={t('filter.overlay')}
          trackColor={{ false: colors.track, true: colors.pink }}
        />
      </View>

      {styleOptions.length > 1 && (
        <View style={styles.row}>
          <Text style={styles.label}>{t('filter.style')}</Text>
          <View style={styles.segments}>
            {styleOptions.map((option) => {
              const active = option === styleValue;
              return (
                <Pressable
                  key={option}
                  onPress={() => onStyleChange?.(option)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  testID={`overlay-style-${option}`}
                  style={[styles.segment, active && { backgroundColor: colors.pink }]}
                >
                  <Text style={[styles.segmentText, active && { color: colors.bg }]}>{t(`filter.styles.${option}`)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {children}

      <Pressable onPress={onResetPlacement} accessibilityRole="button" style={({ pressed }) => [styles.reset, pressed && { opacity: 0.8 }]}>
        <Feather name="maximize" size={14} color={colors.textMuted} />
        <Text style={styles.resetText}>{t('filter.resetPlacement')}</Text>
      </Pressable>

      <Text style={styles.how}>{t('filter.settingsHowTo')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute', top: 0, left: 0, right: 0, gap: 10, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: 'rgba(18,16,34,0.94)', borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl,
  },
  scroll: { gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quit: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingHorizontal: 14, borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
  },
  quitText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 14 },
  titlePill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 0 },
  titleText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 14, flexShrink: 1 },
  done: { height: 44, paddingHorizontal: 18, borderRadius: radius.pill, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  doneText: { color: colors.bg, fontFamily: fonts.extrabold, fontSize: 14 },
  heading: { color: colors.textMuted, fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, flexWrap: 'wrap' },
  label: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 15, flexGrow: 1 },
  value: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 13 },
  segments: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: radius.pill, backgroundColor: colors.surface },
  segment: { height: 36, paddingHorizontal: 16, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segmentText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 13 },
  reset: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  resetText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 14 },
  how: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 12, lineHeight: 17 },
});
