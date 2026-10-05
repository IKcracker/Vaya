export const MAX_PROFILE_IMAGE_BYTES = 3 * 1024 * 1024;

const ALLOWED_PROFILE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function validateProfileImage(contentType: string, encoded: string) {
  const normalizedType = contentType.trim().toLowerCase();
  if (!ALLOWED_PROFILE_IMAGE_TYPES.has(normalizedType)) {
    return { error: "Use a JPG, PNG or WEBP profile photo", status: 400 } as const;
  }

  const fileData = encoded
    .replace(/^data:[^;]+;base64,/, "")
    .replace(/\s/g, "");

  if (fileData.length > Math.ceil(MAX_PROFILE_IMAGE_BYTES / 3) * 4) {
    return { error: "Profile photos must be 3 MB or smaller", status: 413 } as const;
  }

  if (!fileData || fileData.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(fileData)) {
    return { error: "This photo could not be read. Choose the original image again.", status: 400 } as const;
  }

  const bytes = Buffer.from(fileData, "base64");
  if (bytes.toString("base64") !== fileData) {
    return { error: "Invalid image encoding. Choose the original photo again.", status: 400 } as const;
  }

  const matches =
    (normalizedType === "image/jpeg" &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff) ||
    (normalizedType === "image/png" &&
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (normalizedType === "image/webp" &&
      bytes.subarray(0, 4).toString() === "RIFF" &&
      bytes.subarray(8, 12).toString() === "WEBP");

  if (!matches) {
    return { error: "The image contents do not match its file type.", status: 400 } as const;
  }

  return {
    contentType: normalizedType,
    fileData,
    sizeBytes: bytes.length,
  } as const;
}
