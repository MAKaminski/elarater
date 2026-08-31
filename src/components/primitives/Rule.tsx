/** Hairline divider. Every separator in the app. */
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { border, color, type ColorToken } from '@/theme/tokens';

export type RuleProps = {
  tone?: ColorToken;
  opacity?: number;
  thickness?: number;
  style?: StyleProp<ViewStyle>;
};

export function Rule({ tone = 'ink', opacity = 0.3, thickness = border.hairline, style }: RuleProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ height: thickness, backgroundColor: color[tone], opacity, width: '100%' }, style]}
    />
  );
}
