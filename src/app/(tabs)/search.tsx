/**
 * Search by building, address, city or manufacturer. The path in when location is
 * off or you are nowhere near a rated elevator — which, for most people most of the
 * time, is the normal case.
 */
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';
import { ElevatorRow } from '@/components/ElevatorRow';
import { FormLabel, WallSurface } from '@/components/primitives';
import { QueryState } from '@/components/QueryState';
import { searchElevators } from '@/lib/api/elevators';
import { color, font, radius, space } from '@/theme/tokens';

export default function Search() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  // An empty query lists everything by popularity, so the screen is never blank.
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['search', query.trim()],
    queryFn: () => searchElevators(query.trim()),
  });

  return (
    <WallSurface>
      <View style={{ flex: 1, padding: space.md, gap: space.md }}>
        <FormLabel size={13} tracking={5} tone="wallText">SEARCH</FormLabel>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Building, address, city, or manufacturer"
          placeholderTextColor={color.wallTextDim}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search elevators"
          style={{
            minHeight: 48,
            paddingHorizontal: space.md,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: color.brass,
            backgroundColor: color.wallLift,
            color: color.wallText,
            fontFamily: font.typed,
            fontSize: 16,
          }}
        />

        {isLoading ? (
          <QueryState state="loading" label="CONSULTING THE REGISTER" />
        ) : isError ? (
          <QueryState
            state="error"
            label="THE REGISTER IS UNAVAILABLE"
            detail={(error as Error)?.message}
            onRetry={() => refetch()}
          />
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(item) => item.elevator_id}
            ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<QueryState state="empty" label="NOTHING ON RECORD" />}
            renderItem={({ item }) => (
              <ElevatorRow
                elevator={item}
                onPress={() => router.push(`/elevator/${item.elevator_id}`)}
              />
            )}
          />
        )}
      </View>
    </WallSurface>
  );
}
