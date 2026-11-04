import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';

const format = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Chrono à rebours lancé à la demande. À remonter (key) pour chaque nouvelle carte. */
export function Countdown({ seconds, color }: { seconds: number; color: string }) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
  };
  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const start = () => {
    if (running) return stop();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const from = remaining > 0 ? remaining : seconds;
    setRemaining(from);
    setRunning(true);
    const endAt = Date.now() + from * 1000;
    timer.current = setInterval(() => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        stop();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
    }, 250);
  };

  const done = remaining === 0;
  return (
    <Pressable
      onPress={start}
      accessibilityRole="button"
      style={({ pressed }) => [styles.chip, { borderColor: color }, running && { backgroundColor: color }, pressed && { opacity: 0.8 }]}
    >
      <Feather name={running ? 'pause' : done ? 'rotate-ccw' : 'clock'} size={16} color={running ? colors.bg : color} />
      <Text style={[styles.text, { color: running ? colors.bg : color }]}>
        {done ? t('common.timeUp') : running ? format(remaining) : t('common.startTimer', { time: format(remaining) })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    height: 44, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1.5,
  },
  text: { fontFamily: fonts.extrabold, fontSize: 15, fontVariant: ['tabular-nums'] },
});
