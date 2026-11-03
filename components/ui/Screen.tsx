import { colors } from '@/constants/theme';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Glow = { color: string; size: number; top?: number; left?: number; right?: number; bottom?: number };

const DEFAULT_GLOWS: Glow[] = [
  { color: colors.pink, size: 420, top: -180, right: -160 },
  { color: colors.yellow, size: 320, bottom: 60, left: -170 },
];

interface ScreenProps {
  children: ReactNode;
  glows?: Glow[];
  style?: ViewStyle;
}

/** Fond nuit + halos colorés, commun à tous les écrans. */
export function Screen({ children, glows = DEFAULT_GLOWS, style }: ScreenProps) {
  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {glows.map((g, i) => (
          <View key={i} style={[styles.glowWrap, { width: g.size, height: g.size, top: g.top, left: g.left, right: g.right, bottom: g.bottom }]}>
            {/* Pas de blur natif en RN : on empile des cercles concentriques très transparents */}
            {[1, 0.78, 0.56].map((scale) => (
              <View
                key={scale}
                style={{
                  position: 'absolute',
                  width: g.size * scale,
                  height: g.size * scale,
                  borderRadius: (g.size * scale) / 2,
                  backgroundColor: g.color,
                  opacity: 0.06,
                }}
              />
            ))}
          </View>
        ))}
      </View>
      <SafeAreaView style={[styles.safe, style]} edges={['top', 'bottom']}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  safe: { flex: 1 },
  glowWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
