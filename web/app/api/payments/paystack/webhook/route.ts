import {
  getMobilePayment,
  settleMobilePayment,
} from "@/lib/db/public";
import {
  verifyPaystackWebhook,
} from "@/lib/payments/paystack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (
    !verifyPaystackWebhook(
      rawBody,
      request.headers.get("x-paystack-signature")
    )
  ) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as {
    event?: string;
    data?: {
      reference?: string;
      amount?: number;
      currency?: string;
      status?: string;
    };
  };

  if (
    event.event !== "charge.success" ||
    event.data?.status !== "success" ||
    !event.data.reference
  ) {
    return Response.json({ received: true });
  }

  const payment = await getMobilePayment(event.data.reference);

  if (!payment) {
    return Response.json({ received: true });
  }

  if (
    event.data.amount !== payment.amountCents ||
    event.data.currency !== "ZAR"
  ) {
    console.error("Paystack webhook amount/currency mismatch", {
      reference: event.data.reference,
    });
    return Response.json({ received: true });
  }

  if (payment.status !== "Settled") {
    await settleMobilePayment(event.data.reference);
  }

  return Response.json({ received: true });
}
