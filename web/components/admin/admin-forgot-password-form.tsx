"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? "Unable to send reset email");
        return;
      }

      setMessage(
        payload?.message ??
          "If an account exists for that email, a password reset link has been sent."
      );
    } finally {
      setSubmitting(false);
    }
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
              <Mail className="size-5" />
            </div>

            <h1 className="mt-6 text-2xl font-bold tracking-[-.035em] text-[#101828]">
              Set or reset your password
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Enter the admin email you created in Neon Auth. We’ll send a secure password setup link.
            </p>

            {message ? (
              <div className="mt-5 rounded-lg border border-[#ABEFC6] bg-[#ECFDF3] px-4 py-3 text-xs leading-5 text-[#027A48]">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="mt-5 rounded-lg border border-[#FECACA] bg-[#FFF8F7] px-4 py-3 text-xs leading-5 text-[#B42318]">
                {error}
              </div>
            ) : null}

            <form className="mt-7 space-y-5" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Admin email</Label>
                <Input
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@vaya.co.za"
                  required
                />
              </div>

              <Button
                type="submit"
                className="h-10 w-full bg-[#1877F2] text-white hover:bg-[#166FE5]"
                disabled={submitting}>
                <Send />
                {submitting ? "Sending..." : "Send password setup link"}
              </Button>
            </form>

            <p className="mt-6 text-center text-[11px] leading-5 text-[#98A2B3]">
              For security, the same confirmation message is shown whether or not the email exists.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
