/**
 * The rounded triangle. Seal centre, buttons, list bullets, tab bar icons.
 * Geometry comes from lib/certificate so the app icon and the seal never diverge.
 */
import Svg, { Polygon } from 'react-native-svg';
import { color, type ColorToken } from '@/theme/tokens';
import { lantern } from '@/lib/certificate/geometry';

export type LanternProps = {
  size?: number;
  tone?: ColorToken;
  opacity?: number;
};

export function Lantern({ size = 24, tone = 'office', opacity = 1 }: LanternProps) {
  // Draw in a box with room for the rounded stroke, which extends past the points.
  const pad = size * 0.2;
  const box = size + pad * 2;
  const node = lantern(box / 2, box / 2, size, color[tone], opacity);
  if (node.t !== 'polygon') return null;

  return (
    <Svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} accessibilityElementsHidden>
      <Polygon
        points={node.points}
        fill={node.fill}
        opacity={node.op}
        stroke={node.stroke}
        strokeOpacity={node.strokeOp}
        strokeWidth={node.sw}
        strokeLinejoin={node.join}
      />
    </Svg>
  );
}
