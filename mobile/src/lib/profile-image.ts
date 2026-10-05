import * as ImagePicker from 'expo-image-picker';

export type PickedProfileImage = {
  fileName: string;
  contentType: string;
  fileData: string;
  uri: string;
  sizeBytes: number;
};

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function pickProfileImage(): Promise<PickedProfileImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Allow photo-library access to choose a profile picture.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: true,
    selectionLimit: 1,
    defaultTab: 'photos',
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const fileData = asset.base64 ?? '';
  if (!fileData) {
    throw new Error('Vaya could not read this photo. Choose another image.');
  }

  const contentType =
    asset.mimeType && ALLOWED_TYPES.includes(asset.mimeType)
      ? asset.mimeType
      : 'image/jpeg';

  const estimatedBytes =
    asset.fileSize ??
    Math.floor((fileData.length * 3) / 4);

  if (!estimatedBytes || estimatedBytes > MAX_BYTES) {
    throw new Error('Profile photos must be 3 MB or smaller.');
  }

  return {
    fileName: asset.fileName || 'profile-photo.jpg',
    contentType,
    sizeBytes: estimatedBytes,
    fileData,
    uri: asset.uri,
  };
}
