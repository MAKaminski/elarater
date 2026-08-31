import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import { color } from '@/theme/tokens';

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  const client = useRef(
    new QueryClient({
      defaultOptions: { queries: { staleTime: 30_000, retry: 2 } },
    }),
  ).current;

  // Alfa Slab and Courier are static faces. Archivo is variable — form labels never
  // use it live, they draw baked outlines instead. See src/theme/tokens.ts.
  const [loaded] = useFonts({
    AlfaSlabOne: require('../../assets/fonts/AlfaSlabOne-Regular.ttf'),
    Archivo: require('../../assets/fonts/Archivo-Variable.ttf'),
    CourierPrime: require('../../assets/fonts/CourierPrime-Regular.ttf'),
    'CourierPrime-Bold': require('../../assets/fonts/CourierPrime-Bold.ttf'),
  });

  if (!loaded) return null;

  return (
    <QueryClientProvider client={client}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.wall },
          // Cross-fade, never slide. The brand is a paper document, not an interface
          // that bounces. docs/04-design-system.md.
          animation: 'fade',
          animationDuration: 180,
        }}
      />
    </QueryClientProvider>
  );
}
