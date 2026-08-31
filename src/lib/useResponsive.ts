/**
 * Hydration-safe responsive values.
 *
 * The web target server-renders, and useWindowDimensions() reports a default width on
 * the server and the real one in the browser. Branching on it during the first client
 * render therefore produces markup that does not match the server's, which React
 * reports as a hydration error and recovers from by throwing the server HTML away.
 *
 * This returns the server's assumption until after mount, so the first client render
 * always agrees with the server, then reflows once.
 */
import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';

/** What the server assumes. Phone-first, matching the design system's default. */
const SSR_WIDTH = 390;

export function useResponsive(breakpoint = 900) {
  const { width: liveWidth } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const width = mounted ? liveWidth : SSR_WIDTH;
  return { width, isWide: width >= breakpoint, mounted };
}
