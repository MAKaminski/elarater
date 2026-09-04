/**
 * QR modules as scene-graph rectangles.
 *
 * A real elevator carries its inspection certificate behind glass. Ours should too —
 * and when it does, someone standing in the car should be able to scan it and land on
 * the live finding. That makes the QR part of the artifact, not part of the app: it
 * has to survive being printed, screenshotted, and unfurled in a link preview.
 *
 * Which is why it is emitted as Node[] rather than an <Image>. A QR is a grid of
 * squares, and the scene graph already draws squares, so all four render paths get it
 * at once: react-native-svg on iOS/Android/web, and the SVG string the Vercel OG
 * function rasterises. No new rendering machinery, no font, no image asset.
 *
 * qrcode-generator is dependency-free and runs unchanged in Hermes, the browser, and
 * Node, which is the whole reason it was chosen over the alternatives.
 */
import qrcode from 'qrcode-generator';
import type { Node } from './scene';
import { n2 } from './scene';

/**
 * Error correction level. 'M' (~15% recoverable) is the right trade here: the code is
 * printed small on textured stock and photographed at an angle, but padding it out to
 * 'Q' or 'H' would grow the module count and shrink each module below what a phone
 * camera resolves at this size.
 */
const ERROR_CORRECTION = 'M' as const;

export type QrOptions = {
  /** Top-left corner in the 900x662 certificate space. */
  x: number;
  y: number;
  /** Width and height of the finished code, including its quiet zone. */
  size: number;
  /** Module colour. Ink, not stamp — this is printed chrome, not a seal. */
  fill: string;
  /**
   * Quiet-zone fill. Defaults to the caller's paper colour rather than white: the
   * guilloche underneath has to be masked or a scanner reads the texture as data, but
   * a white patch on manila stock breaks the illusion the whole design rests on.
   * Ink on stock is 12.6:1, far past anything a decoder needs.
   */
  backdrop: string;
  /**
   * The quiet zone, in modules. The spec says four; anything less and scanners on
   * a busy background start failing.
   */
  quietZone?: number;
};

/**
 * Encode `text` as a grid of rects.
 *
 * Modules are drawn one rect each rather than merged into a path: it keeps the output
 * readable, diffable, and identical across renderers, and a typical certificate QR is
 * only a few hundred rects.
 */
export function qrNodes(text: string, o: QrOptions): Node[] {
  const { x, y, size, fill, backdrop, quietZone = 4 } = o;

  // typeNumber 0 lets the encoder pick the smallest version that fits the payload,
  // so a short serial stays coarse and easy to scan.
  const qr = qrcode(0, ERROR_CORRECTION);
  qr.addData(text);
  qr.make();

  const count = qr.getModuleCount();
  const total = count + quietZone * 2;
  const module = size / total;
  const originX = x + quietZone * module;
  const originY = y + quietZone * module;

  const nodes: Node[] = [];

  // The quiet zone has to be opaque, not merely empty: the certificate sits on a
  // guilloche pattern, and a scanner reading that texture as data will fail.
  nodes.push({ t: 'rect', x, y, w: size, h: size, fill: backdrop });

  for (let row = 0; row < count; row++) {
    // Merge horizontal runs into one rect. It roughly halves the node count and
    // removes the hairline seams some rasterisers leave between abutting squares.
    let runStart = -1;
    for (let col = 0; col <= count; col++) {
      const dark = col < count && qr.isDark(row, col);
      if (dark && runStart === -1) runStart = col;
      if (!dark && runStart !== -1) {
        nodes.push({
          t: 'rect',
          x: Number(n2(originX + runStart * module)),
          y: Number(n2(originY + row * module)),
          w: Number(n2((col - runStart) * module)),
          h: Number(n2(module)),
          fill,
        });
        runStart = -1;
      }
    }
  }

  return nodes;
}

/** Module count for a payload, so tests can assert the code stays coarse enough. */
export function qrModuleCount(text: string): number {
  const qr = qrcode(0, ERROR_CORRECTION);
  qr.addData(text);
  qr.make();
  return qr.getModuleCount();
}
