import * as DocumentPicker from 'expo-document-picker';

import type { DriverDocumentKind } from '@/lib/auth';

export const DRIVER_DOCUMENT_REQUIREMENTS: {
  kind: DriverDocumentKind;
  label: string;
  description: string;
  required: boolean;
}[] = [
  {
    kind: 'identity',
    label: 'ID or passport',
    description: 'Clear copy of your South African ID or valid passport.',
    required: true,
  },
  {
    kind: 'drivers_license',
    label: "Driver's licence",
    description: 'Upload a clear copy showing the licence details and expiry date.',
    required: true,
  },
  {
    kind: 'vehicle_registration',
    label: 'Vehicle registration / licence',
    description: 'Registration or vehicle licence document for the vehicle you will use.',
    required: true,
  },
  {
    kind: 'roadworthy',
    label: 'Roadworthy certificate',
    description: 'Current roadworthy certificate for the vehicle.',
    required: true,
  },
  {
    kind: 'insurance',
    label: 'Proof of vehicle insurance',
    description: 'Optional but recommended proof of active vehicle insurance.',
    required: false,
  },
];

export type PickedDriverDocument = {
  kind: DriverDocumentKind;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  fileData: string;
};

const MAX_BYTES = 5 * 1024 * 1024;

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read this document.'));
    reader.onload = () => {
      const value = String(reader.result ?? '');
      const comma = value.indexOf(',');
      resolve(comma >= 0 ? value.slice(comma + 1) : value);
    };
    reader.readAsDataURL(blob);
  });
}

export async function pickDriverDocument(
  kind: DriverDocumentKind
): Promise<PickedDriverDocument | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];

  if (asset.size && asset.size > MAX_BYTES) {
    throw new Error('Each document must be 5 MB or smaller.');
  }

  const response = await fetch(asset.uri);
  const blob = await response.blob();

  if (blob.size > MAX_BYTES) {
    throw new Error('Each document must be 5 MB or smaller.');
  }

  const contentType =
    asset.mimeType ||
    blob.type ||
    (asset.name.toLowerCase().endsWith('.pdf')
      ? 'application/pdf'
      : 'image/jpeg');

  if (
    ![
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ].includes(contentType)
  ) {
    throw new Error('Use a PDF, JPG, PNG or WEBP file.');
  }

  return {
    kind,
    fileName: asset.name || `${kind}.pdf`,
    contentType,
    sizeBytes: blob.size,
    fileData: await blobToBase64(blob),
  };
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
