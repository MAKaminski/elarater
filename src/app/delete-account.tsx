/**
 * The publicly reachable web deletion URL. Google Play requires one in addition to
 * the in-app path (docs/06-store-compliance.md).
 */
import Head from 'expo-router/head';
import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { FormLabel, PaperSurface, Rule, WallSurface } from '@/components/primitives';
import { color, font, space } from '@/theme/tokens';

export default function DeleteAccountPublic() {
  return (
    <>
      <Head>
        <title>Delete your ElaRater account</title>
        <meta name="description" content="How to delete your ElaRater account and what happens to your data." />
      </Head>
      <WallSurface>
        <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
          <FormLabel size={15} tracking={5.6} tone="wallText">
            DELETE YOUR ACCOUNT
          </FormLabel>

          <PaperSurface padding="lg" style={{ gap: space.md }}>
            <FormLabel size={10}>IN THE APP</FormLabel>
            <Text style={{ fontFamily: font.typed, fontSize: 15, lineHeight: 23, color: color.ink }}>
              Settings, then Account, then Delete account. It takes effect immediately.
            </Text>
            <Rule opacity={0.2} />
            <FormLabel size={10}>HERE</FormLabel>
            <Text style={{ fontFamily: font.typed, fontSize: 15, lineHeight: 23, color: color.ink }}>
              Sign in below and use the same option. If you cannot sign in, email
              support@elarater.app from the address on the account and we will delete it
              within 30 days.
            </Text>
            <Rule opacity={0.2} />
            <FormLabel size={10}>WHAT IS REMOVED</FormLabel>
            <Text style={{ fontFamily: font.typed, fontSize: 15, lineHeight: 23, color: color.ink }}>
              Your profile, email, display name, and photo uploads are deleted, and
              purged completely after 30 days. Your inspections stay on record but stop
              being attributed to you, so each elevator keeps its score history while your
              authorship does not.
            </Text>
          </PaperSurface>

          <View style={{ gap: space.sm }}>
            <Link href="/settings/account" asChild>
              <ActionButton label="SIGN IN AND DELETE" tone="stamp" />
            </Link>
            <Link href="/" asChild>
              <ActionButton label="BACK TO ELARATER" tone="quiet" />
            </Link>
          </View>
        </ScrollView>
      </WallSurface>
    </>
  );
}
