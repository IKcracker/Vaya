"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reason = searchParams.get("reason");
  const reset = searchParams.get("reset");
  const requestedNext = searchParams.get("next");
  const next =
    requestedNext && requestedNext.startsWith("/admin")
      ? requestedNext
      : "/admin";

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? "Unable to sign in");
        return;
      }

      router.replace(next);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1100px] items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-[0_24px_70px_rgba(16,24,40,.08)] lg:grid-cols-[.9fr_1.1fr]">
          <div className="hidden bg-[#101828] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <Link href="/" className="inline-flex items-baseline" aria-label="Vaya home">
                <span className="text-[24px] font-extrabold tracking-[-1.2px]">vaya</span>
                <span className="ml-0.5 text-[24px] font-black text-[#60A5FA]">.</span>
              </Link>

              <div className="mt-16 max-w-sm">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-white/70">
                  <ShieldCheck className="size-3.5 text-[#60A5FA]" />
                  Protected workspace
                </div>
                <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-[-.045em]">
                  Vaya operations, in one secure workspace.
                </h1>
                <p className="mt-5 text-sm leading-7 text-white/60">
                  Manage drivers, trips, bookings, passengers, payments and safety cases from the Admin CRM.
                </p>
              </div>
            </div>

            <div className="text-[11px] text-white/40">
              Authentication powered by Neon Auth.
            </div>
          </div>

          <div className="p-6 sm:p-10 lg:p-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#667085] transition hover:text-[#1877F2] lg:hidden">
              <ArrowLeft className="size-4" />
              Back to Vaya
            </Link>

            <div className="mx-auto max-w-[420px]">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#E7F3FF] text-[#1877F2]">
                <LockKeyhole className="size-5" />
              </div>

              <h2 className="mt-6 text-2xl font-bold tracking-[-.035em] text-[#101828]">
                Admin sign in
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#667085]">
                Use an account with Vaya admin access.
              </p>

              {reset === "success" ? (
                <div className="mt-5 rounded-lg border border-[#ABEFC6] bg-[#ECFDF3] px-4 py-3 text-xs leading-5 text-[#027A48]">
                  Your password has been set. You can sign in now.
                </div>
              ) : null}

              {reason === "forbidden" ? (
                <div className="mt-5 rounded-lg border border-[#FEDF89] bg-[#FFFAEB] px-4 py-3 text-xs leading-5 text-[#B54708]">
                  Your account is signed in but does not have admin access.
                </div>
              ) : null}

              {reason === "unconfigured" ? (
                <div className="mt-5 rounded-lg border border-[#FECACA] bg-[#FFF8F7] px-4 py-3 text-xs leading-5 text-[#B42318]">
                  Neon Auth is not configured for this environment yet.
                </div>
              ) : null}

              {error ? (
                <div className="mt-5 rounded-lg border border-[#FECACA] bg-[#FFF8F7] px-4 py-3 text-xs leading-5 text-[#B42318]">
                  {error}
                </div>
              ) : null}

              <form className="mt-7 space-y-5" onSubmit={signIn}>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@vaya.co.za"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="pr-10"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((show) => !show)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-[#667085] hover:bg-[#F2F4F7] hover:text-[#101828]">
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link
                    href="/admin/forgot-password"
                    className="text-xs font-semibold text-[#1877F2] transition hover:text-[#166FE5] hover:underline hover:underline-offset-4">
                    Forgot or need to set your password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="h-10 w-full bg-[#1877F2] text-white hover:bg-[#166FE5]"
                  disabled={submitting}>
                  {submitting ? "Signing in..." : "Sign in to Admin CRM"}
                </Button>
              </form>

              <p className="mt-6 text-center text-[11px] leading-5 text-[#98A2B3]">
                Access is restricted to approved Vaya administrators.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
