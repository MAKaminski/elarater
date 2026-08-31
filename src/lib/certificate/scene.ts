/**
 * The platform-neutral scene graph.
 *
 * docs/05-certificate-spec.md: "The server path must produce a pixel-identical
 * certificate. Share the same geometry constants ... Do not maintain two copies of
 * the coordinates."
 *
 * geometry.ts is the only file that knows where anything goes. It emits Node[].
 * Everything downstream is a dumb translator:
 *
 *   Node[] -> react-native-svg   components/certificate/Certificate.tsx  (iOS/Android/web)
 *   Node[] -> SVG string         lib/certificate/to-svg-string.ts        (OG images, share)
 */

export type Paint = {
  fill?: string;
  stroke?: string;
  /** stroke-width */
  sw?: number;
  /** opacity on the node itself */
  op?: number;
  /** stroke-opacity, when it differs from `op` */
  strokeOp?: number;
  cap?: 'butt' | 'round' | 'square';
  join?: 'miter' | 'round' | 'bevel';
};

export type Node =
  | ({ t: 'rect'; x: number; y: number; w: number; h: number; rx?: number; transform?: string } & Paint)
  | ({ t: 'circle'; cx: number; cy: number; r: number } & Paint)
  | ({ t: 'path'; d: string; transform?: string } & Paint)
  | ({ t: 'polyline'; points: string } & Paint)
  | ({ t: 'polygon'; points: string } & Paint)
  | { t: 'g'; children: Node[]; transform?: string; op?: number; clipPath?: string }
  | { t: 'clip'; id: string; children: Node[] };

/** Trim trailing zeros the way the source generator's format specifiers do. */
export const n0 = (v: number) => v.toFixed(0);
export const n1 = (v: number) => v.toFixed(1);
export const n2 = (v: number) => v.toFixed(2);
export const n4 = (v: number) => v.toFixed(4);

export const group = (children: Node[], transform?: string, op?: number): Node => ({
  t: 'g',
  children,
  ...(transform ? { transform } : {}),
  ...(op !== undefined ? { op } : {}),
});

/** Flatten a nested scene into a single list — used by the pixel-diff harness. */
export function countNodes(nodes: Node[]): number {
  let total = 0;
  for (const node of nodes) {
    total += 1;
    if (node.t === 'g' || node.t === 'clip') total += countNodes(node.children);
  }
  return total;
}
