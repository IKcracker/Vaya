import { isDatabaseConfigured } from "@/lib/db";
import {
  failMobilePayment,
  getMobilePayment,
  settleMobilePayment,
} from "@/lib/db/public";
import {
  getMobileSessionCookie,
  getPassengerSession,
} from "@/lib/passenger-auth";
import {
  isPaystackConfigured,
  verifyPaystackTransaction,
} from "@/lib/payments/paystack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pendingStatuses = new Set([
  "ongoing",
  "pending",
  "processing",
  "queued",
]);

export async function GET(request: Request) {
  const auth = await getPassengerSession(getMobileSessionCookie(request));

  if (auth.status === "unconfigured") {
    return Response.json(
      { error: "Passenger authentication is not configured" },
      { status: 503 }
    );
  }

  if (auth.status !== "authenticated" || !auth.user.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  if (!isPaystackConfigured()) {
    return Response.json({ error: "Paystack is not configured" }, { status: 503 });
  }

  const reference = new URL(request.url).searchParams.get("reference")?.trim() ?? "";

  if (!reference) {
    return Response.json({ error: "Payment reference is required" }, { status: 400 });
  }

  const payment = await getMobilePayment(reference);

  if (!payment || payment.passengerEmail.toLowerCase() !== auth.user.email.toLowerCase()) {
    return Response.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.status === "Settled") {
    return Response.json({
      payment: {
        reference,
        status: "Settled",
        bookingId: payment.bookingPublicId,
      },
    });
  }

  try {
    const result = await verifyPaystackTransaction(reference);
    const data = result.data;

    if (
      data.reference !== reference ||
      data.amount !== payment.amountCents ||
      data.currency !== "ZAR"
    ) {
      return Response.json(
        { error: "Payment verification mismatch" },
        { status: 409 }
      );
    }

    if (data.status === "success") {
      await settleMobilePayment(reference);

      return Response.json({
        payment: {
          reference,
          status: "Settled",
          bookingId: payment.bookingPublicId,
        },
      });
    }

    if (!pendingStatuses.has(data.status)) {
      await failMobilePayment(reference);
    }

    return Response.json({
      payment: {
        reference,
        status: data.status,
        bookingId: payment.bookingPublicId,
      },
    });
  } catch (error) {
    console.error("Paystack verification failed", error);
    return Response.json(
      { error: "Unable to verify payment" },
      { status: 502 }
    );
  }
}
