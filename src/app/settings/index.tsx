import { Link, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { FormLabel, PaperSurface, Rule, TypedValue, WallSurface } from '@/components/primitives';
import { signOut } from '@/lib/auth/signIn';
import { useProfile, useSession } from '@/lib/auth/useSession';
import { color, font, space } from '@/theme/tokens';

export default function Settings() {
  const router = useRouter();
  const { user } = useSession();
  const { profile } = useProfile();

  return (
    <WallSurface>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, maxWidth: 620, width: '100%', alignSelf: 'center' }}>
        <FormLabel size={15} tracking={5.6} tone="wallText">
          SETTINGS
        </FormLabel>

        {profile ? (
          <PaperSurface padding="md" style={{ gap: space.sm }}>
            <FormLabel size={10}>INSPECTOR</FormLabel>
            <TypedValue size={17}>{profile.display_name ?? profile.handle}</TypedValue>
            <Rule opacity={0.2} />
            <FormLabel size={10}>INSPECTIONS ON RECORD</FormLabel>
            <TypedValue size={17}>{String(profile.inspection_count)}</TypedValue>
            <Rule opacity={0.2} />
            <FormLabel size={10}>HOME METRO</FormLabel>
            <TypedValue size={17}>{profile.home_metro}</TypedValue>
          </PaperSurface>
        ) : (
          <PaperSurface padding="md">
            <Text style={{ fontFamily: font.typed, fontSize: 15, color: color.ink }}>
              You are browsing anonymously. An account is required to file an inspection.
            </Text>
          </PaperSurface>
        )}

        <View style={{ gap: space.sm }}>
          <FormLabel size={10} tone="wallTextDim">LEGAL</FormLabel>
          <Link href="/privacy" asChild>
            <ActionButton label="PRIVACY POLICY" tone="quiet" />
          </Link>
          <Link href="/terms" asChild>
            <ActionButton label="TERMS OF USE" tone="quiet" />
          </Link>
        </View>

        <View style={{ gap: space.sm }}>
          <FormLabel size={10} tone="wallTextDim">SUPPORT</FormLabel>
          <PaperSurface padding="md">
            <Text style={{ fontFamily: font.typed, fontSize: 15, color: color.ink }}>
              Questions, reports, or appeals: support@elarater.app. Reports are reviewed
              within 24 hours.
            </Text>
          </PaperSurface>
        </View>

        {user ? (
          <View style={{ gap: space.sm }}>
            <FormLabel size={10} tone="wallTextDim">ACCOUNT</FormLabel>
            <ActionButton
              label="SIGN OUT"
              tone="quiet"
              onPress={() => signOut().then(() => router.replace('/(tabs)'))}
            />
            {/* Deletion must be reachable in-app, not by support email. Two taps. */}
            <Link href="/settings/account" asChild>
              <ActionButton label="DELETE ACCOUNT" tone="stamp" />
            </Link>
          </View>
        ) : (
          <Link href="/(auth)/sign-in" asChild>
            <ActionButton label="SIGN IN" lantern />
          </Link>
        )}
      </ScrollView>
    </WallSurface>
  );
}
