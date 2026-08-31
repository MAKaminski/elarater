/**
 * Stock + guilloche. Every light card in the app.
 *
 * Two surfaces only — paper and wall. Everything sits on one or the other.
 * No third surface. docs/04-design-system.md.
 */
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg from 'react-native-svg';
import { color, radius, space } from '@/theme/tokens';
import { guillocheNodes } from '@/lib/certificate/geometry';
import { SceneNodes } from '../certificate/SceneNodes';

export type PaperSurfaceProps = {
  children?: React.ReactNode;
  /** Documents want tight radii. Nothing on paper exceeds md. */
  corner?: keyof Pick<typeof radius, 'sm' | 'md'>;
  padding?: keyof typeof space;
  pressed?: boolean;
  /** The security tint is decorative; drop it on dense list rows. */
  guilloche?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PaperSurface({
  children,
  corner = 'sm',
  padding = 'md',
  pressed = false,
  guilloche = true,
  style,
}: PaperSurfaceProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  return (
    <View
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize({ w: Math.ceil(width), h: Math.ceil(height) });
      }}
      style={[
        {
          backgroundColor: pressed ? color.stockDeep : color.stock,
          borderRadius: radius[corner],
          padding: space[padding],
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {guilloche && size.w > 0 ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={size.w} height={size.h}>
            <SceneNodes nodes={guillocheNodes(0, 0, size.w, size.h, Math.max(6, Math.round(size.h / 22)))} />
          </Svg>
        </View>
      ) : null}
      {children}
    </View>
  );
}
