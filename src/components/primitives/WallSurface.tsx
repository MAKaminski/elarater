/**
 * Wall + brushed vertical lines. Every dark screen background — the elevator car
 * interior the certificate hangs in.
 */
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { color } from '@/theme/tokens';

export type WallSurfaceProps = {
  children?: React.ReactNode;
  /** wallLift for raised surfaces: cards, sheets, the tab bar. */
  lifted?: boolean;
  brushed?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function WallSurface({ children, lifted = false, brushed = true, style }: WallSurfaceProps) {
  return (
    <View style={[{ flex: 1, backgroundColor: lifted ? color.wallLift : color.wall }, style]}>
      {brushed ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.brushRow}>
            {Array.from({ length: 60 }, (_, i) => (
              <View
                key={i}
                style={{
                  width: 1,
                  marginRight: 12,
                  height: '100%',
                  backgroundColor: '#FFFFFF',
                  opacity: i % 3 ? 0.02 : 0.038,
                }}
              />
            ))}
          </View>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  brushRow: { flexDirection: 'row', height: '100%', overflow: 'hidden' },
});
