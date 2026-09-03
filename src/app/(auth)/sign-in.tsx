/**
 * Anonymous browse is allowed; an account is required to rate
 * (docs/01-product-spec.md).
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { FormLabel, PaperSurface, Rule, StampSeal, WallSurface } from '@/components/primitives';
import { APPLE_SIGN_IN_ENABLED, continueAsGuest, sendMagicLink, signInWithApple } from '@/lib/auth/signIn';
import { color, font, radius, space } from '@/theme/tokens';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'guest' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setStatus('error');
      setMessage('That does not look like an email address.');
      return;
    }
    setStatus('sending');
    try {
      await sendMagicLink(email);
      setStatus('sent');
      setMessage(null);
    } catch (e) {
      setStatus('error');
      setMessage((e as Error).message);
    }
  }

  return (
    <WallSurface>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
        <View style={{ alignItems: 'center', gap: space.md, paddingTop: space.xl }}>
          <StampSeal size={92} animate={status === 'sent' ? 'stamp' : 'none'} />
          <FormLabel size={13} tracking={5} tone="wallTextDim">
            OFFICE OF RIDE QUALITY
          </FormLabel>
        </View>

        {status === 'sent' ? (
          <PaperSurface padding="lg" style={{ gap: space.sm }}>
            <FormLabel size={11}>CHECK YOUR EMAIL</FormLabel>
            <Text style={{ fontFamily: font.typed, fontSize: 15, color: color.ink }}>
              A sign-in link is on its way to {email.trim().toLowerCase()}. It expires in
              one hour.
            </Text>
          </PaperSurface>
        ) : (
          <View style={{ gap: space.md }}>
            <View style={{ gap: space.xs }}>
              <FormLabel size={11} tone="wallTextDim">
                INSPECTOR EMAIL
              </FormLabel>
              <TextInput
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (status === 'error') setStatus('idle');
                }}
                onSubmitEditing={submit}
                autoCapitalize="none"
                autoComplete="email"
                inputMode="email"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={color.wallTextDim}
                accessibilityLabel="Email address"
                style={{
                  minHeight: 48,
                  paddingHorizontal: space.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: status === 'error' ? color.stamp : color.brass,
                  backgroundColor: color.wallLift,
                  color: color.wallText,
                  fontFamily: font.typed,
                  fontSize: 16,
                }}
              />
            </View>

            {message ? (
              <Text style={{ fontFamily: font.typed, fontSize: 13, color: color.stamp }}>
                {message}
              </Text>
            ) : null}

            <ActionButton
              label={status === 'sending' ? 'SENDING…' : 'EMAIL ME A SIGN-IN LINK'}
              onPress={submit}
              disabled={status === 'sending'}
              lantern
            />

            {/*
              Sign in with Apple is mandatory only when third-party login is offered.
              A magic link is not third-party, so this stays behind a flag until an
              Apple Services ID exists (docs/06-store-compliance.md).
            */}
            {APPLE_SIGN_IN_ENABLED ? (
              <>
                <Rule tone="brass" opacity={0.3} />
                <ActionButton
                  label="CONTINUE WITH APPLE"
                  tone="quiet"
                  onPress={() => signInWithApple().catch((e) => setMessage((e as Error).message))}
                />
              </>
            ) : null}
          </View>
        )}

        <Rule tone="brass" opacity={0.25} />

        {/*
          Guest access. Magic-link delivery needs SMTP, and an email-only sign-in
          means nobody can rate anything until that is wired. A guest gets a real
          profiles row, so the terms gate, the one-per-day limit and remark screening
          all still apply.
        */}
        <ActionButton
          label={status === 'guest' ? 'SIGNING IN…' : 'CONTINUE AS GUEST'}
          lantern
          disabled={status === 'guest'}
          onPress={async () => {
            setStatus('guest');
            setMessage(null);
            try {
              await continueAsGuest();
              router.replace('/(tabs)');
            } catch (e) {
              setStatus('error');
              setMessage((e as Error).message);
            }
          }}
        />
        <ActionButton label="BROWSE WITHOUT AN ACCOUNT" tone="quiet" onPress={() => router.replace('/(tabs)')} />
      </ScrollView>
    </WallSurface>
  );
}
