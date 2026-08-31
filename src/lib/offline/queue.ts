/**
 * Offline rating queue.
 *
 * Ratings created without a connection are held here and flushed on reconnect. This
 * is not a nicety — an offline queue is one of the four defences against an Apple 4.2
 * "just a form" rejection (docs/06-store-compliance.md), and elevators are exactly
 * where signal disappears.
 *
 * The optimistic certificate uses the same bands.ts the trigger mirrors, so the score
 * shown offline matches what lands. The SERIAL cannot be predicted — it is allocated
 * server-side — so a queued certificate renders with a PENDING serial until flush.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createRating } from '../api/ratings';
import type { CreateRatingInput } from '../schemas/rating';

const KEY = 'elarater.pending-ratings.v1';

export type QueuedRating = CreateRatingInput & {
  /** Local id, so the UI can track an entry before it has a server id. */
  localId: string;
  queuedAt: string;
  attempts: number;
  lastError?: string;
};

async function read(): Promise<QueuedRating[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueuedRating[]) : [];
  } catch {
    return [];
  }
}

async function write(items: QueuedRating[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function enqueue(input: CreateRatingInput, localId: string): Promise<QueuedRating> {
  const entry: QueuedRating = {
    ...input,
    localId,
    queuedAt: new Date().toISOString(),
    attempts: 0,
  };
  const items = await read();
  await write([...items, entry]);
  return entry;
}

export const pending = read;

export async function remove(localId: string): Promise<void> {
  await write((await read()).filter((i) => i.localId !== localId));
}

export type FlushResult = { flushed: string[]; failed: QueuedRating[] };

/**
 * Attempt every queued rating once. Entries that fail for a reason that will never
 * succeed — a duplicate for the day, a rejected remark — are dropped rather than
 * retried forever; anything else stays queued.
 */
export async function flush(userId: string): Promise<FlushResult> {
  const items = await read();
  if (items.length === 0) return { flushed: [], failed: [] };

  const flushed: string[] = [];
  const failed: QueuedRating[] = [];

  for (const item of items) {
    try {
      await createRating(item, userId);
      flushed.push(item.localId);
    } catch (e) {
      const message = (e as Error).message;
      const permanent =
        message.includes('already inspected this elevator today') ||
        message.includes('violates check constraint') ||
        item.attempts >= 5;
      if (permanent) {
        flushed.push(item.localId); // give up on it, but stop carrying it around
      } else {
        failed.push({ ...item, attempts: item.attempts + 1, lastError: message });
      }
    }
  }

  await write(failed);
  return { flushed, failed };
}
