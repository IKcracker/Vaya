export const MAX_DRIVER_DOCUMENT_BYTES = 3 * 1024 * 1024;

export function validateDriverDocument(contentType: string, encoded: string) {
  const fileData = encoded.replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
  if (fileData.length > Math.ceil(MAX_DRIVER_DOCUMENT_BYTES / 3) * 4) {
    return { error: "Each document must be 3 MB or smaller", status: 413 } as const;
  }
  if (!fileData || fileData.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(fileData)) {
    return { error: "This document could not be read. Choose the original file again.", status: 400 } as const;
  }
  const bytes = Buffer.from(fileData, "base64");
  if (bytes.toString("base64") !== fileData) return { error: "Invalid document encoding. Choose the original file again.", status: 400 } as const;
  const matches =
    (contentType === "application/pdf" && bytes.subarray(0, 5).toString() === "%PDF-") ||
    (contentType === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (contentType === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (contentType === "image/webp" && bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP");
  if (!matches) return { error: "The file contents do not match its type. Upload an original PDF, JPG, PNG or WEBP.", status: 400 } as const;
  return { fileData, sizeBytes: bytes.length } as const;
}
