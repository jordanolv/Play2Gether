import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { GameHeader } from '@/components/ui/GameHeader';
import { Screen } from '@/components/ui/Screen';
import { WithCoupleNames } from '@/components/ui/WithCoupleNames';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { CoupleNames } from '@/utils/couple';
import { LADDER_EXAMPLE, Ladder, LadderVerdict, drawLadders, ladderPar, ladderVerdict } from '@/utils/ladder';
import { byLanguage } from '@/utils/random';
import { updateDailyStreak } from '@/utils/streak';

const ROUNDS = 5;
const PLAYER_COLORS = [colors.pink, colors.cyan] as const;
const GLOWS = [
  { color: colors.violet, size: 420, top: -160, right: -160 },
  { color: colors.mint, size: 340, bottom: 40, left: -180 },
];
const VERDICT_COLORS: Record<LadderVerdict, string> = {
  under: colors.mint,
  par: colors.yellow,
  over: colors.cyan,
  gaveUp: colors.textMuted,
};

interface RoundResult {
  words: number;
  par: number;
  gaveUp: boolean;
}

export default function LadderScreen() {
  const { t, i18n } = useTranslation();
  return (
    <WithCoupleNames title={t('games.ladder.title')} glows={GLOWS}>
      {(names) => <LadderGame key={i18n.language} names={names} />}
    </WithCoupleNames>
  );
}

/** Un mot en tuiles de lettres. `diff` met en valeur les lettres différentes d'un autre mot. */
export function WordTiles({ word, color, diff, size = 'lg' }: { word: string; color: string; diff?: string; size?: 'lg' | 'sm' }) {
  const small = size === 'sm';
  return (
    <View style={styles.tiles}>
      {[...word.toUpperCase()].map((letter, i) => {
        const changed = diff !== undefined && diff[i]?.toUpperCase() !== letter;
        return (
          <View
            key={i}
            style={[
              small ? styles.tileSm : styles.tile,
              { borderColor: color },
              changed && { backgroundColor: color },
            ]}
          >
            <Text style={[small ? styles.tileTextSm : styles.tileText, changed && { color: colors.bg }]}>{letter}</Text>
          </View>
        );
      })}
    </View>
  );
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
/** Compare sans tenir compte des accents ni de la casse (ÂNE = ANE). */
const plain = (w: string) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

type Measurable = { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void };

interface DragKeyProps {
  letter: string;
  color: string;
  onTap: (letter: string) => void;
  onGrab: () => void;
  onMove: (x: number, y: number) => void;
  onDrop: (letter: string, x: number, y: number) => void;
}

/** Une lettre de la liste : on la touche, ou on la glisse sur la lettre à changer. */
function DragKey(props: DragKeyProps) {
  const [pan] = useState(() => new Animated.ValueXY());
  const [dragging, setDragging] = useState(false);
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  // Le geste garde les derniers callbacks via `latest` : le PanResponder n'est créé qu'une fois
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setDragging(true);
        latest.current.onGrab();
      },
      onPanResponderMove: (_, g) => {
        pan.setValue({ x: g.dx, y: g.dy });
        latest.current.onMove(g.moveX, g.moveY);
      },
      onPanResponderRelease: (_, g) => {
        const { letter, onTap, onDrop } = latest.current;
        if (Math.abs(g.dx) < 8 && Math.abs(g.dy) < 8) onTap(letter);
        else onDrop(letter, g.moveX, g.moveY);
        setDragging(false);
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, bounciness: 8 }).start();
      },
      onPanResponderTerminate: () => {
        latest.current.onMove(-1, -1); // efface la tuile survolée
        setDragging(false);
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      },
    })
  );

  return (
    <Animated.View
      {...responder.panHandlers}
      accessibilityRole="button"
      style={[
        styles.key,
        { borderColor: props.color },
        { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: dragging ? 1.35 : 1 }] },
        dragging && { backgroundColor: props.color, zIndex: 50, elevation: 12 },
      ]}
    >
      <Text style={[styles.keyText, dragging && { color: colors.bg }]}>{props.letter}</Text>
    </Animated.View>
  );
}

function LadderGame({ names }: { names: CoupleNames }) {
  const { t, i18n } = useTranslation();
  const [ladders, setLadders] = useState<Ladder[]>(() => drawLadders(i18n.language, ROUNDS));
  const [results, setResults] = useState<RoundResult[]>([]);
  const [moves, setMoves] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<RoundResult | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const tileRefs = useRef<(Measurable | null)[]>([]);
  const tileRects = useRef<{ x: number; y: number; w: number; h: number }[]>([]);

  const round = results.length;
  const finished = round >= ladders.length;
  const ladder = ladders[Math.min(round, ladders.length - 1)];
  const par = ladder ? ladderPar(ladder) : 0;
  const start = ladder?.[0] ?? '';
  const goal = ladder?.[ladder.length - 1] ?? '';
  const current = moves.length > 0 ? moves[moves.length - 1] : start;
  // Chacun son tour ; celui qui commence change à chaque manche
  const turn = ((round + moves.length) % 2) as 0 | 1;

  const endRound = (words: number, gaveUp: boolean) => {
    setSelected(null);
    setRevealed({ words, par, gaveUp });
    Haptics.notificationAsync(
      gaveUp ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success
    ).catch(() => {});
  };

  const applyLetter = (index: number, letter: string) => {
    if (plain(current[index]) === plain(letter)) return;
    const chars = [...current];
    chars[index] = letter.toLowerCase();
    const word = chars.join('');
    if (plain(word) === plain(goal)) {
      setMoves([...moves, goal]);
      endRound(moves.length + 1, false);
      return;
    }
    setMoves([...moves, word]);
    setSelected(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  // Position des lettres du mot au début d'un glissé, pour savoir sur laquelle on dépose
  const measureTiles = () => {
    tileRefs.current.forEach((ref, i) => {
      ref?.measureInWindow((x, y, w, h) => {
        tileRects.current[i] = { x, y, w, h };
      });
    });
  };
  const tileAt = (px: number, py: number) => {
    const pad = 12;
    const i = tileRects.current.findIndex((r) => r && px >= r.x - pad && px <= r.x + r.w + pad && py >= r.y - pad && py <= r.y + r.h + pad);
    return i >= 0 && i < current.length ? i : null;
  };
  const onDragMove = (x: number, y: number) => {
    const i = tileAt(x, y);
    if (i !== hover) setHover(i);
  };
  const onDragDrop = (letter: string, x: number, y: number) => {
    setHover(null);
    const i = tileAt(x, y);
    if (i !== null) applyLetter(i, letter);
  };
  const onKeyTap = (letter: string) => {
    if (selected !== null) applyLetter(selected, letter);
  };

  const next = () => {
    if (!revealed) return;
    const all = [...results, revealed];
    setResults(all);
    setRevealed(null);
    setMoves([]);
    setSelected(null);
    if (all.length >= ladders.length) updateDailyStreak();
  };

  const restart = () => {
    setLadders(drawLadders(i18n.language, ROUNDS));
    setResults([]);
    setMoves([]);
    setSelected(null);
    setRevealed(null);
  };

  if (!ladder) return <Screen glows={GLOWS}><GameHeader title={t('games.ladder.title')} /></Screen>;

  if (finished) {
    const played = results.filter((r) => !r.gaveUp);
    const totalWords = played.reduce((s, r) => s + r.words, 0);
    const totalPar = played.reduce((s, r) => s + r.par, 0);
    const gap = totalWords - totalPar;
    const gaveUps = results.length - played.length;
    const mood = played.length === 0 ? 'ok' : gap <= 0 && gaveUps === 0 ? 'perfect' : gap <= 3 && gaveUps <= 1 ? 'good' : 'ok';
    return (
      <Screen glows={GLOWS}>
        <GameHeader title={t('games.ladder.results')} />
        <ScrollView contentContainerStyle={styles.resultsContent}>
          <View style={styles.resultCard}>
            <Text style={styles.resultKicker}>{t(`games.ladder.${mood}`)}</Text>
            {played.length > 0 && <Text style={styles.resultValue}>{gap > 0 ? `+${gap}` : gap}</Text>}
            {played.length > 0 && <Text style={styles.resultSub}>{t('games.ladder.total', { words: totalWords, par: totalPar })}</Text>}
          </View>
          {results.map((r, i) => {
            const l = ladders[i];
            const v = ladderVerdict(r.words, r.par, r.gaveUp);
            return (
              <View key={i} style={styles.recap}>
                <Text style={styles.recapWords} numberOfLines={1}>
                  {l[0].toUpperCase()} → {l[l.length - 1].toUpperCase()}
                </Text>
                <Text style={[styles.recapVerdict, { color: VERDICT_COLORS[v] }]}>
                  {r.gaveUp ? '—' : `${r.words} / ${r.par}`}
                </Text>
              </View>
            );
          })}
          <Button label={t('games.ladder.playAgain')} onPress={restart} variant="accent" />
        </ScrollView>
      </Screen>
    );
  }

  const example = byLanguage(i18n.language, LADDER_EXAMPLE).map((w) => w.toUpperCase()).join(' → ');
  const color = PLAYER_COLORS[turn];

  return (
    <Screen glows={GLOWS}>
      <GameHeader
        title={t('games.ladder.title')}
        step={round + 1}
        total={ladders.length}
        onHelp={() => setShowHelp((v) => !v)}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.label}>{t('games.ladder.to')}</Text>
          <WordTiles word={goal} color={colors.mint} />
          <View style={styles.middle}>
            <Feather name="arrow-up" size={22} color={colors.textMuted} />
            <Text style={styles.par}>{t('games.ladder.par', { count: par })}</Text>
          </View>
          {!revealed && (
            <>
              <Text style={styles.label}>{t('games.ladder.turn', { name: names[turn] })}</Text>
              <View style={styles.tiles}>
                {[...current.toUpperCase()].map((letter, i) => (
                  <Pressable
                    key={i}
                    ref={(r) => { tileRefs.current[i] = r; }}
                    collapsable={false}
                    onPress={() => setSelected(selected === i ? null : i)}
                    accessibilityRole="button"
                    style={[styles.tile, { borderColor: color }, (selected === i || hover === i) && { backgroundColor: color }]}
                  >
                    <Text style={[styles.tileText, (selected === i || hover === i) && { color: colors.bg }]}>{letter}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>

        {revealed ? (
          <View style={styles.reveal}>
            {(() => {
              const v = ladderVerdict(revealed.words, revealed.par, revealed.gaveUp);
              return (
                <Text style={[styles.verdict, { color: VERDICT_COLORS[v] }]}>
                  {v === 'over'
                    ? t('games.ladder.verdict.over', { count: revealed.words - revealed.par })
                    : t(`games.ladder.verdict.${v}`)}
                </Text>
              );
            })()}
            {!revealed.gaveUp && <Text style={styles.count}>{t('games.ladder.total', { words: revealed.words, par: revealed.par })}</Text>}
          </View>
        ) : (
          <View style={styles.turnRow}>
            <Text style={styles.count}>{t('games.ladder.words', { count: moves.length })}</Text>
            <Text style={styles.tapHint}>{t(selected === null ? 'games.ladder.tapHint' : 'games.ladder.pickLetter')}</Text>
          </View>
        )}

        {showHelp && (
          <View style={styles.howTo}>
            <Text style={styles.howToText}>{t('games.ladder.howTo')}</Text>
            <Text style={styles.example}>{t('games.ladder.example', { example })}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {revealed ? (
          <Button
            label={round + 1 >= ladders.length ? t('games.ladder.seeResults') : t('games.ladder.next')}
            onPress={next}
            variant="accent"
          />
        ) : (
          <>
            <View style={styles.keys}>
              {LETTERS.map((l) => (
                <DragKey key={l} letter={l} color={color} onTap={onKeyTap} onGrab={measureTiles} onMove={onDragMove} onDrop={onDragDrop} />
              ))}
            </View>
            <View style={styles.tools}>
              {moves.length > 0 && (
                <Pressable onPress={() => { setMoves(moves.slice(0, -1)); setSelected(null); }} accessibilityRole="button" style={styles.tool}>
                  <Feather name="rotate-ccw" size={14} color={colors.textMuted} />
                  <Text style={styles.toolText}>{t('games.ladder.undo')}</Text>
                </Pressable>
              )}
              <Pressable onPress={() => endRound(moves.length, true)} accessibilityRole="button" style={styles.tool}>
                <Feather name="skip-forward" size={14} color={colors.textMuted} />
                <Text style={styles.toolText}>{t('games.ladder.giveUp')}</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.screen, paddingTop: 20, paddingBottom: 24, gap: 18 },
  card: {
    alignItems: 'center', gap: 10, borderRadius: radius.xxl, backgroundColor: colors.surface, paddingVertical: 24, paddingHorizontal: 16,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)',
    shadowColor: colors.violet, shadowOpacity: 0.25, shadowRadius: 30, shadowOffset: { width: 0, height: 20 }, elevation: 10,
  },
  label: { color: colors.textMuted, fontFamily: fonts.extrabold, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase' },
  middle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  par: {
    color: colors.bg, backgroundColor: colors.yellow, fontFamily: fonts.extrabold, fontSize: 13, overflow: 'hidden',
    borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5,
  },
  tiles: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  tile: { width: 50, height: 58, borderRadius: radius.md, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tileText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 28 },
  tileSm: { width: 34, height: 38, borderRadius: radius.sm, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tileTextSm: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 18 },

  turnRow: { alignItems: 'center', gap: 4 },
  count: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 15 },
  howTo: { gap: 8, padding: 16, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.05)' },
  howToText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  example: { color: colors.yellow, fontFamily: fonts.bold, fontSize: 13 },

  reveal: { alignItems: 'center', gap: 8 },
  verdict: { fontFamily: fonts.extrabold, fontSize: 24, textAlign: 'center', marginBottom: 4 },

  footer: { paddingHorizontal: spacing.screen, paddingBottom: 8, gap: 6, zIndex: 10 },
  keys: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, paddingBottom: 4 },
  key: { width: 38, height: 38, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  keyText: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 16 },
  tapHint: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, textAlign: 'center' },
  tools: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 12 },
  toolText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 14 },

  resultsContent: { padding: spacing.screen, paddingTop: 28, gap: 12 },
  resultCard: {
    alignItems: 'center', paddingVertical: 26, borderRadius: radius.xxl, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)', gap: 4, marginBottom: 6,
  },
  resultKicker: { color: colors.yellow, fontFamily: fonts.extrabold, fontSize: 16 },
  resultValue: { color: colors.text, fontFamily: fonts.extrabold, fontSize: 64, lineHeight: 72 },
  resultSub: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 14 },
  recap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52,
    borderRadius: radius.lg, backgroundColor: colors.surface,
  },
  recapWords: { flex: 1, color: colors.text, fontFamily: fonts.extrabold, fontSize: 16 },
  recapVerdict: { fontFamily: fonts.extrabold, fontSize: 16 },
});
