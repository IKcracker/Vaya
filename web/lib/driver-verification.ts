export const PERSONAL_DRIVER_DOCUMENTS = [
  { kind: "identity", label: "ID or passport", required: true },
  { kind: "drivers_license", label: "Driver's licence", required: true },
] as const;

export const VEHICLE_REQUIRED_DOCUMENTS = [
  { kind: "vehicle_registration", label: "Vehicle registration / licence document", required: true },
  { kind: "roadworthy", label: "Roadworthy certificate", required: true },
] as const;

export const VEHICLE_OPTIONAL_DOCUMENTS = [
  { kind: "insurance", label: "Proof of vehicle insurance", required: false },
] as const;

export const REQUIRED_DRIVER_DOCUMENTS = [
  ...PERSONAL_DRIVER_DOCUMENTS,
  ...VEHICLE_REQUIRED_DOCUMENTS,
] as const;

export const OPTIONAL_DRIVER_DOCUMENTS = [
  ...VEHICLE_OPTIONAL_DOCUMENTS,
] as const;

export const DRIVER_DOCUMENTS = [
  ...PERSONAL_DRIVER_DOCUMENTS,
  ...VEHICLE_REQUIRED_DOCUMENTS,
  ...VEHICLE_OPTIONAL_DOCUMENTS,
] as const;

export type DriverDocumentKind = (typeof DRIVER_DOCUMENTS)[number]["kind"];

export function isDriverDocumentKind(value: string): value is DriverDocumentKind {
  return DRIVER_DOCUMENTS.some((item) => item.kind === value);
}

export function isPersonalDriverDocumentKind(
  value: string
): value is (typeof PERSONAL_DRIVER_DOCUMENTS)[number]["kind"] {
  return PERSONAL_DRIVER_DOCUMENTS.some((item) => item.kind === value);
}

export function isVehicleDriverDocumentKind(
  value: string
): value is
  | (typeof VEHICLE_REQUIRED_DOCUMENTS)[number]["kind"]
  | (typeof VEHICLE_OPTIONAL_DOCUMENTS)[number]["kind"] {
  return [...VEHICLE_REQUIRED_DOCUMENTS, ...VEHICLE_OPTIONAL_DOCUMENTS].some(
    (item) => item.kind === value
  );
}
