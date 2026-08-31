/**
 * Serial parsing and formatting.
 *
 * GENERATION IS SERVER-SIDE ONLY (CLAUDE.md, "Data rules"). Nothing here mints a
 * serial — the ratings_after_insert trigger does, against metro_sequences. These
 * helpers exist so routes and the certificate can read one.
 */
export type ParsedSerial = { metro: string; sequence: number };

/** {METRO}-{6 digits}, e.g. ATL-004572. Metro is 2-4 uppercase letters. */
const SERIAL_RE = /^([A-Z]{2,4})-(\d{6})$/;

export function parseSerial(serial: string): ParsedSerial | null {
  const m = SERIAL_RE.exec(serial.trim().toUpperCase());
  return m ? { metro: m[1], sequence: Number(m[2]) } : null;
}

export const isSerial = (serial: string): boolean => SERIAL_RE.test(serial.trim().toUpperCase());

/** Mirrors the trigger's format so optimistic UI can render a placeholder shape. */
export const formatSerial = (metro: string, sequence: number): string =>
  `${metro.toUpperCase()}-${String(sequence).padStart(6, '0')}`;

/** Permalink path. docs/02-architecture.md — this is the sharing surface. */
export const certificatePath = (serial: string): string => `/c/${serial.toUpperCase()}`;
