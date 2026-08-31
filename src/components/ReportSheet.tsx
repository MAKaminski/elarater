/**
 * Report and block, reachable in two taps from the content it is about
 * (docs/06-store-compliance.md). Composed from existing primitives.
 */
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { FormLabel, PaperSurface, Rule, WallSurface } from './primitives';
import { REPORT_REASONS } from '@/lib/schemas/moderation';
import { blockUser, reportContent } from '@/lib/api/moderation';
import { useSession } from '@/lib/auth/useSession';
import { color, font, radius, space } from '@/theme/tokens';

export type ReportSheetProps = {
  visible: boolean;
  onClose: () => void;
  targetType: 'rating' | 'photo' | 'profile';
  targetId: string;
  /** Null for an anonymised author — report stays available, block does not. */
  authorId?: string | null;
  authorName?: string | null;
};

type Reason = (typeof REPORT_REASONS)[number]['value'];

export function ReportSheet({
  visible,
  onClose,
  targetType,
  targetId,
  authorId,
  authorName,
}: ReportSheetProps) {
  const { user } = useSession();
  const [reason, setReason] = useState<Reason | null>(null);
  const [done, setDone] = useState<'reported' | 'blocked' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setReason(null);
    setDone(null);
    setError(null);
    onClose();
  }

  async function submitReport() {
    if (!user) return setError('Sign in to report content.');
    if (!reason) return;
    setBusy(true);
    try {
      await reportContent({ targetType, targetId, reason }, user.id);
      setDone('reported');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitBlock() {
    if (!user) return setError('Sign in to block an inspector.');
    if (!authorId) return;
    setBusy(true);
    try {
      await blockUser(authorId, user.id);
      setDone('blocked');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={reset}>
      <WallSurface brushed={false} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={reset} accessibilityLabel="Dismiss" />
        <View
          style={{
            backgroundColor: color.wallLift,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            borderTopWidth: 1,
            borderColor: color.brass,
            padding: space.lg,
            gap: space.md,
            maxHeight: '80%',
          }}
        >
          {done ? (
            <>
              <FormLabel size={12} tracking={2.6} tone="wallText">
                {done === 'reported' ? 'REPORT FILED' : 'INSPECTOR BLOCKED'}
              </FormLabel>
              <PaperSurface padding="md">
                <Text style={{ fontFamily: font.typed, fontSize: 15, lineHeight: 22, color: color.ink }}>
                  {done === 'reported'
                    ? 'Thank you. Reports are reviewed within 24 hours.'
                    : `You will no longer see anything from ${authorName ?? 'this inspector'}, and they will no longer see you.`}
                </Text>
              </PaperSurface>
              <ActionButton label="DONE" onPress={reset} />
            </>
          ) : (
            <ScrollView contentContainerStyle={{ gap: space.md }}>
              <FormLabel size={12} tracking={2.6} tone="wallText">
                REPORT THIS INSPECTION
              </FormLabel>

              <View style={{ gap: space.xs }}>
                {REPORT_REASONS.map((r) => {
                  const selected = reason === r.value;
                  return (
                    <Pressable
                      key={r.value}
                      onPress={() => setReason(r.value)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      style={{
                        minHeight: 44,
                        justifyContent: 'center',
                        paddingHorizontal: space.md,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: selected ? color.officeLight : color.brass,
                        backgroundColor: selected ? color.office : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: font.typed,
                          fontSize: 15,
                          color: selected ? color.stock : color.wallTextDim,
                        }}
                      >
                        {r.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {error ? (
                <Text style={{ fontFamily: font.typed, fontSize: 13, color: color.officeLight }}>
                  {error}
                </Text>
              ) : null}

              <ActionButton
                label={busy ? 'FILING…' : 'FILE REPORT'}
                onPress={submitReport}
                disabled={!reason || busy}
              />

              {authorId ? (
                <>
                  <Rule tone="brass" opacity={0.3} />
                  <ActionButton
                    label={`BLOCK ${(authorName ?? 'THIS INSPECTOR').toUpperCase()}`}
                    tone="stamp"
                    onPress={submitBlock}
                    disabled={busy}
                  />
                </>
              ) : null}

              <ActionButton label="CANCEL" tone="quiet" onPress={reset} />
            </ScrollView>
          )}
        </View>
      </WallSurface>
    </Modal>
  );
}
