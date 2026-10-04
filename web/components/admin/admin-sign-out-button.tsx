"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AdminSignOutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function signOut() {
    setSubmitting(true);

    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
      });
    } finally {
      router.replace("/admin/login");
      router.refresh();
      setSubmitting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => void signOut()}
      disabled={submitting}
      className="w-full justify-start text-[#667085] hover:text-[#B42318]">
      <LogOut />
      {submitting ? "Signing out..." : "Sign out"}
    </Button>
  );
}
