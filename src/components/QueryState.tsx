/**
 * Loading / empty / error, using the seal three ways as docs/04-design-system.md
 * prescribes: turning slowly for loading, at 30% for empty, in stamp for error.
 *
 * This exists because a failed query rendering as an empty list is how a real bug
 * stayed invisible: a Zod parse failure on the search results looked exactly like
 * "nothing found". An error now says so, and says what went wrong.
 */
import { Text, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { FormLabel, StampSeal } from './primitives';
import { color, font, space } from '@/theme/tokens';

export type QueryStateProps = {
  state: 'loading' | 'empty' | 'error';
  /** Tracked caps, e.g. NO INSPECTIONS ON RECORD. */
  label: string;
  /** Shown under the label for errors, in Courier. */
  detail?: string | null;
  onRetry?: () => void;
};

export function QueryState({ state, label, detail, onRetry }: QueryStateProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.xxl, gap: space.md }}>
      <StampSeal
        size={80}
        opacity={state === 'empty' ? 0.3 : state === 'loading' ? 0.5 : 0.7}
        tone={state === 'error' ? 'stamp' : 'stamp'}
        animate={state === 'loading' ? 'spin' : 'none'}
      />
      <FormLabel size={11} tone="wallTextDim">{label}</FormLabel>
      {detail ? (
        <Text
          style={{
            fontFamily: font.typed,
            fontSize: 13,
            color: color.wallTextDim,
            textAlign: 'center',
            maxWidth: 360,
          }}
        >
          {detail}
        </Text>
      ) : null}
      {onRetry ? <ActionButton label="TRY AGAIN" tone="quiet" onPress={onRetry} /> : null}
    </View>
  );
}
