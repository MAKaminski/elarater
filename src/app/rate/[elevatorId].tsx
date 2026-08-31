/**
 * The rate flow. Four taps, not a form (docs/01-product-spec.md).
 *
 * The score pickers are the primary interaction and are deliberately large — well
 * past the 44x44 minimum. Remarks are where the personality lives and the main reason
 * anyone shares the result, so they get the most room on the screen.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useResponsive } from '@/lib/useResponsive';
import { ActionButton } from '@/components/ActionButton';
import { FormLabel, PaperSurface, Rule, ScoreDisplay, WallSurface } from '@/components/primitives';
import { createRating } from '@/lib/api/ratings';
import { useProfile, useSession } from '@/lib/auth/useSession';
import { computeScore } from '@/lib/certificate/bands';
import { enqueue } from '@/lib/offline/queue';
import { createRatingSchema } from '@/lib/schemas/rating';
import { color, fieldLimits, font, radius, space } from '@/theme/tokens';

/** The four sub-scores, with the question the user actually sees. */
const CRITERIA = [
  { key: 'smooth', label: 'SMOOTH', question: "How's the ride?" },
  { key: 'speedy', label: 'SPEEDY', question: 'How long did you wait?' },
  { key: 'spotless', label: 'SPOTLESS', question: 'What shape is the car in?' },
  { key: 'character', label: 'CHARACTER', question: 'Anything weird about it?' },
] as const;

type Key = (typeof CRITERIA)[number]['key'];
type Scores = Record<Key, number | null>;

export default function RateFlow() {
  const { elevatorId } = useLocalSearchParams<{ elevatorId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { canPost } = useProfile();
  const { width } = useResponsive();

  const [scores, setScores] = useState<Scores>({
    smooth: null,
    speedy: null,
    spotless: null,
    character: null,
  });
  const [remark1, setRemark1] = useState('');
  const [remark2, setRemark2] = useState('');
  const [error, setError] = useState<string | null>(null);

  const complete = CRITERIA.every((c) => scores[c.key] !== null);
  const preview = complete
    ? computeScore({
        smooth: scores.smooth!,
        speedy: scores.speedy!,
        spotless: scores.spotless!,
        character: scores.character!,
      })
    : null;

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Sign in to file an inspection.');
      const input = createRatingSchema.parse({
        elevatorId,
        smooth: scores.smooth,
        speedy: scores.speedy,
        spotless: scores.spotless,
        character: scores.character,
        remark1: remark1.trim() || undefined,
        remark2: remark2.trim() || undefined,
      });

      try {
        return await createRating(input, user.id);
      } catch (e) {
        // Elevators are exactly where signal disappears. Queue it and move on.
        const message = (e as Error).message;
        if (/fetch|network|timeout/i.test(message)) {
          await enqueue(input, `${elevatorId}-${Date.now()}`);
          return null;
        }
        throw e;
      }
    },
    onSuccess: async (ratingId) => {
      await queryClient.invalidateQueries({ queryKey: ['elevator', elevatorId] });
      await queryClient.invalidateQueries({ queryKey: ['my-ratings'] });
      router.replace(ratingId ? `/elevator/${elevatorId}?issued=${ratingId}` : `/elevator/${elevatorId}?queued=1`);
    },
    onError: (e) => setError((e as Error).message),
  });

  if (!user || !canPost) {
    return (
      <WallSurface>
        <View style={{ flex: 1, justifyContent: 'center', padding: space.lg, gap: space.md }}>
          <FormLabel size={12} tracking={2.6} tone="wallText">
            {user ? 'ACCEPT THE TERMS TO BEGIN' : 'AN ACCOUNT IS REQUIRED TO INSPECT'}
          </FormLabel>
          <ActionButton
            label={user ? 'REVIEW THE RULES' : 'SIGN IN'}
            lantern
            onPress={() => router.push(user ? '/(auth)/terms-gate' : '/(auth)/sign-in')}
          />
          <ActionButton label="BACK" tone="quiet" onPress={() => router.back()} />
        </View>
      </WallSurface>
    );
  }

  const swatch = Math.min(64, Math.max(48, (width - space.lg * 2 - space.sm * 4) / 5));

  return (
    <WallSurface>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <FormLabel size={15} tracking={5.6} tone="wallText">
          FILE AN INSPECTION
        </FormLabel>

        {CRITERIA.map((c) => (
          <View key={c.key} style={{ gap: space.sm }}>
            <FormLabel size={11} tone="wallTextDim">{c.label}</FormLabel>
            <Text style={{ fontFamily: font.typed, fontSize: 15, color: color.wallText }}>
              {c.question}
            </Text>
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const selected = scores[c.key] === n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => setScores((s) => ({ ...s, [c.key]: n }))}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${c.label} ${n} of 5`}
                    style={{
                      width: swatch,
                      height: swatch,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: selected ? color.officeLight : color.brass,
                      backgroundColor: selected ? color.office : color.wallLift,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: font.authority,
                        fontSize: swatch * 0.42,
                        color: selected ? color.stock : color.wallTextDim,
                      }}
                    >
                      {n}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <Rule tone="brass" opacity={0.35} />

        <View style={{ gap: space.sm }}>
          <FormLabel size={11} tone="wallTextDim">INSPECTOR'S REMARKS</FormLabel>
          {[
            { value: remark1, set: setRemark1, placeholder: 'Rides like butter. Doors close like they are' },
            { value: remark2, set: setRemark2, placeholder: 'mad at you. Plays smooth jazz, inexplicably.' },
          ].map((line, i) => (
            <View key={i} style={{ gap: 2 }}>
              <TextInput
                value={line.value}
                onChangeText={(v) => line.set(v.slice(0, fieldLimits.remark1))}
                placeholder={line.placeholder}
                placeholderTextColor={color.wallTextDim}
                maxLength={fieldLimits.remark1}
                accessibilityLabel={`Remark line ${i + 1}`}
                style={{
                  minHeight: 46,
                  paddingHorizontal: space.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: color.brass,
                  backgroundColor: color.wallLift,
                  color: color.wallText,
                  fontFamily: font.typed,
                  fontSize: 15,
                }}
              />
              {/*
                48 characters is a hard limit, not a suggestion: a 49th overruns the
                certificate field, and the certificate never reflows.
              */}
              <Text
                style={{
                  fontFamily: font.typed,
                  fontSize: 11,
                  textAlign: 'right',
                  color: line.value.length >= fieldLimits.remark1 ? color.stamp : color.wallTextDim,
                }}
              >
                {`${line.value.length} / ${fieldLimits.remark1}`}
              </Text>
            </View>
          ))}
        </View>

        {preview !== null ? (
          <PaperSurface padding="md" style={{ alignItems: 'center' }}>
            <ScoreDisplay score={preview} size={64} variant="full" />
          </PaperSurface>
        ) : null}

        {error ? (
          <Text style={{ fontFamily: font.typed, fontSize: 13, color: color.officeLight }}>{error}</Text>
        ) : null}

        <ActionButton
          label={submit.isPending ? 'ISSUING CERTIFICATE…' : 'ISSUE CERTIFICATE'}
          lantern
          disabled={!complete || submit.isPending}
          onPress={() => {
            setError(null);
            submit.mutate();
          }}
        />
      </ScrollView>
    </WallSurface>
  );
}
