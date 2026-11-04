import * as Haptics from 'expo-haptics';
import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import {
  GestureDetector, useExclusiveGestures, useLongPressGesture, usePanGesture, usePinchGesture, useSimultaneousGestures, useTapGesture,
} from 'react-native-gesture-handler';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const MIN_SCALE = 0.5;
const MAX_SCALE = 2;

/** Position et taille d'un élément d'overlay, partagées avec le thread UI. */
export interface Placement {
  x: SharedValue<number>;
  y: SharedValue<number>;
  scale: SharedValue<number>;
}

export function usePlacement(): Placement & { reset: () => void } {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const scale = useSharedValue(1);
  const reset = () => {
    x.set(0);
    y.set(0);
    scale.set(1);
  };
  return { x, y, scale, reset };
}

interface Props {
  placement: Placement;
  /** Appui simple (sans glisser) : reçoit la position X du doigt à l'écran. */
  onTap: (absoluteX: number) => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

const onReset = () => {
  Haptics.selectionAsync().catch(() => {});
};

/** Élément d'overlay qu'on peut déplacer (un doigt), agrandir ou réduire (deux doigts), et remettre en place (appui long). */
export function Movable({ placement, onTap, style, children }: Props) {
  const { x, y, scale } = placement;
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startScale = useSharedValue(1);

  const pan = usePanGesture({
    minDistance: 8,
    onActivate: () => {
      'worklet';
      startX.set(x.get());
      startY.set(y.get());
    },
    onUpdate: (e) => {
      'worklet';
      x.set(startX.get() + e.translationX);
      y.set(startY.get() + e.translationY);
    },
  });

  const pinch = usePinchGesture({
    onActivate: () => {
      'worklet';
      startScale.set(scale.get());
    },
    onUpdate: (e) => {
      'worklet';
      scale.set(Math.min(MAX_SCALE, Math.max(MIN_SCALE, startScale.get() * e.scale)));
    },
  });

  const tap = useTapGesture({
    maxDuration: 400,
    onActivate: (e) => {
      'worklet';
      scheduleOnRN(onTap, e.absoluteX);
    },
  });

  // Appui long : l'élément revient à sa place et à sa taille d'origine
  const longPress = useLongPressGesture({
    minDuration: 600,
    onActivate: () => {
      'worklet';
      x.set(withSpring(0));
      y.set(withSpring(0));
      scale.set(withSpring(1));
      scheduleOnRN(onReset);
    },
  });

  const gesture = useExclusiveGestures(useSimultaneousGestures(pan, pinch), longPress, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: scale.get() }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
}
