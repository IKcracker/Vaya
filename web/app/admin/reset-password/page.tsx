import { Suspense } from "react";
import { AdminResetPasswordForm } from "@/components/admin/admin-reset-password-form";

export default function AdminResetPasswordPage() {
  return (
    <Suspense>
      <AdminResetPasswordForm />
    </Suspense>
  );
}
