/** Courier, ink. Every user or data value — what the inspector typed in later. */
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { color, font, type ColorToken } from '@/theme/tokens';

export type TypedValueProps = {
  children: React.ReactNode;
  size?: number;
  tone?: ColorToken;
  bold?: boolean;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
};

export function TypedValue({
  children,
  size = 19,
  tone = 'ink',
  bold = true,
  numberOfLines,
  style,
}: TypedValueProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: bold ? font.typedBold : font.typed, fontSize: size, color: color[tone] },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
