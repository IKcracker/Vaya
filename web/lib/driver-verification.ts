export const REQUIRED_DRIVER_DOCUMENTS = [
  { kind: "identity", label: "ID or passport", required: true },
  { kind: "drivers_license", label: "Driver's licence", required: true },
  { kind: "vehicle_registration", label: "Vehicle registration / licence document", required: true },
  { kind: "roadworthy", label: "Roadworthy certificate", required: true },
] as const;

export const OPTIONAL_DRIVER_DOCUMENTS = [
  { kind: "insurance", label: "Proof of vehicle insurance", required: false },
] as const;

export const DRIVER_DOCUMENTS = [
  ...REQUIRED_DRIVER_DOCUMENTS,
  ...OPTIONAL_DRIVER_DOCUMENTS,
] as const;

export type DriverDocumentKind = (typeof DRIVER_DOCUMENTS)[number]["kind"];

export function isDriverDocumentKind(value: string): value is DriverDocumentKind {
  return DRIVER_DOCUMENTS.some((item) => item.kind === value);
}
