"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  CarFront,
  Clock3,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  UserCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DRIVER_DOCUMENTS } from "@/lib/driver-verification";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DriverDocument = {
  id: string;
  kind: string;
  label: string;
  required: boolean;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  status: string;
  reviewNote: string;
  uploadedAt: string;
  reviewedAt: string | null;
  updatedAt: string;
};

type DriverVerification = {
  documents: DriverDocument[];
  requiredCount: number;
  uploadedRequiredCount: number;
  approvedRequiredCount: number;
  missingKinds: string[];
  needsAttentionKinds: string[];
  readyToApprove: boolean;
};

type DriverRecord = {
  id: string;
  initials: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleRegistration: string;
  vehicleColor: string;
  vehicle: string;
  checks: string;
  status: string;
  submittedAt: string;
  updatedAt: string;
  profileImageUrl: string;
  verification: DriverVerification;
};

type DriverTrip = {
  id: string;
  route: string;
  departure: string;
  occupancy: string;
  fare: string;
  status: string;
};

type Activity = {
  id: string;
  title: string;
  detail: string;
  time: string;
};

function statusVariant(value: string) {
  const lower = value.toLowerCase();
  if (lower.includes("approved") || lower.includes("ready") || lower.includes("active")) return "success" as const;
  if (lower.includes("review") || lower.includes("needs")) return "warning" as const;
  if (lower.includes("rejected") || lower.includes("suspended") || lower.includes("removed")) return "destructive" as const;
  return "secondary" as const;
}

export function DriverDetail({
  initialDriver,
  trips,
  activity,
}: {
  initialDriver: DriverRecord;
  trips: DriverTrip[];
  activity: Activity[];
}) {
  const router = useRouter();
  const [driver, setDriver] = useState(initialDriver);
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<DriverDocument | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"Approved" | "Needs info" | "Rejected">("Approved");
  const [reviewNote, setReviewNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  function openReview(document: DriverDocument, status: typeof reviewStatus) {
    setReviewTarget(document);
    setReviewStatus(status);
    setReviewNote("");
    setConfirmed(false);
    setMessage(null);
  }

  const submitted = useMemo(
    () => new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(driver.submittedAt)),
    [driver.submittedAt]
  );

  const updated = useMemo(
    () => new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(driver.updatedAt)),
    [driver.updatedAt]
  );

  async function patchDriver(update: Record<string, unknown>) {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/drivers/${driver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(payload?.error ?? "Unable to update driver");
        return false;
      }

      setDriver((current) => ({
        ...current,
        ...update,
        ...(update.vehicleMake || update.vehicleModel || update.vehicleYear
          ? {
              vehicle: `${String(update.vehicleMake ?? current.vehicleMake)} ${String(update.vehicleModel ?? current.vehicleModel)} · ${String(update.vehicleYear ?? current.vehicleYear)}`,
            }
          : {}),
        updatedAt: new Date().toISOString(),
      }));
      router.refresh();
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function reviewDocument(
    documentId: string,
    status: "Approved" | "Needs info" | "Rejected"
  ) {
    if (!reviewTarget || (status === "Approved" ? !confirmed : !reviewNote.trim())) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/drivers/${driver.id}/documents/${documentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, reviewNote, confirmed, expectedUpdatedAt: reviewTarget.updatedAt }),
        }
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(payload?.error ?? "Unable to review document");
        if (response.status === 409) {
          const latest = await fetch(`/api/admin/drivers/${driver.id}`, { cache: "no-store" });
          const data = await latest.json().catch(() => null);
          if (latest.ok && data?.driver) {
            setDriver(data.driver);
            setReviewTarget(null);
          }
        }
        return;
      }

      setDriver((current) => ({
        ...current,
        status: payload.verification.status,
        checks: payload.verification.checks,
        updatedAt: new Date().toISOString(),
        verification: {
          ...payload.verification,
          documents: current.verification.documents.map((document) =>
            document.id === payload.document.id ? payload.document : document
          ),
        },
      }));
      setMessage(`${payload.document.label} updated to ${status}.`);
      setReviewTarget(null);
      router.refresh();
    } catch {
      setMessage("Unable to save the review. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(status: string) {
    const ok = await patchDriver({ status });
    if (ok) setMessage(`Driver status updated to ${status}.`);
  }

  async function saveProfile(formData: FormData) {
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      location: String(formData.get("location") || "").trim(),
      vehicleMake: String(formData.get("vehicleMake") || "").trim(),
      vehicleModel: String(formData.get("vehicleModel") || "").trim(),
      vehicleYear: Number(formData.get("vehicleYear")),
      checks: String(formData.get("checks") || "").trim(),
    };

    const ok = await patchDriver(payload);
    if (ok) {
      setEditOpen(false);
      setMessage("Driver profile updated.");
    }
  }

  async function removeDriver() {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/drivers/${driver.id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(payload?.error ?? "Unable to remove driver");
        return;
      }

      router.push("/admin");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#101828]">
      <header className="sticky top-0 z-30 border-b border-[#E4E7EC] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Button variant="outline" size="icon" render={<Link href="/admin" />} aria-label="Back to CRM">
            <ArrowLeft />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[.1em] text-[#98A2B3]">Vaya CRM / Drivers</div>
            <div className="truncate text-sm font-semibold">{driver.name}</div>
          </div>
          <Badge variant={statusVariant(driver.status)}>{driver.status}</Badge>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8">
        {message ? (
          <div className="mb-5 rounded-lg border border-[#D1E9FF] bg-[#F5F9FF] px-4 py-3 text-sm text-[#175CD3]">
            {message}
          </div>
        ) : null}

        <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-4">
            {driver.profileImageUrl ? (
              <Image
                src={driver.profileImageUrl}
                alt={`${driver.name} profile photo`}
                width={64}
                height={64}
                unoptimized
                className="h-16 w-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#E7F3FF] text-xl font-bold text-[#1877F2]">
                {driver.initials}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-[-.035em] sm:text-[30px]">{driver.name}</h1>
                {driver.status === "Approved" ? <Badge variant="success"><BadgeCheck /> Verified</Badge> : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#667085]">
                <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{driver.location}</span>
                <span className="inline-flex items-center gap-1.5"><CarFront className="size-3.5" />{driver.vehicle}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void updateStatus("Needs info")} disabled={saving}>Request info</Button>
            <Button variant="destructive" onClick={() => void updateStatus("Rejected")} disabled={saving}>Reject</Button>
            <Button variant="outline" onClick={() => void updateStatus("Suspended")} disabled={saving}>
              <Ban />
              Suspend
            </Button>
            <Button
              className="bg-[#1877F2] hover:bg-[#166FE5]"
              onClick={() => void updateStatus("Approved")}
              disabled={saving || !driver.verification.readyToApprove}
              title={
                driver.verification.readyToApprove
                  ? "Approve driver"
                  : "Approve all required documents first"
              }>
              <UserCheck />
              Approve
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
          <div className="space-y-6">
            <Card className="shadow-none">
              <CardHeader className="border-b border-[#EAECF0]">
                <CardTitle>Driver profile</CardTitle>
                <CardDescription>Identity, contact and verification information.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
                {[
                  ["Email", driver.email || "Not provided", Mail],
                  ["Phone", driver.phone || "Not provided", Phone],
                  ["Location", driver.location, MapPin],
                  ["Verification", driver.checks, ShieldCheck],
                ].map(([label, value, Icon]) => {
                  const ItemIcon = Icon as typeof Mail;
                  return (
                    <div key={String(label)} className="rounded-lg border border-[#EAECF0] bg-[#F9FAFB] p-4">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.08em] text-[#98A2B3]">
                        <ItemIcon className="size-3.5" />
                        {String(label)}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-[#344054]">{String(value)}</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="border-b border-[#EAECF0]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>Verification documents</CardTitle>
                    <CardDescription>
                      Review each attachment before approving this driver.
                    </CardDescription>
                  </div>
                  <Badge variant={driver.verification.readyToApprove ? "success" : "warning"}>
                    {driver.verification.approvedRequiredCount}/{driver.verification.requiredCount} required approved
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-b border-[#EAECF0] bg-[#F8FAFC] p-5">
                  <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#EAECF0]">
                    <div className="h-full rounded-full bg-[#1877F2] transition-all" style={{ width: `${driver.verification.approvedRequiredCount / driver.verification.requiredCount * 100}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DRIVER_DOCUMENTS.filter((item) => item.required).map((requirement) => {
                      const file = driver.verification.documents.find((item) => item.kind === requirement.kind);
                      return <Badge key={requirement.kind} variant={file?.status === "Approved" ? "success" : "warning"}>{requirement.label}: {file?.status ?? "Missing"}</Badge>;
                    })}
                  </div>
                </div>
                {driver.verification.documents.length ? (
                  <div className="divide-y divide-[#EAECF0]">
                    {driver.verification.documents.map((document) => (
                      <div key={document.id} className="p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <FileText className="size-4 text-[#667085]" />
                              <div className="text-sm font-semibold text-[#101828]">
                                {document.label}
                              </div>
                              <Badge variant={statusVariant(document.status)}>
                                {document.status}
                              </Badge>
                              {document.required ? (
                                <Badge variant="secondary">Required</Badge>
                              ) : null}
                            </div>
                            <div className="mt-2 truncate text-xs text-[#667085]">
                              {document.fileName} · {(document.sizeBytes / 1024 / 1024).toFixed(2)} MB
                            </div>
                            <div className="mt-1 text-xs text-[#98A2B3]">Uploaded {new Date(document.uploadedAt).toLocaleDateString("en-ZA")}{document.reviewedAt ? ` · Reviewed ${new Date(document.reviewedAt).toLocaleDateString("en-ZA")}` : " · Awaiting staff review"}</div>
                            {document.reviewNote ? (
                              <div className="mt-3 rounded-lg border border-[#FEDF89] bg-[#FFFAEB] px-3 py-2 text-xs leading-5 text-[#93370D]">
                                {document.reviewNote}
                              </div>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              render={
                                <a
                                  href={`/api/admin/drivers/${driver.id}/documents/${document.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                />
                              }>
                              <ExternalLink />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              disabled={saving}
                              onClick={() => openReview(document, "Needs info")}>
                              Request info
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={saving}
                              onClick={() => openReview(document, "Rejected")}>
                              Reject
                            </Button>
                            <Button
                              className="bg-[#1877F2] hover:bg-[#166FE5]"
                              disabled={saving || document.status === "Approved"}
                              onClick={() => openReview(document, "Approved")}>
                              <ShieldCheck />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 text-sm text-[#667085]">
                    No verification documents have been uploaded yet. The driver cannot be approved.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="border-b border-[#EAECF0]">
                <CardTitle>Vehicle</CardTitle>
                <CardDescription>Current vehicle linked to this driver record.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
                <Metric label="Make" value={driver.vehicleMake} />
                <Metric label="Model" value={driver.vehicleModel} />
                <Metric label="Year" value={String(driver.vehicleYear)} />
                <Metric label="Registration" value={driver.vehicleRegistration || "Not provided"} />
                <Metric label="Colour" value={driver.vehicleColor || "Not provided"} />
              </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-none">
              <CardHeader className="border-b border-[#EAECF0]">
                <CardTitle>Trip history</CardTitle>
                <CardDescription>{trips.length} recent trips linked to {driver.name}.</CardDescription>
              </CardHeader>
              {trips.length ? (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Trip</TableHead>
                      <TableHead>Departure</TableHead>
                      <TableHead>Occupancy</TableHead>
                      <TableHead>Fare</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>
                          <div className="font-semibold text-[#101828]">{trip.route}</div>
                          <div className="mt-0.5 text-[11px] text-[#98A2B3]">{trip.id}</div>
                        </TableCell>
                        <TableCell>{trip.departure}</TableCell>
                        <TableCell>{trip.occupancy}</TableCell>
                        <TableCell className="font-semibold text-[#101828]">{trip.fare}</TableCell>
                        <TableCell><Badge variant={statusVariant(trip.status)}>{trip.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="grid min-h-32 place-items-center p-6 text-sm text-[#98A2B3]">No trips linked to this driver yet.</div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-none">
              <CardHeader className="border-b border-[#EAECF0]">
                <CardTitle>Record status</CardTitle>
                <CardDescription>Administrative lifecycle and timestamps.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <Metric label="Status" value={driver.status} />
                <Metric label="Submitted" value={submitted} />
                <Metric label="Last updated" value={updated} />
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="border-b border-[#EAECF0]">
                <CardTitle>Activity</CardTitle>
                <CardDescription>Audit-friendly history for this driver.</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-[#EAECF0] p-0">
                {activity.length ? activity.map((item) => (
                  <div key={item.id} className="flex gap-3 px-5 py-4">
                    <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
                      <Clock3 className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold">{item.title}</div>
                      <div className="mt-1 text-[11px] leading-5 text-[#667085]">{item.detail}</div>
                    </div>
                    <div className="shrink-0 text-[10px] text-[#98A2B3]">{item.time}</div>
                  </div>
                )) : (
                  <div className="p-5 text-xs text-[#98A2B3]">No driver-specific activity yet.</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-[#FECACA] shadow-none">
              <CardHeader>
                <CardTitle className="text-[#B42318]">Administrative actions</CardTitle>
                <CardDescription>
                  Removing a driver hides them from the active CRM but preserves historical trip and audit data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={() => setRemoveOpen(true)}>
                  <Trash2 />
                  Remove driver
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={Boolean(reviewTarget)} onOpenChange={(open) => { if (!open && !saving) setReviewTarget(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{reviewTarget?.label} review</DialogTitle>
            <DialogDescription>Check the document is legible, current, and belongs to this driver or vehicle.</DialogDescription>
          </DialogHeader>
          {reviewTarget ? <div className="grid gap-5 px-5 py-4 md:grid-cols-[1.4fr_1fr]">
            <div className="space-y-2">
              <iframe title={`${reviewTarget.label} preview`} src={`/api/admin/drivers/${driver.id}/documents/${reviewTarget.id}?version=${encodeURIComponent(reviewTarget.updatedAt)}`} className="h-96 w-full rounded-xl border bg-[#F8FAFC]" />
              <a className="text-xs font-medium text-[#1877F2]" href={`/api/admin/drivers/${driver.id}/documents/${reviewTarget.id}`} target="_blank" rel="noreferrer">Open full document in a new tab</a>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl bg-[#F8FAFC] p-4 text-sm leading-6"><strong>{driver.name}</strong><br />{driver.email}<br />{driver.vehicle}<br />Registration: <strong>{driver.vehicleRegistration || "Not supplied"}</strong></div>
              <div className="flex flex-wrap gap-2">{(["Approved", "Needs info", "Rejected"] as const).map((status) => <Button key={status} size="sm" variant={reviewStatus === status ? "default" : "outline"} disabled={saving} onClick={() => { setReviewStatus(status); setConfirmed(false); }}>{status}</Button>)}</div>
              <Field label={reviewStatus === "Approved" ? "Review note (optional)" : "What must the driver fix?"} htmlFor="document-review-note"><Textarea id="document-review-note" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} maxLength={1000} disabled={saving} placeholder="Explain the issue and the document or correction needed." /></Field>
              {reviewStatus === "Approved" ? <label className="flex gap-3 rounded-lg border p-3 text-sm leading-5"><input type="checkbox" className="mt-1" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={saving} />I checked the original attachment, its validity, and matching driver / vehicle details.</label> : null}
              {message ? <p role="alert" className="text-sm text-[#B42318]">{message}</p> : null}
            </div>
          </div> : null}
          <DialogFooter><Button variant="outline" disabled={saving} onClick={() => setReviewTarget(null)}>Cancel</Button><Button disabled={saving || (reviewStatus === "Approved" ? !confirmed : !reviewNote.trim())} onClick={() => { if (reviewTarget) void reviewDocument(reviewTarget.id, reviewStatus); }}>{saving ? "Saving review…" : "Save review"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit driver</DialogTitle>
            <DialogDescription>Update contact, location, vehicle and verification details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => { event.preventDefault(); void saveProfile(new FormData(event.currentTarget)); }}>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Full name" htmlFor="driver-name"><Input id="driver-name" name="name" defaultValue={driver.name} required /></Field>
              <Field label="Email" htmlFor="driver-email"><Input id="driver-email" name="email" type="email" defaultValue={driver.email} /></Field>
              <Field label="Phone" htmlFor="driver-phone"><Input id="driver-phone" name="phone" defaultValue={driver.phone} /></Field>
              <Field label="Location" htmlFor="driver-location"><Input id="driver-location" name="location" defaultValue={driver.location} required /></Field>
              <Field label="Vehicle make" htmlFor="driver-make"><Input id="driver-make" name="vehicleMake" defaultValue={driver.vehicleMake} required /></Field>
              <Field label="Vehicle model" htmlFor="driver-model"><Input id="driver-model" name="vehicleModel" defaultValue={driver.vehicleModel} required /></Field>
              <Field label="Vehicle year" htmlFor="driver-year"><Input id="driver-year" name="vehicleYear" type="number" min="1980" max="2100" defaultValue={driver.vehicleYear} required /></Field>
              <Field label="Verification notes" htmlFor="driver-checks"><Input id="driver-checks" name="checks" defaultValue={driver.checks} required /></Field>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#1877F2] hover:bg-[#166FE5]" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {driver.name}?</DialogTitle>
            <DialogDescription>
              The driver will be removed from active CRM lists. Trip history and audit records will be retained.
            </DialogDescription>
          </DialogHeader>
          <div className="p-5">
            <div className="rounded-lg border border-[#FECACA] bg-[#FFF8F7] p-4 text-sm leading-6 text-[#B42318]">
              This action prevents the driver from being treated as an active operational record. It does not erase historical data.
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemoveOpen(false)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={() => void removeDriver()} disabled={saving}>
              <Trash2 />
              {saving ? "Removing..." : "Remove driver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#EAECF0] bg-[#F9FAFB] p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[.08em] text-[#98A2B3]">{label}</div>
      <div className="mt-2 text-sm font-semibold text-[#344054]">{value}</div>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
