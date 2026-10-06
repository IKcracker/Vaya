import { isDatabaseConfigured } from "@/lib/db";
import {
  getPassengerTripExperienceByEmail,
  submitDriverReviewByEmail,
} from "@/lib/db/public";
import {
  getMobileSessionCookie,
  getPassengerSession,
} from "@/lib/passenger-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authEmail(request: Request) {
  const auth = await getPassengerSession(getMobileSessionCookie(request));
  if (auth.status === "unconfigured") {
    return { error: Response.json({ error: "Passenger authentication is not configured" }, { status: 503 }) };
  }
  if (auth.status !== "authenticated" || !auth.user.email) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { email: auth.user.email };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const auth = await authEmail(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const trip = await getPassengerTripExperienceByEmail(auth.email, id);

  if (!trip) {
    return Response.json({ error: "Trip not found for this account" }, { status: 404 });
  }

  return Response.json({ trip }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const auth = await authEmail(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const rating = Number(body?.rating);
  const comment = typeof body?.comment === "string" ? body.comment.trim() : "";

  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length > 1200) {
    return Response.json({ error: "Choose a rating from 1 to 5" }, { status: 400 });
  }

  try {
    const review = await submitDriverReviewByEmail(auth.email, {
      tripId: id,
      rating,
      comment,
    });
    return Response.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "TRIP_NOT_FOUND") {
      return Response.json({ error: "Trip not found for this account" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "TRIP_NOT_COMPLETED") {
      return Response.json({ error: "Reviews are available after the trip is completed" }, { status: 409 });
    }
    if (error instanceof Error && error.message === "REVIEW_ALREADY_EXISTS") {
      return Response.json({ error: "You already reviewed this trip" }, { status: 409 });
    }
    console.error("Driver review failed", error);
    return Response.json({ error: "Unable to submit review" }, { status: 500 });
  }
}
