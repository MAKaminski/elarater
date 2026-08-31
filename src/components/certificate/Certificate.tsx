/**
 * The certificate. The rating result screen, the share image, the web permalink and
 * the marketing asset — one component, four uses.
 *
 * Authored at 900x662 and SCALED BY TRANSFORM. Never reflowed for a smaller screen:
 * on a narrow phone it gets smaller, exactly like a real one behind glass.
 * CLAUDE.md rule 1.
 */
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg from 'react-native-svg';
import { CH, CW, certificate, certificateLabel, type CertificateProps } from '@/lib/certificate/geometry';
import { SceneNodes } from './SceneNodes';

export type { CertificateProps };

export const CERTIFICATE_ASPECT = CW / CH;

export function Certificate({
  style,
  ...props
}: CertificateProps & { style?: StyleProp<ViewStyle> }) {
  const nodes = certificate(props);

  return (
    <View
      style={[{ width: '100%', aspectRatio: CERTIFICATE_ASPECT }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={certificateLabel(props)}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="xMidYMid meet">
        <SceneNodes nodes={nodes} />
      </Svg>
    </View>
  );
}
