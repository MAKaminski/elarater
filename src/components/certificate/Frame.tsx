/**
 * Brass frame + four screws on a brushed wall.
 *
 * In every share export and social render the certificate appears framed and screwed
 * to a wall. Never floating on white — the frame is what makes it read as a real
 * posted document rather than a graphic. CLAUDE.md rule 6.
 */
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg from 'react-native-svg';
import { CH, CW } from '@/lib/certificate/geometry';
import { frameNodes, wallNodes } from '@/lib/certificate/to-svg-string';
import { certificate, certificateLabel, type CertificateProps } from '@/lib/certificate/geometry';
import { SceneNodes } from './SceneNodes';

const PAD = 17;

/** Square share export, authored at 1080x1080 and scaled to fit its container. */
export function FramedCertificate({
  size = 1080,
  style,
  ...props
}: CertificateProps & { size?: number; style?: StyleProp<ViewStyle> }) {
  const margin = Math.round(size * 0.08);
  const scale = Math.min((size - margin * 2) / (CW + PAD * 2), (size - margin * 2) / (CH + PAD * 2));
  const cw = CW * scale;
  const ch = CH * scale;
  const cx = (size - cw) / 2;
  const cy = (size - ch) / 2;

  return (
    <View
      style={[{ width: '100%', aspectRatio: 1 }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={certificateLabel(props)}
      collapsable={false}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
        <SceneNodes nodes={wallNodes(size, size)} />
        <SceneNodes nodes={frameNodes(cx, cy, cw, ch, PAD * scale)} />
        <SceneNodes nodes={[{ t: 'g', transform: `translate(${cx},${cy}) scale(${scale})`, children: certificate(props) }]} />
      </Svg>
    </View>
  );
}
