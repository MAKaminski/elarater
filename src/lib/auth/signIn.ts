/**
 * Sign-in. v1 launches with email magic link only.
 *
 * Sign in with Apple is mandatory on iOS ONLY when third-party login is offered
 * (docs/06-store-compliance.md). A magic link is not third-party, so Apple sign-in is
 * genuinely optional for v1 — it is wired here behind a flag so the absence of an
 * Apple Developer Program membership never blocks the build.
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { getSupabase } from '../supabase';

/** Flip on once an Apple Services ID and sign-in key exist. */
export const APPLE_SIGN_IN_ENABLED =
  process.env.EXPO_PUBLIC_APPLE_SIGN_IN === 'true' && Platform.OS === 'ios';

export async function sendMagicLink(email: string): Promise<void> {
  const redirectTo =
    Platform.OS === 'web'
      ? `${process.env.EXPO_PUBLIC_SITE_URL ?? 'https://elarater.vercel.app'}/`
      : Linking.createURL('/');

  const { error } = await getSupabase().auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw new Error(error.message);
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (!APPLE_SIGN_IN_ENABLED) return false;
  return AppleAuthentication.isAvailableAsync();
}

export async function signInWithApple(): Promise<void> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) throw new Error('Apple did not return an identity token.');

  const { error } = await getSupabase().auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw new Error(error.message);
}
