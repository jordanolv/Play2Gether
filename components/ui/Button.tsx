import { colors, fonts } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

type Variant = 'primary' | 'accent' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  style?: ViewStyle;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', style, disabled }: ButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Text style={[styles.label, { color: variant === 'ghost' ? colors.textMuted : colors.bg }, variant === 'ghost' && styles.ghostLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  label: { fontFamily: fonts.extrabold, fontSize: 17 },
  ghostLabel: { fontFamily: fonts.bold, fontSize: 15 },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.text },
  accent: { backgroundColor: colors.pink },
  ghost: { backgroundColor: 'transparent', height: 48 },
});
