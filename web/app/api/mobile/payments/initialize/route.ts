import { isDatabaseConfigured } from "@/lib/db";
import {
  createPendingMobilePayment,
  failMobilePayment,
  getPassengerBookingForPayment,
} from "@/lib/db/public";
import {
  getMobileSessionCookie,
  getPassengerSession,
} from "@/lib/passenger-auth";
import {
  initializePaystackTransaction,
  isPaystackConfigured,
} from "@/lib/payments/paystack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function callbackUrl() {
  const configured = process.env.PAYSTACK_CALLBACK_URL?.trim();
  if (configured) return configured;

  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return site ? `${site}/payment/callback` : "";
}

export async function POST(request: Request) {
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

  const body = await request.json().catch(() => null);
  const bookingId =
    typeof body?.bookingId === "string" ? body.bookingId.trim() : "";

  if (!bookingId) {
    return Response.json({ error: "Booking reference is required" }, { status: 400 });
  }

  const booking = await getPassengerBookingForPayment(
    bookingId,
    auth.user.email
  );

  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.paymentStatus === "Paid") {
    return Response.json({ error: "Booking is already paid" }, { status: 409 });
  }

  if (booking.status === "Cancelled" || booking.status === "Completed") {
    return Response.json(
      { error: "This booking cannot be paid in its current state" },
      { status: 409 }
    );
  }

  const callback = callbackUrl();
  if (!callback) {
    return Response.json(
      { error: "PAYSTACK_CALLBACK_URL is not configured" },
      { status: 503 }
    );
  }

  const reference = `PAY-${crypto
    .randomUUID()
    .replaceAll("-", "")
    .slice(0, 18)
    .toUpperCase()}`;

  await createPendingMobilePayment({
    bookingDatabaseId: booking.databaseId,
    reference,
    amountCents: booking.amountCents,
  });

  try {
    const paystack = await initializePaystackTransaction({
      email: booking.passenger.email,
      amountCents: booking.amountCents,
      reference,
      callbackUrl: callback,
      bookingId: booking.id,
      tripId: booking.trip.id,
    });

    return Response.json({
      payment: {
        reference,
        amount: booking.amount,
        amountCents: booking.amountCents,
        authorizationUrl: paystack.data.authorization_url,
        accessCode: paystack.data.access_code,
        status: "Pending",
      },
    });
  } catch (error) {
    await failMobilePayment(reference);
    console.error("Paystack initialization failed", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to initialize payment",
      },
      { status: 502 }
    );
  }
}
