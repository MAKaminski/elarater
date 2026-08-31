/**
 * Node[] -> react-native-svg. The other half of the pair whose first half is
 * lib/certificate/to-svg-string.ts. Both are dumb translators; neither knows any
 * coordinates. All geometry lives in lib/certificate/geometry.ts.
 */
import { Fragment } from 'react';
import { Circle, ClipPath, Defs, G, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import type { Node } from '@/lib/certificate/scene';

const paint = (n: Record<string, unknown>) => ({
  fill: n.fill as string | undefined,
  stroke: n.stroke as string | undefined,
  strokeWidth: n.sw as number | undefined,
  opacity: n.op as number | undefined,
  strokeOpacity: n.strokeOp as number | undefined,
  strokeLinecap: n.cap as 'butt' | 'round' | 'square' | undefined,
  strokeLinejoin: n.join as 'miter' | 'round' | 'bevel' | undefined,
});

export function SceneNode({ node }: { node: Node }) {
  switch (node.t) {
    case 'rect':
      return (
        <Rect
          x={node.x}
          y={node.y}
          width={node.w}
          height={node.h}
          rx={node.rx}
          transform={node.transform}
          {...paint(node)}
        />
      );
    case 'circle':
      return <Circle cx={node.cx} cy={node.cy} r={node.r} {...paint(node)} />;
    case 'path':
      return <Path d={node.d} transform={node.transform} {...paint(node)} />;
    case 'polyline':
      return <Polyline points={node.points} {...paint(node)} />;
    case 'polygon':
      return <Polygon points={node.points} {...paint(node)} />;
    case 'g':
      return (
        <G transform={node.transform} opacity={node.op} clipPath={node.clipPath ? `url(#${node.clipPath})` : undefined}>
          <SceneNodes nodes={node.children} />
        </G>
      );
    case 'clip':
      return (
        <Defs>
          <ClipPath id={node.id}>
            <SceneNodes nodes={node.children} />
          </ClipPath>
        </Defs>
      );
  }
}

export function SceneNodes({ nodes }: { nodes: Node[] }) {
  return (
    <Fragment>
      {nodes.map((node, i) => (
        <SceneNode key={i} node={node} />
      ))}
    </Fragment>
  );
}
