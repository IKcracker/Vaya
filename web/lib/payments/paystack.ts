import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const PAYSTACK_API = "https://api.paystack.co";

function secretKey() {
  return process.env.PAYSTACK_SECRET_KEY?.trim() ?? "";
}

export function isPaystackConfigured() {
  return Boolean(secretKey());
}

async function paystackRequest<T>(path: string, init?: RequestInit) {
  const key = secretKey();

  if (!key) {
    throw new Error("PAYSTACK_NOT_CONFIGURED");
  }

  const response = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as T & {
    status?: boolean;
    message?: string;
  };

  if (!response.ok || payload?.status === false) {
    throw new Error(payload?.message || `Paystack request failed (${response.status})`);
  }

  return payload;
}

export async function initializePaystackTransaction(input: {
  email: string;
  amountCents: number;
  reference: string;
  callbackUrl: string;
  bookingId: string;
  tripId: string;
}) {
  return paystackRequest<{
    status: boolean;
    message: string;
    data: {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: String(input.amountCents),
      currency: "ZAR",
      reference: input.reference,
      callback_url: input.callbackUrl,
      channels: ["card", "eft", "capitec_pay"],
      metadata: JSON.stringify({
        booking_id: input.bookingId,
        trip_id: input.tripId,
        source: "vaya_mobile",
      }),
    }),
  });
}

export async function verifyPaystackTransaction(reference: string) {
  return paystackRequest<{
    status: boolean;
    message: string;
    data: {
      id: number;
      status: string;
      reference: string;
      amount: number;
      currency: string;
      gateway_response?: string;
      paid_at?: string | null;
    };
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function verifyPaystackWebhook(rawBody: string, signature: string | null) {
  const key = secretKey();
  if (!key || !signature) return false;

  const expected = createHmac("sha512", key).update(rawBody).digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    return false;
  }
}
