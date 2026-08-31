/**
 * Share export. Two paths, because react-native-view-shot is native-only:
 *
 *   native  view-shot on the framed component -> 1080x1080 PNG -> native share sheet
 *   web     the /api/og Vercel Function, which already renders the same geometry
 *
 * Both produce the certificate framed and screwed to a wall, never floating on white
 * (CLAUDE.md rule 6).
 */
import { Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { ogImageUrl, permalinkUrl } from './certificate/og';

export type ShareTarget = {
  serial: string;
  /** Ref to the FramedCertificate view. Native only. */
  viewRef?: React.RefObject<unknown>;
};

export async function shareCertificate({ serial, viewRef }: ShareTarget): Promise<void> {
  const url = permalinkUrl(serial);

  if (Platform.OS === 'web') {
    const nav = globalThis.navigator as Navigator | undefined;
    if (nav?.share) {
      await nav.share({ title: `Certificate ${serial}`, text: `Inspection ${serial}`, url });
      return;
    }
    await nav?.clipboard?.writeText(url);
    return;
  }

  if (viewRef?.current) {
    const uri = await captureRef(viewRef as never, {
      format: 'png',
      quality: 1,
      width: 1080,
      height: 1080,
    });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `Certificate ${serial}`,
        UTI: 'public.png',
      });
      return;
    }
  }

  await Share.share({ message: `Inspection ${serial}\n${url}`, url });
}

/** The server-rendered square, used as the web fallback and for previews. */
export const shareImageUrl = (serial: string) => ogImageUrl(serial, 'square');
