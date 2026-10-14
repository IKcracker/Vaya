import { StyleSheet, Text, View } from "react-native";
import type { RoutePreview } from "@/lib/api";
import { Design } from "@/constants/design";

// The native map library cannot be imported during Expo Web static rendering.
// Render the server's route geometry locally, without sharing driver locations
// with an additional web map provider.
export function RouteMap({ route, from, to, height = 420, edgeToEdge = false, liveLocation }: {
  route: RoutePreview;
  from: string;
  to: string;
  height?: number;
  edgeToEdge?: boolean;
  liveLocation?: { latitude: number; longitude: number; heading?: number | null; isFresh?: boolean } | null;
}) {
  const points = [route.origin, ...route.path, route.destination, ...(liveLocation ? [liveLocation] : [])];
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLon = Math.min(minLon, point.longitude);
    maxLon = Math.max(maxLon, point.longitude);
  }
  const width = 600, svgHeight = 360, pad = 48;
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lonSpan = Math.max(maxLon - minLon, 0.01);
  const scale = Math.min((width - pad * 2) / lonSpan, (svgHeight - pad * 2) / latSpan);
  const x = (longitude: number) => width / 2 + (longitude - (minLon + maxLon) / 2) * scale;
  const y = (latitude: number) => svgHeight / 2 - (latitude - (minLat + maxLat) / 2) * scale;
  const path = [route.origin, ...route.path, route.destination]
    .map((point, index) => `${index ? "L" : "M"}${x(point.longitude).toFixed(1)},${y(point.latitude).toFixed(1)}`).join(" ");
  return <View style={[styles.wrap, { height }, edgeToEdge && { borderRadius: 0 }]}>
    <svg viewBox={`0 0 ${width} ${svgHeight}`} width="100%" height="100%" role="img" aria-label={`Route overview from ${from} to ${to}`}>
      <rect width={width} height={svgHeight} fill="#EAF2FF" />
      <path d={path} fill="none" stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} fill="none" stroke={Design.color.primary} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(route.origin.longitude)} cy={y(route.origin.latitude)} r={9} fill="#FFFFFF" stroke={Design.color.primary} strokeWidth={4} />
      <circle cx={x(route.destination.longitude)} cy={y(route.destination.latitude)} r={9} fill={Design.color.primary} stroke="#FFFFFF" strokeWidth={3} />
      <text x={x(route.origin.longitude)} y={y(route.origin.latitude) - 19} textAnchor="middle" fill={Design.color.text} fontSize={14}>{from}</text>
      <text x={x(route.destination.longitude)} y={y(route.destination.latitude) + 30} textAnchor="middle" fill={Design.color.text} fontSize={14}>{to}</text>
      {liveLocation ? <g>
        <circle cx={x(liveLocation.longitude)} cy={y(liveLocation.latitude)} r={12} fill={liveLocation.isFresh === false ? Design.color.muted : "#208AEF"} stroke="#FFFFFF" strokeWidth={4} />
        <text x={x(liveLocation.longitude)} y={y(liveLocation.latitude) - 20} textAnchor="middle" fill={Design.color.text} fontSize={13}>Driver{liveLocation.isFresh === false ? " · last seen" : ""}</text>
      </g> : null}
    </svg>
    <View style={styles.badge}>
      <Text style={styles.title}>Route overview</Text>
      <Text style={styles.copy}>{route.distanceKm.toFixed(0)} km · {Math.floor(route.durationMinutes / 60)} hr {Math.round(route.durationMinutes % 60)} min</Text>
    </View>
  </View>;
}

export function RouteMapFallback({ from, to, message, height = 420, edgeToEdge = false }: {
  from: string; to: string; message?: string; height?: number; edgeToEdge?: boolean;
}) {
  return <View style={[styles.wrap, styles.fallback, { height }, edgeToEdge && { borderRadius: 0 }]}>
    <Text style={styles.title}>{from} → {to}</Text>
    <Text style={styles.copy}>{message ?? "Map route unavailable"}</Text>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { overflow: "hidden", borderRadius: 9, backgroundColor: "#EAF2FF" },
  fallback: { alignItems: "center", justifyContent: "center", padding: 24, gap: 10 },
  badge: { position: "absolute", left: 12, bottom: 12, backgroundColor: "rgba(255,255,255,0.94)", borderRadius: 10, padding: 12 },
  title: { color: Design.color.text, fontWeight: "600", fontSize: 14 },
  copy: { color: Design.color.muted, fontSize: 12, marginTop: 4 },
});
