"use client";
import { useState } from "react";
export function ResetPasswordForm({
  token,
  invalid,
}: {
  token: string;
  invalid: boolean;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const valid =
    !invalid && Boolean(token) && password.length >= 8 && password === confirm;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/mobile/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.error || "Unable to update password.");
      setDone(true);
      setPassword("");
      setConfirm("");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to update password.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-white px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-md">
        <p className="text-3xl font-bold text-emerald-800">Vaya</p>
        <h1 className="mt-10 text-2xl font-semibold">
          {done ? "Password updated" : "Set a new password"}
        </h1>
        {done ? (
          <p className="mt-4 text-slate-600">
            Return to the Vaya app and sign in with your new password.
          </p>
        ) : invalid || !token ? (
          <p role="alert" className="mt-4 text-red-700">
            This link is invalid or has expired. Open Vaya and request a new
            password reset link.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-5">
            <label className="block text-sm font-medium">
              New password
              <input
                required
                minLength={8}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                className="mt-2 block w-full rounded-xl border border-slate-200 p-3"
              />
            </label>
            <label className="block text-sm font-medium">
              Confirm password
              <input
                required
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={busy}
                className="mt-2 block w-full rounded-xl border border-slate-200 p-3"
              />
            </label>
            <p className="text-sm text-slate-500">
              Use at least 8 characters. Both passwords must match.
            </p>
            {error ? (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <button
              disabled={!valid || busy}
              className="min-h-12 w-full rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
