import MapView, { Marker, Polyline } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';

import type { RoutePreview } from '@/lib/api';

const GREEN = '#16B364';
const TEXT = '#101828';
const MUTED = '#667085';

function regionForRoute(route: RoutePreview) {
  const latitudes = route.path.map((point) => point.latitude);
  const longitudes = route.path.map((point) => point.longitude);
  const minLatitude = Math.min(route.origin.latitude, route.destination.latitude, ...latitudes);
  const maxLatitude = Math.max(route.origin.latitude, route.destination.latitude, ...latitudes);
  const minLongitude = Math.min(route.origin.longitude, route.destination.longitude, ...longitudes);
  const maxLongitude = Math.max(route.origin.longitude, route.destination.longitude, ...longitudes);

  const latitudeDelta = Math.max((maxLatitude - minLatitude) * 1.35, 0.08);
  const longitudeDelta = Math.max((maxLongitude - minLongitude) * 1.35, 0.08);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta,
    longitudeDelta,
  };
}

export function RouteMap({
  route,
  from,
  to,
  height = 150,
  liveLocation,
}: {
  route: RoutePreview;
  from: string;
  to: string;
  height?: number;
  liveLocation?: {
    latitude: number;
    longitude: number;
    heading?: number | null;
    isFresh?: boolean;
  } | null;
}) {
  const region = regionForRoute(route);

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        key={`${route.origin.latitude}-${route.origin.longitude}-${route.destination.latitude}-${route.destination.longitude}`}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        toolbarEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}>
        <Marker coordinate={route.origin} title={from} description="Pickup" pinColor={GREEN} />
        <Marker coordinate={route.destination} title={to} description="Destination" />
        {liveLocation ? (
          <Marker
            coordinate={{ latitude: liveLocation.latitude, longitude: liveLocation.longitude }}
            title={liveLocation.isFresh === false ? "Driver location" : "Driver live location"}
            description={liveLocation.isFresh === false ? "Last known position" : "Updating live"}>
            <View style={[styles.driverMarker, liveLocation.isFresh === false && styles.driverMarkerStale]}>
              <Text style={styles.driverMarkerText}>🚗</Text>
            </View>
          </Marker>
        ) : null}
        <Polyline
          coordinates={route.path}
          strokeColor="#087F5B"
          strokeWidth={4}
          lineJoin="round"
          lineCap="round"
        />
      </MapView>

      <View style={styles.routeBadge}>
        <Text style={styles.routeText} numberOfLines={1}>
          {from} → {to}
        </Text>
        <Text style={styles.meta}>
          {route.distanceKm.toFixed(route.distanceKm < 10 ? 1 : 0)} km · {formatDuration(route.durationMinutes)}
        </Text>
      </View>
    </View>
  );
}

export function RouteMapFallback({
  from,
  to,
  message,
  height = 150,
}: {
  from: string;
  to: string;
  message?: string;
  height?: number;
}) {
  return (
    <View style={[styles.fallback, { height }]}>
      <Text style={styles.fallbackRoute}>{from} → {to}</Text>
      <Text style={styles.fallbackText}>{message ?? 'Map route unavailable'}</Text>
    </View>
  );
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours <= 0) return `${remaining} min`;
  if (remaining === 0) return `${hours} hr`;
  return `${hours} hr ${remaining} min`;
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderRadius: 9,
    backgroundColor: '#EAF2ED',
  },
  routeBadge: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  routeText: {
    color: TEXT,
    fontSize: 8,
    fontWeight: '900',
  },
  meta: {
    color: MUTED,
    fontSize: 6.8,
    marginTop: 2,
  },
  driverMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverMarkerStale: {
    borderColor: '#98A2B3',
    opacity: 0.72,
  },
  driverMarkerText: {
    fontSize: 16,
  },
  fallback: {
    borderRadius: 9,
    backgroundColor: '#EEF4F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  fallbackRoute: {
    color: TEXT,
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },
  fallbackText: {
    color: MUTED,
    fontSize: 7.2,
    marginTop: 4,
    textAlign: 'center',
  },
});
