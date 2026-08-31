/**
 * Tracked caps, fade colour. Every label in the app.
 *
 * Renders BAKED GLYPH OUTLINES rather than live text. Archivo is a variable font and
 * this label must be wght 700 / wdth 88; native cannot select variable axes, so live
 * text would drift from the certificate on iOS and Android. Drawing the same outlines
 * the certificate uses makes the pre-printed form identical everywhere.
 * See scripts/build-glyphs.ts.
 */
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { color, type ColorToken } from '@/theme/tokens';
import { layoutText, measureText } from '@/lib/certificate/text';

export type FormLabelProps = {
  children: string;
  size?: number;
  tracking?: number;
  tone?: ColorToken;
  align?: 'start' | 'middle' | 'end';
  style?: StyleProp<ViewStyle>;
};

export function FormLabel({
  children,
  size = 11,
  tracking = 2.2,
  tone = 'fade',
  align = 'start',
  style,
}: FormLabelProps) {
  const text = children.toUpperCase();
  const fill = color[tone];
  const width = Math.ceil(measureText(text, 'form', size, tracking));
  // Ascender-to-descender box for the baked face, with room for the tracked caps.
  const height = Math.ceil(size * 1.4);
  const baseline = size;

  const nodes = layoutText(text, 0, baseline, { face: 'form', size, tracking, fill });

  return (
    <View
      style={style}
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}
      // Labels are decorative context; the value below them carries the meaning.
      // docs/04-design-system.md, Accessibility.
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {nodes.map((node, i) =>
          node.t === 'path' ? (
            <Path key={i} d={node.d} transform={node.transform} fill={node.fill} />
          ) : null,
        )}
      </Svg>
    </View>
  );
}
