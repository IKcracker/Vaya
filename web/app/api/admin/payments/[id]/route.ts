import { getPaymentDetails, updatePayment } from "@/lib/db/crm";
import { isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statuses = new Set(["Pending", "Settled", "Refunded", "Failed"]);
const methods = new Set(["Card", "Instant EFT", "Cash", "Bank transfer"]);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { id } = await params;
  try {
    const data = await getPaymentDetails(id);
    if (!data) return Response.json({ error: "Payment not found" }, { status: 404 });
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Payment detail load failed", error);
    return Response.json({ error: "Unable to load payment" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const update: { amountCents?: number; method?: string; status?: string } = {};
  if (body?.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 0) return Response.json({ error: "Invalid amount" }, { status: 400 });
    update.amountCents = Math.round(amount * 100);
  }
  if (typeof body?.method === "string" && methods.has(body.method)) update.method = body.method;
  if (typeof body?.status === "string" && statuses.has(body.status)) update.status = body.status;

  if (!Object.keys(update).length) return Response.json({ error: "No valid payment updates supplied" }, { status: 400 });

  try {
    const payment = await updatePayment(id, update);
    if (!payment) return Response.json({ error: "Payment not found" }, { status: 404 });
    return Response.json({ payment });
  } catch (error) {
    console.error("Payment update failed", error);
    return Response.json({ error: "Unable to update payment" }, { status: 500 });
  }
}
