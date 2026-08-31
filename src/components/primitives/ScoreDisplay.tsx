/**
 * Alfa Slab numeral + band label. Certificate, list rows, profile.
 * Score colour comes from the band, so DEFICIENT and CONDEMNED turn oxblood on their own.
 */
import { View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { color, font } from '@/theme/tokens';
import { bandForScore, formatScore } from '@/lib/certificate/bands';
import { FormLabel } from './FormLabel';

export type ScoreDisplayProps = {
  score: number;
  size?: number;
  /** 'full' shows OUT OF FIVE and the band; 'compact' is for list rows. */
  variant?: 'full' | 'compact';
  /** Set on dark surfaces so the label stays legible. */
  onWall?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ScoreDisplay({ score, size = 44, variant = 'compact', onWall = false, style }: ScoreDisplayProps) {
  const band = bandForScore(score);
  const numeralColor = band.scoreColor === 'stamp' ? color.stamp : onWall ? color.officeLight : color.office;

  return (
    <View
      style={[{ flexDirection: variant === 'full' ? 'row' : 'column', alignItems: 'baseline', gap: 8 }, style]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Rated ${formatScore(score)} out of 5, ${band.label.toLowerCase()}`}
    >
      <Text
        style={{
          fontFamily: font.authority,
          fontSize: size,
          lineHeight: size * 1.1,
          color: numeralColor,
        }}
      >
        {formatScore(score)}
      </Text>
      {variant === 'full' ? (
        <View style={{ gap: 4 }}>
          <FormLabel size={size * 0.14} tracking={size * 0.038} tone={onWall ? 'wallText' : 'ink'}>
            OUT OF FIVE
          </FormLabel>
          <FormLabel size={size * 0.1} tracking={size * 0.023} tone={onWall ? 'wallTextDim' : 'fade'}>
            {`RIDE QUALITY: ${band.label}`}
          </FormLabel>
        </View>
      ) : (
        <FormLabel size={10} tracking={2} tone={onWall ? 'wallTextDim' : 'fade'}>
          {band.label}
        </FormLabel>
      )}
    </View>
  );
}
