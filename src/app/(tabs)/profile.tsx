/**
 * Profile: your certificates and your stats ("47 elevators inspected").
 */
import { Link, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlatList, Pressable, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { FormLabel, PaperSurface, Rule, ScoreDisplay, StampSeal, TypedValue, WallSurface } from '@/components/primitives';
import { getMyRatings } from '@/lib/api/ratings';
import { useProfile, useSession } from '@/lib/auth/useSession';
import { space } from '@/theme/tokens';

export default function Profile() {
  const router = useRouter();
  const { user } = useSession();
  const { profile } = useProfile();

  const { data } = useQuery({
    queryKey: ['my-ratings', user?.id],
    queryFn: () => (user ? getMyRatings(user.id) : []),
    enabled: !!user,
  });

  if (!user) {
    return (
      <WallSurface>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg, padding: space.lg }}>
          <StampSeal size={92} opacity={0.3} />
          <FormLabel size={12} tracking={2.6} tone="wallTextDim">
            NO INSPECTOR ON FILE
          </FormLabel>
          <ActionButton label="SIGN IN" lantern onPress={() => router.push('/(auth)/sign-in')} />
        </View>
      </WallSurface>
    );
  }

  return (
    <WallSurface>
      <View style={{ flex: 1, padding: space.md, gap: space.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <FormLabel size={13} tracking={5} tone="wallText">INSPECTOR</FormLabel>
          <Link href="/settings">
            <FormLabel size={10} tone="wallTextDim">SETTINGS</FormLabel>
          </Link>
        </View>

        <PaperSurface padding="md" style={{ gap: space.xs }}>
          <TypedValue size={19}>{profile?.display_name ?? profile?.handle ?? '—'}</TypedValue>
          <Rule opacity={0.2} />
          <FormLabel size={10}>
            {`${profile?.inspection_count ?? 0} ELEVATOR${profile?.inspection_count === 1 ? '' : 'S'} INSPECTED`}
          </FormLabel>
        </PaperSurface>

        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: space.xxl, gap: space.md }}>
              <StampSeal size={80} opacity={0.3} />
              <FormLabel size={11} tone="wallTextDim">NO INSPECTIONS ON RECORD</FormLabel>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/elevator/${item.elevator_id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${item.serial ?? 'Pending'} at ${item.building_name}`}
            >
              <PaperSurface padding="md" guilloche={false} style={{ gap: space.xs }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <FormLabel size={10}>{item.serial ?? 'PENDING'}</FormLabel>
                    <TypedValue size={16}>{item.elevator_label}</TypedValue>
                  </View>
                  <ScoreDisplay score={item.score} size={32} />
                </View>
                <Rule opacity={0.2} />
                <FormLabel size={10}>{`${item.building_name} · ${item.inspected_on.slice(0, 10)}`}</FormLabel>
              </PaperSurface>
            </Pressable>
          )}
        />
      </View>
    </WallSurface>
  );
}
