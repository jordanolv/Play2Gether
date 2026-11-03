import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { ComponentRef, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { BASE_HEIGHT, BASE_WIDTH, Overlay, OverlayData } from '@/components/story/Overlays';
import { Button } from '@/components/ui/Button';
import { GameHeader } from '@/components/ui/GameHeader';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import questionsEn from '@/data/questions-en.json';
import questionsFr from '@/data/questions-fr.json';
import whoEn from '@/data/whoofus-en.json';
import whoFr from '@/data/whoofus-fr.json';
import { useCoupleNames } from '@/utils/couple';
import { byLanguage, pickRandom } from '@/utils/random';

type Template = OverlayData['template'];
const TEMPLATES: Template[] = ['whoofus', 'match', 'question'];
const EXPORT_WIDTH = 1080;
const EXPORT_HEIGHT = 1920;

type Params = { template?: string; question?: string; name1?: string; name2?: string; percent?: string };

export default function StoryStudio() {
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams<Params>();
  const couple = useCoupleNames();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const overlayRef = useRef<ComponentRef<typeof View>>(null);

  const initialTemplate = TEMPLATES.includes(params.template as Template) ? (params.template as Template) : 'whoofus';
  const [template, setTemplate] = useState<Template>(initialTemplate);
  const randomWho = () => pickRandom(byLanguage(i18n.language, { fr: whoFr, en: whoEn }), 1)[0];
  const randomQuestion = () => {
    const levels = byLanguage(i18n.language, { fr: questionsFr, en: questionsEn });
    return pickRandom([...levels.light, ...levels.deep], 1)[0];
  };
  const [whoQuestion, setWhoQuestion] = useState(() => (initialTemplate === 'whoofus' && params.question) || randomWho());
  const [coupleQuestion, setCoupleQuestion] = useState(() => (initialTemplate === 'question' && params.question) || randomQuestion());
  const [busy, setBusy] = useState(false);

  const name1 = params.name1 || couple.names[0] || t('games.scattergories.player1');
  const name2 = params.name2 || couple.names[1] || t('games.scattergories.player2');
  const percent = Number(params.percent ?? 80);
  const tag = t('story.tag');

  const data: OverlayData =
    template === 'whoofus'
      ? { template, question: whoQuestion, name1, name2, kicker: t('story.whoKicker'), tag }
      : template === 'match'
        ? { template, percent, name1, name2, kicker: t('story.matchKicker'), caption: t('story.matchCaption'), tag }
        : { template, question: coupleQuestion, kicker: t('story.questionKicker'), caption: t('story.questionCaption'), tag };

  // Aperçu 9:16 qui tient dans l'écran
  const previewWidth = Math.min(screenWidth - spacing.screen * 2 - 40, (screenHeight * 0.52 * BASE_WIDTH) / BASE_HEIGHT);
  const previewHeight = (previewWidth * BASE_HEIGHT) / BASE_WIDTH;

  const capture = () =>
    captureRef(overlayRef, { format: 'png', result: 'tmpfile', width: EXPORT_WIDTH, height: EXPORT_HEIGHT });

  const save = async () => {
    setBusy(true);
    try {
      const permission = await requestPermissionsAsync(true);
      if (!permission.granted) {
        Alert.alert(t('story.permissionTitle'), t('story.permissionBody'));
        return;
      }
      const uri = await capture();
      await Asset.create(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert(t('story.savedTitle'), t('story.savedBody'));
    } catch {
      Alert.alert(t('common.error'), t('story.exportError'));
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    setBusy(true);
    try {
      const uri = await capture();
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: t('story.share') });
    } catch {
      Alert.alert(t('common.error'), t('story.exportError'));
    } finally {
      setBusy(false);
    }
  };

  const shuffle = () => {
    Haptics.selectionAsync().catch(() => {});
    if (template === 'whoofus') setWhoQuestion(randomWho());
    if (template === 'question') setCoupleQuestion(randomQuestion());
  };

  return (
    <Screen>
      <GameHeader title={t('story.title')} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.chips}>
          {TEMPLATES.map((tpl) => (
            <Pressable
              key={tpl}
              onPress={() => setTemplate(tpl)}
              accessibilityRole="button"
              accessibilityState={{ selected: tpl === template }}
              style={[styles.chip, tpl === template && styles.chipActive]}
            >
              <Text style={[styles.chipText, tpl === template && styles.chipTextActive]}>{t(`story.templates.${tpl}`)}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.preview, { width: previewWidth, height: previewHeight }]}>
          {/* Faux fond « vidéo » : il n'est pas dans l'export */}
          <View style={[StyleSheet.absoluteFill, styles.fakeVideo]}>
            {Array.from({ length: 14 }, (_, i) => (
              <View key={i} style={[styles.stripe, { top: i * 48 - 60 }]} />
            ))}
            <Text style={styles.fakeVideoText}>{t('story.videoHere')}</Text>
          </View>
          <View ref={overlayRef} collapsable={false} style={{ backgroundColor: 'transparent' }}>
            <Overlay data={data} width={previewWidth} />
          </View>
        </View>

        {template !== 'match' && (
          <Pressable onPress={shuffle} accessibilityRole="button" style={({ pressed }) => [styles.shuffle, pressed && { opacity: 0.7 }]}>
            <Feather name="refresh-cw" size={15} color={colors.textMuted} />
            <Text style={styles.shuffleText}>{t('story.shuffle')}</Text>
          </Pressable>
        )}

        <Text style={styles.howTo}>{t('story.howTo')}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button label={busy ? t('common.loading') : t('story.save')} onPress={save} variant="accent" disabled={busy} style={{ flex: 1 }} />
        <Pressable
          onPress={share}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={t('story.share')}
          style={({ pressed }) => [styles.shareBtn, (pressed || busy) && { opacity: 0.7 }]}
        >
          <Feather name="share" size={22} color={colors.text} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.screen, paddingTop: 20, paddingBottom: 12, alignItems: 'center', gap: 16 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chip: {
    height: 40, paddingHorizontal: 14, borderRadius: radius.pill, justifyContent: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.text, borderColor: colors.text },
  chipText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 14 },
  chipTextActive: { color: colors.bg },

  preview: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderStrong },
  fakeVideo: { backgroundColor: '#332E48', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  stripe: { position: 'absolute', left: -100, right: -100, height: 22, backgroundColor: '#3A3550', transform: [{ rotate: '-30deg' }] },
  fakeVideoText: { color: 'rgba(255,255,255,0.5)', fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1 },

  shuffle: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 16 },
  shuffleText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 14 },
  howTo: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, textAlign: 'center', maxWidth: 320 },

  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: spacing.screen, paddingBottom: 12, paddingTop: 4 },
  shareBtn: {
    width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong,
  },
});
