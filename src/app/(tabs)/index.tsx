import { View } from 'react-native';
import { FormLabel, StampSeal, WallSurface } from '@/components/primitives';
import { space } from '@/theme/tokens';

export default function Nearby() {
  return (
    <WallSurface>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg }}>
        {/* Empty state: seal at 30% + a form label. Never a spinner. */}
        <StampSeal size={92} opacity={0.3} />
        <FormLabel size={12} tracking={2.6} tone="wallTextDim">
          NO INSPECTIONS ON RECORD
        </FormLabel>
      </View>
    </WallSurface>
  );
}
