import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

export type PickedProfileImage = {
  fileName: string;
  contentType: string;
  fileData: string;
  uri: string;
  sizeBytes: number;
};

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read this photo.'));
    reader.onload = () => {
      const value = String(reader.result ?? '');
      const comma = value.indexOf(',');
      resolve(comma >= 0 ? value.slice(comma + 1) : value);
    };
    reader.readAsDataURL(blob);
  });
}

export async function pickProfileImage(): Promise<PickedProfileImage | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ALLOWED_TYPES,
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  if (asset.size && asset.size > MAX_BYTES) {
    throw new Error('Profile photos must be 3 MB or smaller.');
  }

  const file =
    Platform.OS === 'web'
      ? (asset.file ?? await (await fetch(asset.uri)).blob())
      : new File(asset.uri);

  if (!file.size || file.size > MAX_BYTES) {
    throw new Error('Choose a non-empty photo that is 3 MB or smaller.');
  }

  const contentType =
    asset.mimeType ||
    file.type ||
    (asset.name.toLowerCase().endsWith('.png')
      ? 'image/png'
      : asset.name.toLowerCase().endsWith('.webp')
        ? 'image/webp'
        : 'image/jpeg');

  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new Error('Use a JPG, PNG or WEBP photo.');
  }

  return {
    fileName: asset.name || 'profile-photo.jpg',
    contentType,
    sizeBytes: file.size,
    fileData:
      Platform.OS === 'web'
        ? await blobToBase64(file as Blob)
        : await (file as File).base64(),
    uri: asset.uri,
  };
}
