import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { CoupleNames } from '@/utils/couple';

interface NamesFormProps {
  initial: CoupleNames;
  onSubmit: (names: CoupleNames) => void;
}

const PLAYER_COLORS = [colors.pink, colors.cyan];

/** Saisie des deux prénoms, utilisée par les jeux qui affichent les noms. */
export function NamesForm({ initial, onSubmit }: NamesFormProps) {
  const { t } = useTranslation();
  const [names, setNames] = useState<CoupleNames>(initial);
  const valid = names[0].trim().length > 0 && names[1].trim().length > 0;

  const update = (i: 0 | 1, value: string) => {
    const next: CoupleNames = [...names];
    next[i] = value;
    setNames(next);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.body}>
        <Text style={styles.title}>{t('names.title')}</Text>
        <Text style={styles.sub}>{t('names.subtitle')}</Text>
        {([0, 1] as const).map((i) => (
          <View key={i} style={styles.field}>
            <Text style={[styles.label, { color: PLAYER_COLORS[i] }]}>{t(i === 0 ? 'names.first' : 'names.second')}</Text>
            <TextInput
              value={names[i]}
              onChangeText={(v) => update(i, v)}
              placeholder={t(i === 0 ? 'names.placeholder1' : 'names.placeholder2')}
              placeholderTextColor={colors.textMuted}
              maxLength={14}
              autoCapitalize="words"
              returnKeyType={i === 0 ? 'next' : 'done'}
              style={[styles.input, { borderColor: names[i] ? PLAYER_COLORS[i] : colors.borderStrong }]}
              accessibilityLabel={t(i === 0 ? 'names.first' : 'names.second')}
            />
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <Button label={t('names.go')} onPress={() => onSubmit(names)} disabled={!valid} variant="accent" />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, paddingHorizontal: spacing.screen, paddingTop: 32, gap: 18 },
  title: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 32 },
  sub: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 15, marginBottom: 8 },
  field: { gap: 8 },
  label: { fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
  input: {
    height: 58, borderRadius: radius.lg, borderWidth: 1.5, backgroundColor: colors.surface,
    paddingHorizontal: 18, color: colors.text, fontFamily: fonts.bold, fontSize: 18,
  },
  footer: { paddingHorizontal: spacing.screen, paddingBottom: 12 },
});
