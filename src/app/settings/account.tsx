/**
 * In-app account deletion. Required by both stores; a support email or a web form
 * does not satisfy it (docs/06-store-compliance.md).
 *
 * Path: Settings -> Account -> Delete account -> confirm.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { FormLabel, PaperSurface, Rule, StampSeal, WallSurface } from '@/components/primitives';
import { deleteAccount } from '@/lib/api/account';
import { color, font, radius, space } from '@/theme/tokens';

const CONFIRM = 'DELETE';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    const result = await deleteAccount();
    setBusy(false);
    if (result.ok) router.replace('/(tabs)');
    else setError(result.message);
  }

  return (
    <WallSurface>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <View style={{ alignItems: 'center', paddingTop: space.lg }}>
          <StampSeal size={80} tone="stamp" opacity={0.7} />
        </View>

        <FormLabel size={15} tracking={5.6} tone="wallText">
          DELETE ACCOUNT
        </FormLabel>

        <PaperSurface padding="lg" style={{ gap: space.md }}>
          <Text style={{ fontFamily: font.typed, fontSize: 15, lineHeight: 22, color: color.ink }}>
            Your profile is deleted immediately and permanently purged after 30 days.
          </Text>
          <Rule opacity={0.2} />
          <Text style={{ fontFamily: font.typed, fontSize: 15, lineHeight: 22, color: color.ink }}>
            Your inspections stay on record but stop being attributed to you. Each
            elevator keeps its score history; your name does not.
          </Text>
          <Rule opacity={0.2} />
          <Text style={{ fontFamily: font.typed, fontSize: 15, lineHeight: 22, color: color.ink }}>
            This cannot be undone.
          </Text>
        </PaperSurface>

        <View style={{ gap: space.xs }}>
          <FormLabel size={11} tone="wallTextDim">
            {`TYPE ${CONFIRM} TO CONFIRM`}
          </FormLabel>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="characters"
            autoCorrect={false}
            accessibilityLabel={`Type ${CONFIRM} to confirm account deletion`}
            style={{
              minHeight: 48,
              paddingHorizontal: space.md,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: color.stamp,
              backgroundColor: color.wallLift,
              color: color.wallText,
              fontFamily: font.typed,
              fontSize: 16,
            }}
          />
        </View>

        {error ? (
          <Text style={{ fontFamily: font.typed, fontSize: 13, color: color.officeLight }}>{error}</Text>
        ) : null}

        <ActionButton
          label={busy ? 'DELETING…' : 'DELETE MY ACCOUNT'}
          tone="stamp"
          disabled={busy || typed.trim().toUpperCase() !== CONFIRM}
          onPress={confirm}
        />
        <ActionButton label="KEEP MY ACCOUNT" tone="quiet" onPress={() => router.back()} />
      </ScrollView>
    </WallSurface>
  );
}
