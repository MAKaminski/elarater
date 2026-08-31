/**
 * The circular seal. Icon, certificate, empty states, loaders.
 *
 * docs/04-design-system.md reuses this one shape eight ways:
 *   loading -> rotating slowly    empty -> 30% opacity    error -> stamp colour
 * One idea reused eight ways beats eight ideas.
 */
import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg from 'react-native-svg';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { color, type ColorToken } from '@/theme/tokens';
import { seal } from '@/lib/certificate/geometry';
import { SceneNodes } from '../certificate/SceneNodes';

export type StampSealProps = {
  size?: number;
  rotation?: number;
  tone?: ColorToken;
  opacity?: number;
  year?: string;
  condemned?: boolean;
  /** 'stamp' plays the one moment of delight; 'spin' is the loading state. */
  animate?: 'none' | 'stamp' | 'spin';
  style?: StyleProp<ViewStyle>;
};

export function StampSeal({
  size = 92,
  rotation = -8,
  tone = 'stamp',
  opacity = 0.88,
  year = '2026',
  condemned = false,
  animate = 'none',
  style,
}: StampSealProps) {
  // The seal is authored around a centre with radius r; give the stroke room.
  const r = size / 2;
  const box = size + 8;
  const node = seal(box / 2, box / 2, r, { rot: rotation, fill: color[tone], op: opacity, year, condemned });

  const scale = useSharedValue(animate === 'stamp' ? 1.6 : 1);
  const fade = useSharedValue(animate === 'stamp' ? 0 : 1);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (animate === 'stamp') {
      // 260ms ease-out with a tiny rotation settle. The one moment of delight —
      // don't dilute it by animating anything else. docs/04-design-system.md.
      scale.value = withTiming(1, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
        reduceMotion: ReduceMotion.Never,
      });
      fade.value = withTiming(1, { duration: 260 });
      spin.value = withSequence(
        withTiming(3, { duration: 180, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 140 }),
      );
    } else if (animate === 'spin') {
      spin.value = withRepeat(withTiming(360, { duration: 2400, easing: Easing.linear }), -1, false);
    }
  }, [animate, scale, fade, spin]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${spin.value}deg` }],
    opacity: fade.value,
  }));

  const Wrapper = animate === 'none' ? View : Animated.View;

  return (
    <Wrapper style={[{ width: box, height: box }, animate === 'none' ? null : animatedStyle, style]}>
      <Svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} accessibilityElementsHidden>
        <SceneNodes nodes={[node]} />
      </Svg>
    </Wrapper>
  );
}
