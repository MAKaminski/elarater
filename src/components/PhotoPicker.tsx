/**
 * Attach a photo to an inspection. Camera or library, one at a time.
 *
 * Camera capture is one of the four things defending against an Apple 4.2 rejection
 * (docs/06-store-compliance.md), so it is offered first on native. On web the OS file
 * picker is the only path, and expo-image-picker resolves to it.
 */
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { FormLabel, PaperSurface, Rule } from './primitives';
import { color, font, radius, space } from '@/theme/tokens';

export type PickedPhoto = {
  uri: string;
  width?: number;
  height?: number;
  mimeType?: string;
};

export function PhotoPicker({
  photo,
  onChange,
}: {
  photo: PickedPhoto | null;
  onChange: (photo: PickedPhoto | null) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  function accept(result: ImagePicker.ImagePickerResult) {
    if (result.canceled || !result.assets[0]) return;
    const a = result.assets[0];
    onChange({ uri: a.uri, width: a.width, height: a.height, mimeType: a.mimeType });
    setError(null);
  }

  async function fromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return setError('Photo library access is off.');
    accept(
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        // The certificate is the artifact; a photo is supporting evidence, so it is
        // resized rather than stored at full sensor resolution.
        allowsEditing: true,
      }),
    );
  }

  async function fromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return setError('Camera access is off.');
    accept(await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true }));
  }

  if (photo) {
    return (
      <View style={{ gap: space.sm }}>
        <FormLabel size={11} tone="wallTextDim">ATTACHED PHOTO</FormLabel>
        <View style={{ borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: color.brass }}>
          <Image
            source={{ uri: photo.uri }}
            style={{ width: '100%', aspectRatio: 4 / 3 }}
            contentFit="cover"
            accessibilityLabel="The photo attached to this inspection"
          />
        </View>
        <ActionButton label="REMOVE PHOTO" tone="quiet" onPress={() => onChange(null)} />
      </View>
    );
  }

  return (
    <View style={{ gap: space.sm }}>
      <FormLabel size={11} tone="wallTextDim">PHOTOGRAPH (OPTIONAL)</FormLabel>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {Platform.OS !== 'web' ? (
          <ActionButton label="TAKE A PHOTO" tone="quiet" style={{ flex: 1 }} onPress={fromCamera} />
        ) : null}
        <ActionButton label="CHOOSE A PHOTO" tone="quiet" style={{ flex: 1 }} onPress={fromLibrary} />
      </View>
      {error ? (
        <Text style={{ fontFamily: font.typed, fontSize: 13, color: color.officeLight }}>{error}</Text>
      ) : null}
    </View>
  );
}

/** Read-only strip of an elevator's photos. */
export function PhotoStrip({
  photos,
  onReport,
}: {
  photos: { id: string; url: string; caption: string | null }[];
  onReport?: (photoId: string) => void;
}) {
  if (photos.length === 0) return null;

  return (
    <View style={{ gap: space.sm }}>
      <FormLabel size={11} tone="wallTextDim">
        {`${photos.length} PHOTOGRAPH${photos.length === 1 ? '' : 'S'} ON FILE`}
      </FormLabel>
      {photos.map((p) => (
        <PaperSurface key={p.id} padding="xs" guilloche={false} style={{ gap: space.xs }}>
          <Image
            source={{ uri: p.url }}
            style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: radius.sm }}
            contentFit="cover"
            transition={180}
            accessibilityLabel={p.caption ?? 'Photograph of this elevator'}
          />
          {p.caption ? (
            <Text style={{ fontFamily: font.typed, fontSize: 13, color: color.ink }}>{p.caption}</Text>
          ) : null}
          {onReport ? (
            <>
              <Rule opacity={0.2} />
              <Pressable
                onPress={() => onReport(p.id)}
                accessibilityRole="button"
                accessibilityLabel="Report this photograph"
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <FormLabel size={10} tone="stamp">REPORT</FormLabel>
              </Pressable>
            </>
          ) : null}
        </PaperSurface>
      ))}
    </View>
  );
}
