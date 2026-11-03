// Play2Gether V2 — direction « Néon Nuit »

export const colors = {
  bg: '#121022',
  surface: '#1E1A38',
  surfaceRaised: '#262046',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#F5F3FF',
  textMuted: '#A9A3C9',
  pink: '#FF5FA8',
  violet: '#8B5CF6',
  yellow: '#FFD84D',
  cyan: '#22D3EE',
  lilac: '#C4B5FD',
  mint: '#86EFAC',
  peach: '#FDBA74',
  track: 'rgba(255,255,255,0.12)',
} as const;

export const fonts = {
  regular: 'BricolageGrotesque_400Regular',
  semibold: 'BricolageGrotesque_600SemiBold',
  bold: 'BricolageGrotesque_700Bold',
  extrabold: 'BricolageGrotesque_800ExtraBold',
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 32,
  pill: 999,
} as const;

export const spacing = {
  screen: 20,
} as const;
