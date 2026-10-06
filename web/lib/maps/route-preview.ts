export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type RoutePreview = {
  origin: RouteCoordinate;
  destination: RouteCoordinate;
  path: RouteCoordinate[];
  distanceKm: number;
  durationMinutes: number;
  routing: "osrm" | "estimate";
};

type CityPoint = RouteCoordinate & { aliases?: string[] };

const SOUTH_AFRICAN_PLACES: Record<string, CityPoint> = {
  johannesburg: { latitude: -26.2041, longitude: 28.0473, aliases: ["joburg", "jhb"] },
  soweto: { latitude: -26.2485, longitude: 27.854 },
  sandton: { latitude: -26.1076, longitude: 28.0567 },
  midrand: { latitude: -25.9992, longitude: 28.1263 },
  pretoria: { latitude: -25.7479, longitude: 28.2293, aliases: ["tshwane"] },
  centurion: { latitude: -25.8603, longitude: 28.1894 },
  "kempton park": { latitude: -26.1009, longitude: 28.2293 },
  benoni: { latitude: -26.1885, longitude: 28.3208 },
  boksburg: { latitude: -26.2326, longitude: 28.2409 },
  vereeniging: { latitude: -26.6731, longitude: 27.9261 },
  "cape town": { latitude: -33.9249, longitude: 18.4241 },
  stellenbosch: { latitude: -33.9321, longitude: 18.8602 },
  george: { latitude: -33.9649, longitude: 22.4617 },
  durban: { latitude: -29.8587, longitude: 31.0218 },
  pietermaritzburg: { latitude: -29.6006, longitude: 30.3794 },
  ballito: { latitude: -29.539, longitude: 31.2144 },
  "richards bay": { latitude: -28.7807, longitude: 32.0383 },
  polokwane: { latitude: -23.9045, longitude: 29.4689 },
  tzaneen: { latitude: -23.8332, longitude: 30.1635 },
  thohoyandou: { latitude: -22.9456, longitude: 30.4849 },
  musina: { latitude: -22.3513, longitude: 30.0403 },
  mbombela: { latitude: -25.4753, longitude: 30.9694, aliases: ["nelspruit"] },
  emalahleni: { latitude: -25.8728, longitude: 29.2553, aliases: ["witbank"] },
  secunda: { latitude: -26.55, longitude: 29.1667 },
  bloemfontein: { latitude: -29.0852, longitude: 26.1596 },
  welkom: { latitude: -27.9774, longitude: 26.7351 },
  kimberley: { latitude: -28.7282, longitude: 24.7499 },
  upington: { latitude: -28.4541, longitude: 21.2419 },
  mahikeng: { latitude: -25.8652, longitude: 25.6442, aliases: ["maf ikeng", "mafeking", "mmabatho"] },
  rustenburg: { latitude: -25.6676, longitude: 27.2421 },
  gqeberha: { latitude: -33.9608, longitude: 25.6022, aliases: ["port elizabeth", "pe"] },
  "east london": { latitude: -33.0153, longitude: 27.9116 },
  mthatha: { latitude: -31.5889, longitude: 28.7844, aliases: ["umtata"] },
};

function normalizePlace(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function resolveKnownPlace(value: string): RouteCoordinate | null {
  const normalized = normalizePlace(value);
  if (!normalized) return null;

  for (const [name, point] of Object.entries(SOUTH_AFRICAN_PLACES)) {
    const candidates = [name, ...(point.aliases ?? [])];
    if (
      candidates.some((candidate) => {
        const normalizedCandidate = normalizePlace(candidate);
        return (
          normalized === normalizedCandidate ||
          normalized.includes(normalizedCandidate) ||
          normalizedCandidate.includes(normalized)
        );
      })
    ) {
      return { latitude: point.latitude, longitude: point.longitude };
    }
  }

  return null;
}

function haversineKm(a: RouteCoordinate, b: RouteCoordinate) {
  const radiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(b.latitude - a.latitude);
  const longitudeDelta = toRadians(b.longitude - a.longitude);
  const startLatitude = toRadians(a.latitude);
  const endLatitude = toRadians(b.latitude);

  const h =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * radiusKm * Math.asin(Math.sqrt(h));
}

function samplePath(path: RouteCoordinate[], limit = 120) {
  if (path.length <= limit) return path;
  const step = Math.ceil(path.length / limit);
  const sampled = path.filter((_, index) => index % step === 0);
  const last = path[path.length - 1];
  if (sampled[sampled.length - 1] !== last) sampled.push(last);
  return sampled;
}

async function geocodeRemotePlace(value: string): Promise<RouteCoordinate | null> {
  const baseUrl = (
    process.env.NOMINATIM_BASE_URL?.trim() || "https://nominatim.openstreetmap.org"
  ).replace(/\/$/, "");

  try {
    const params = new URLSearchParams({
      q: `${value}, South Africa`,
      format: "jsonv2",
      limit: "1",
      countrycodes: "za",
    });
    const response = await fetch(`${baseUrl}/search?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Vaya/1.0 (co.za.vaya.app)",
      },
      next: { revalidate: 60 * 60 * 24 * 30 },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
    }>;
    const latitude = Number(payload[0]?.lat);
    const longitude = Number(payload[0]?.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  } catch (error) {
    console.warn("Place geocoding failed", value, error);
    return null;
  }
}

export async function getRoutePreview(
  from: string,
  to: string
): Promise<RoutePreview | null> {
  const knownOrigin = resolveKnownPlace(from);
  const knownDestination = resolveKnownPlace(to);

  const origin = knownOrigin ?? (await geocodeRemotePlace(from));
  if (!origin) return null;

  if (!knownOrigin && !knownDestination) {
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  const destination =
    knownDestination ?? (await geocodeRemotePlace(to));
  if (!destination) return null;

  const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const baseUrl = (
    process.env.OSRM_BASE_URL?.trim() || "https://router.project-osrm.org"
  ).replace(/\/$/, "");

  try {
    const response = await fetch(
      `${baseUrl}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Vaya/1.0 (co.za.vaya.app)",
        },
        next: { revalidate: 60 * 60 * 24 },
        signal: AbortSignal.timeout(6000),
      }
    );

    if (response.ok) {
      const payload = (await response.json()) as {
        code?: string;
        routes?: Array<{
          distance?: number;
          duration?: number;
          geometry?: { coordinates?: number[][] };
        }>;
      };
      const route = payload.routes?.[0];
      const geometry = route?.geometry?.coordinates;

      if (
        payload.code === "Ok" &&
        route &&
        Array.isArray(geometry) &&
        geometry.length >= 2
      ) {
        const path = samplePath(
          geometry
            .filter(
              (coordinate) =>
                Array.isArray(coordinate) &&
                Number.isFinite(coordinate[0]) &&
                Number.isFinite(coordinate[1])
            )
            .map(([longitude, latitude]) => ({ latitude, longitude }))
        );

        return {
          origin,
          destination,
          path,
          distanceKm: Math.round(((route.distance ?? 0) / 1000) * 10) / 10,
          durationMinutes: Math.max(
            1,
            Math.round((route.duration ?? 0) / 60)
          ),
          routing: "osrm",
        };
      }
    }
  } catch (error) {
    console.warn("OSRM route preview failed", error);
  }

  const directKm = haversineKm(origin, destination);
  const estimatedRoadKm = Math.round(directKm * 1.2 * 10) / 10;

  return {
    origin,
    destination,
    path: [origin, destination],
    distanceKm: estimatedRoadKm,
    durationMinutes: Math.max(1, Math.round((estimatedRoadKm / 80) * 60)),
    routing: "estimate",
  };
}
