/**
 * Node[] -> SVG string.
 *
 * The server render path: OG images for /c/[serial], and the web share export (
 * react-native-view-shot is native-only). Because every glyph is already an outline,
 * the output contains zero <text> elements and the rasteriser needs no fonts at all.
 */
import { color } from '@/theme/tokens';
import type { Node } from './scene';
import { CH, CW, certificate, type CertificateProps } from './geometry';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function paint(node: Record<string, unknown>): string {
  const parts: string[] = [];
  const push = (k: string, v: unknown) => {
    if (v !== undefined && v !== null) parts.push(`${k}="${typeof v === 'string' ? esc(v) : v}"`);
  };
  push('fill', node.fill);
  push('stroke', node.stroke);
  push('stroke-width', node.sw);
  push('opacity', node.op);
  push('stroke-opacity', node.strokeOp);
  push('stroke-linecap', node.cap);
  push('stroke-linejoin', node.join);
  push('transform', node.transform);
  push('clip-path', node.clipPath ? `url(#${node.clipPath})` : undefined);
  return parts.length ? ' ' + parts.join(' ') : '';
}

export function nodeToSvg(node: Node): string {
  switch (node.t) {
    case 'rect': {
      const rx = node.rx !== undefined ? ` rx="${node.rx}"` : '';
      return `<rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}"${rx}${paint(node)}/>`;
    }
    case 'circle':
      return `<circle cx="${node.cx}" cy="${node.cy}" r="${node.r}"${paint(node)}/>`;
    case 'path':
      return `<path d="${node.d}"${paint(node)}/>`;
    case 'polyline':
      return `<polyline points="${node.points}"${paint(node)}/>`;
    case 'polygon':
      return `<polygon points="${node.points}"${paint(node)}/>`;
    case 'g':
      return `<g${paint(node)}>${node.children.map(nodeToSvg).join('')}</g>`;
    case 'clip':
      return `<defs><clipPath id="${node.id}">${node.children.map(nodeToSvg).join('')}</clipPath></defs>`;
  }
}

export const nodesToSvg = (nodes: Node[]): string => nodes.map(nodeToSvg).join('');

/** The bare certificate at its authored size. */
export function certificateSvg(p: CertificateProps): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CW} ${CH}" ` +
    `width="${CW}" height="${CH}" preserveAspectRatio="xMidYMid meet">` +
    nodesToSvg(certificate(p)) +
    `</svg>`
  );
}

// ------------------------------------------------------------------ framed export

/** Brushed elevator-car wall the certificate hangs on. */
export function wallNodes(w: number, h: number): Node[] {
  const out: Node[] = [{ t: 'rect', x: 0, y: 0, w, h, fill: color.wall }];
  for (let i = 0; i <= Math.floor(w / 13); i++) {
    out.push({
      t: 'rect',
      x: i * 13,
      y: 0,
      w: 1,
      h,
      fill: '#FFFFFF',
      op: i % 3 ? 0.02 : 0.038,
    });
  }
  return out;
}

/** Brass frame with four screws — how a real certificate is actually mounted. */
export function frameNodes(x: number, y: number, w: number, h: number, pad = 17): Node[] {
  const out: Node[] = [
    { t: 'rect', x: x - pad, y: y - pad, w: w + pad * 2, h: h + pad * 2, rx: 3, fill: color.brass },
    {
      t: 'rect',
      x: x - pad,
      y: y - pad,
      w: w + pad * 2,
      h: h + pad * 2,
      rx: 3,
      fill: 'none',
      stroke: '#000000',
      sw: 1,
      op: 0.25,
    },
  ];
  for (const [sx, sy] of [
    [x - pad / 2, y - pad / 2],
    [x + w + pad / 2, y - pad / 2],
    [x - pad / 2, y + h + pad / 2],
    [x + w + pad / 2, y + h + pad / 2],
  ] as const) {
    out.push({ t: 'circle', cx: Math.round(sx), cy: Math.round(sy), r: Number((pad * 0.34).toFixed(1)), fill: '#8E6D2A' });
    out.push({
      t: 'rect',
      x: Number((sx - pad * 0.24).toFixed(1)),
      y: Number((sy - 1).toFixed(1)),
      w: Number((pad * 0.48).toFixed(1)),
      h: 2,
      fill: '#5E4718',
    });
  }
  return out;
}

/**
 * The share/OG render: framed and screwed to a wall, never floating on white.
 * CLAUDE.md rule 6 — the frame is what makes it read as a posted document.
 */
export function framedCertificateSvg(
  p: CertificateProps,
  out: { width: number; height: number },
): string {
  const pad = 17;
  // Fit the framed certificate inside the output box with a comfortable margin.
  const margin = Math.round(Math.min(out.width, out.height) * 0.08);
  const scale = Math.min(
    (out.width - margin * 2) / (CW + pad * 2),
    (out.height - margin * 2) / (CH + pad * 2),
  );
  const cw = CW * scale;
  const ch = CH * scale;
  const cx = (out.width - cw) / 2;
  const cy = (out.height - ch) / 2;

  const body =
    nodesToSvg(wallNodes(out.width, out.height)) +
    nodesToSvg(frameNodes(cx, cy, cw, ch, pad * scale)) +
    `<g transform="translate(${cx.toFixed(2)},${cy.toFixed(2)}) scale(${scale.toFixed(6)})">` +
    nodesToSvg(certificate(p)) +
    `</g>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${out.width} ${out.height}" ` +
    `width="${out.width}" height="${out.height}">${body}</svg>`
  );
}
