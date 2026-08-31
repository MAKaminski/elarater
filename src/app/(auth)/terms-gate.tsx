/**
 * The terms acceptance gate, shown before a user's first post.
 *
 * Apple has rejected apps for missing this alone, and it must carry an explicit
 * "no objectionable content" agreement (docs/06-store-compliance.md). The RLS insert
 * policy on ratings enforces the same thing, so this is not a decorative checkbox.
 */
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { FormLabel, PaperSurface, Rule, WallSurface } from '@/components/primitives';
import { acceptTerms } from '@/lib/api/profiles';
import { useProfile, useSession } from '@/lib/auth/useSession';
import { color, font, space } from '@/theme/tokens';

const RULES = [
  'Inspect elevators you have actually ridden. Invented findings are removed.',
  'No objectionable content: nothing harassing, hateful, sexually explicit, or abusive in remarks or photos.',
  'No personal information about anyone, including building staff.',
  'Reports are reviewed within 24 hours and accounts that break these rules are suspended.',
];

export default function TermsGate() {
  const router = useRouter();
  const { user } = useSession();
  const { refetch } = useProfile();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    if (!user) return router.replace('/(auth)/sign-in');
    setBusy(true);
    try {
      await acceptTerms(user.id);
      await refetch();
      router.back();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <WallSurface>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, maxWidth: 620, width: '100%', alignSelf: 'center' }}>
        <FormLabel size={15} tracking={5.6} tone="wallText">
          BEFORE YOUR FIRST INSPECTION
        </FormLabel>

        <PaperSurface padding="lg" style={{ gap: space.md }}>
          {RULES.map((rule, i) => (
            <View key={i} style={{ gap: space.xs }}>
              <Text style={{ fontFamily: font.typed, fontSize: 15, lineHeight: 22, color: color.ink }}>
                {rule}
              </Text>
              {i < RULES.length - 1 ? <Rule opacity={0.2} /> : null}
            </View>
          ))}
        </PaperSurface>

        {error ? (
          <Text style={{ fontFamily: font.typed, fontSize: 13, color: color.officeLight }}>{error}</Text>
        ) : null}

        <ActionButton
          label={busy ? 'RECORDING…' : 'I AGREE — BEGIN INSPECTING'}
          onPress={accept}
          disabled={busy}
          lantern
        />

        <View style={{ flexDirection: 'row', gap: space.lg, flexWrap: 'wrap' }}>
          <Link href="/terms">
            <FormLabel size={10} tone="wallTextDim">FULL TERMS</FormLabel>
          </Link>
          <Link href="/privacy">
            <FormLabel size={10} tone="wallTextDim">PRIVACY POLICY</FormLabel>
          </Link>
        </View>
      </ScrollView>
    </WallSurface>
  );
}
