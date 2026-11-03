import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

/**
 * Overlays de story, dessinés sur une base 360×640 (9:16) puis mis à l'échelle.
 * Le fond reste transparent : l'export PNG se pose par-dessus la vidéo du couple.
 */
export const BASE_WIDTH = 360;
export const BASE_HEIGHT = 640;

export type OverlayData =
  | { template: 'whoofus'; question: string; name1: string; name2: string; kicker: string; tag: string }
  | { template: 'match'; percent: number; name1: string; name2: string; kicker: string; caption: string; tag: string }
  | { template: 'question'; question: string; kicker: string; caption: string; tag: string };

export function Overlay({ data, width }: { data: OverlayData; width: number }) {
  const s = width / BASE_WIDTH;
  const u = (n: number) => n * s;
  const tag = (
    <View style={[styles.tagWrap, { bottom: u(32) }]}>
      <Text style={[styles.tag, { fontSize: u(12), paddingHorizontal: u(12), paddingVertical: u(6), borderRadius: u(999) }]}>
        {data.tag} <Text style={{ color: colors.pink }}>Play2Gether</Text>
      </Text>
    </View>
  );

  if (data.template === 'whoofus') {
    return (
      <View style={{ width, height: u(BASE_HEIGHT) }}>
        <View style={[styles.top, { top: u(56), left: u(20), right: u(20), gap: u(10) }]}>
          <Text style={[styles.pill, { backgroundColor: colors.yellow, fontSize: u(11), letterSpacing: u(2), paddingHorizontal: u(12), paddingVertical: u(6), borderRadius: u(999) }]}>
            {data.kicker}
          </Text>
          <Text style={[styles.bubble, { fontSize: u(30), lineHeight: u(32), paddingHorizontal: u(18), paddingVertical: u(14), borderRadius: u(22) }]}>
            {data.question}
          </Text>
        </View>
        <View style={[styles.namesRow, { bottom: u(96), left: u(16), right: u(16) }]}>
          <View style={[styles.namePill, { backgroundColor: colors.pink, gap: u(6), paddingHorizontal: u(16), height: u(44), borderRadius: u(999) }]}>
            <Feather name="arrow-left" size={u(18)} color={colors.bg} />
            <Text style={[styles.nameText, { fontSize: u(18), maxWidth: u(110) }]} numberOfLines={1}>{data.name1}</Text>
          </View>
          <View style={[styles.namePill, { backgroundColor: colors.cyan, gap: u(6), paddingHorizontal: u(16), height: u(44), borderRadius: u(999) }]}>
            <Text style={[styles.nameText, { fontSize: u(18), maxWidth: u(110) }]} numberOfLines={1}>{data.name2}</Text>
            <Feather name="arrow-right" size={u(18)} color={colors.bg} />
          </View>
        </View>
        {tag}
      </View>
    );
  }

  if (data.template === 'match') {
    return (
      <View style={{ width, height: u(BASE_HEIGHT) }}>
        <View style={[styles.matchCard, { bottom: u(96), left: u(24), right: u(24), padding: u(22), borderRadius: u(28), gap: u(4) }]}>
          <Text style={[styles.matchKicker, { fontSize: u(11), letterSpacing: u(1.8) }]}>{data.kicker}</Text>
          <Text style={[styles.matchValue, { fontSize: u(84), lineHeight: u(92) }]}>{data.percent}%</Text>
          <Text style={[styles.matchNames, { fontSize: u(18) }]} numberOfLines={1}>
            <Text style={{ color: colors.pink }}>{data.name1}</Text> & <Text style={{ color: colors.cyan }}>{data.name2}</Text>
          </Text>
          <Text style={[styles.matchCaption, { fontSize: u(13), marginTop: u(6) }]}>{data.caption}</Text>
        </View>
        {tag}
      </View>
    );
  }

  return (
    <View style={{ width, height: u(BASE_HEIGHT) }}>
      <View style={[styles.questionCard, { bottom: u(96), left: u(20), right: u(20), padding: u(22), borderRadius: u(26), gap: u(12) }]}>
        <Text style={[styles.questionKicker, { fontSize: u(11), letterSpacing: u(1.8) }]}>{data.kicker}</Text>
        <Text style={[styles.questionText, { fontSize: u(26), lineHeight: u(30) }]}>{data.question}</Text>
        <Text style={[styles.questionCaption, { fontSize: u(13) }]}>{data.caption}</Text>
      </View>
      {tag}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', alignItems: 'center' },
  pill: { overflow: 'hidden', color: colors.bg, fontFamily: fonts.extrabold },
  bubble: {
    overflow: 'hidden', backgroundColor: colors.bg, color: colors.text, fontFamily: fonts.extrabold, textAlign: 'center',
  },
  namesRow: { position: 'absolute', flexDirection: 'row', justifyContent: 'space-between' },
  namePill: { flexDirection: 'row', alignItems: 'center' },
  nameText: { color: colors.bg, fontFamily: fonts.extrabold },
  tagWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  tag: { overflow: 'hidden', backgroundColor: 'rgba(18,16,34,0.8)', color: colors.text, fontFamily: fonts.bold },

  matchCard: { position: 'absolute', alignItems: 'center', backgroundColor: colors.bg, borderWidth: 1, borderColor: 'rgba(255,216,77,0.5)' },
  matchKicker: { color: colors.yellow, fontFamily: fonts.extrabold, textTransform: 'uppercase' },
  matchValue: { color: colors.text, fontFamily: fonts.extrabold },
  matchNames: { color: colors.text, fontFamily: fonts.extrabold },
  matchCaption: { color: colors.textMuted, fontFamily: fonts.semibold, textAlign: 'center' },

  questionCard: { position: 'absolute', backgroundColor: colors.bg, borderWidth: 1, borderColor: 'rgba(255,95,168,0.5)' },
  questionKicker: { color: colors.pink, fontFamily: fonts.extrabold, textTransform: 'uppercase' },
  questionText: { color: colors.text, fontFamily: fonts.extrabold },
  questionCaption: { color: colors.textMuted, fontFamily: fonts.semibold },
});
