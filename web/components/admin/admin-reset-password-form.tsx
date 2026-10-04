"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get("newPassword") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (!token) {
      setError("This reset link is missing its token.");
      setSubmitting(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      setSubmitting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? "Unable to reset password");
        return;
      }

      setSuccess(true);

      window.setTimeout(() => {
        router.replace("/admin/login?reset=success");
        router.refresh();
      }, 1200);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] px-4 py-8 sm:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[640px] items-center justify-center">
          <div className="w-full rounded-2xl border border-[#E4E7EC] bg-white p-8 text-center shadow-[0_24px_70px_rgba(16,24,40,.08)]">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#ECFDF3] text-[#12B76A]">
              <CheckCircle2 className="size-6" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-[-.035em] text-[#101828]">
              Password set successfully
            </h1>
            <p className="mt-2 text-sm text-[#667085]">
              Redirecting you to the admin sign-in page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[720px] items-center justify-center">
        <div className="w-full rounded-2xl border border-[#E4E7EC] bg-white p-6 shadow-[0_24px_70px_rgba(16,24,40,.08)] sm:p-10">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#667085] transition hover:text-[#1877F2]">
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>

          <div className="mx-auto mt-8 max-w-[420px]">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#E7F3FF] text-[#1877F2]">
              <KeyRound className="size-5" />
            </div>

            <h1 className="mt-6 text-2xl font-bold tracking-[-.035em] text-[#101828]">
              Choose your admin password
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Create a password you’ll use to sign in to the Vaya Admin CRM.
            </p>

            {!token ? (
              <div className="mt-5 rounded-lg border border-[#FECACA] bg-[#FFF8F7] px-4 py-3 text-xs leading-5 text-[#B42318]">
                This reset link is invalid because the token is missing. Request a new password setup link.
              </div>
            ) : null}

            {error ? (
              <div className="mt-5 rounded-lg border border-[#FECACA] bg-[#FFF8F7] px-4 py-3 text-xs leading-5 text-[#B42318]">
                {error}
              </div>
            ) : null}

            <form className="mt-7 space-y-5" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((show) => !show)}
                    className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-[#667085] hover:bg-[#F2F4F7]"
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((show) => !show)}
                    className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-[#667085] hover:bg-[#F2F4F7]"
                    aria-label={showConfirm ? "Hide password" : "Show password"}>
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-10 w-full bg-[#1877F2] text-white hover:bg-[#166FE5]"
                disabled={submitting || !token}>
                {submitting ? "Setting password..." : "Set admin password"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
