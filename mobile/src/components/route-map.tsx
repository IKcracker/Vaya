import { useRef, useState, useEffect, useCallback } from "react";
import { SymbolView } from "expo-symbols";
import MapView, { Marker, Polyline } from "react-native-maps";
import { StyleSheet, Text, View, Pressable } from "react-native";

import type { RoutePreview } from "@/lib/api";

const GREEN = "#1765F3";
const TEXT = "#101828";
const MUTED = "#667085";

function regionForRoute(route: RoutePreview) {
  const latitudes = route.path.map((point) => point.latitude);
  const longitudes = route.path.map((point) => point.longitude);
  const minLatitude = Math.min(
    route.origin.latitude,
    route.destination.latitude,
    ...latitudes,
  );
  const maxLatitude = Math.max(
    route.origin.latitude,
    route.destination.latitude,
    ...latitudes,
  );
  const minLongitude = Math.min(
    route.origin.longitude,
    route.destination.longitude,
    ...longitudes,
  );
  const maxLongitude = Math.max(
    route.origin.longitude,
    route.destination.longitude,
    ...longitudes,
  );

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
  height = 420,
  edgeToEdge = false,
  liveLocation,
}: {
  route: RoutePreview;
  from: string;
  to: string;
  height?: number;
  edgeToEdge?: boolean;
  liveLocation?: {
    latitude: number;
    longitude: number;
    heading?: number | null;
    isFresh?: boolean;
  } | null;
}) {
  const region = regionForRoute(route);
  const map = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const fitRoute = useCallback(() => {
    map.current?.fitToCoordinates(
      [route.origin, ...route.path, route.destination],
      {
        edgePadding: {
          top: Math.min(edgeToEdge ? 90 : 32, height * 0.2),
          right: 40,
          bottom: Math.min(edgeToEdge ? 48 : 100, height * 0.2),
          left: 40,
        },
        animated: true,
      },
    );
  }, [route, height, edgeToEdge]);
  useEffect(() => {
    if (ready) fitRoute();
  }, [ready, fitRoute]);

  return (
    <View style={[styles.wrap, { height }, edgeToEdge && { borderRadius: 0 }]}>
      <MapView
        ref={map}
        onMapReady={() => setReady(true)}
        loadingEnabled
        loadingIndicatorColor={GREEN}
        key={`${route.origin.latitude}-${route.origin.longitude}-${route.destination.latitude}-${route.destination.longitude}`}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        initialRegion={region}
        toolbarEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Marker
          coordinate={route.origin}
          title={from}
          description="Pickup"
          pinColor={GREEN}
        />
        <Marker
          coordinate={route.destination}
          title={to}
          description="Destination"
        />
        {liveLocation ? (
          <Marker
            coordinate={{
              latitude: liveLocation.latitude,
              longitude: liveLocation.longitude,
            }}
            title={
              liveLocation.isFresh === false
                ? "Driver location"
                : "Driver live location"
            }
            description={
              liveLocation.isFresh === false
                ? "Last known position"
                : "Updating live"
            }
          >
            <View
              style={[
                styles.driverMarker,
                liveLocation.isFresh === false && styles.driverMarkerStale,
              ]}
            >
              <SymbolView
                name={{
                  ios: "car.fill",
                  android: "directions_car",
                  web: "directions_car",
                }}
                tintColor={GREEN}
                size={20}
              />
            </View>
          </Marker>
        ) : null}
        <Polyline
          coordinates={route.path}
          strokeColor="#2563EB"
          strokeWidth={4}
          lineJoin="round"
          lineCap="round"
        />
      </MapView>

      <View style={[styles.controls, { top: edgeToEdge ? 84 : 12 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show entire route"
          onPress={fitRoute}
          style={styles.control}
        >
          <SymbolView
            name={{
              ios: "arrow.up.left.and.arrow.down.right",
              android: "zoom_out_map",
              web: "zoom_out_map",
            }}
            tintColor={TEXT}
            size={20}
          />
        </Pressable>
        {liveLocation ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Centre map on driver"
            onPress={() =>
              map.current?.animateToRegion(
                {
                  latitude: liveLocation.latitude,
                  longitude: liveLocation.longitude,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.015,
                },
                350,
              )
            }
            style={styles.control}
          >
            <SymbolView
              name={{
                ios: "location.fill",
                android: "my_location",
                web: "my_location",
              }}
              tintColor={GREEN}
              size={20}
            />
          </Pressable>
        ) : null}
      </View>
      {!edgeToEdge ? (
        <View style={styles.routeBadge}>
          <Text style={styles.routeText} numberOfLines={1}>
            {from} → {to}
          </Text>
          <Text style={styles.meta}>
            {route.distanceKm.toFixed(route.distanceKm < 10 ? 1 : 0)} km ·{" "}
            {formatDuration(route.durationMinutes)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function RouteMapFallback({
  from,
  to,
  message,
  height = 420,
  edgeToEdge = false,
}: {
  from: string;
  to: string;
  message?: string;
  height?: number;
  edgeToEdge?: boolean;
}) {
  return (
    <View
      style={[styles.fallback, { height }, edgeToEdge && { borderRadius: 0 }]}
    >
      <Text style={styles.fallbackRoute}>
        {from} → {to}
      </Text>
      <Text style={styles.fallbackText}>
        {message ?? "Map route unavailable"}
      </Text>
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
  controls: { position: "absolute", right: 20, gap: 10 },
  control: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    boxShadow: "0 2px 10px #00000015",
  },
  wrap: {
    overflow: "hidden",
    borderRadius: 9,
    backgroundColor: "#E8EFFA",
  },
  routeBadge: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  routeText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "600",
  },
  meta: {
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
  },
  driverMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  driverMarkerStale: {
    borderColor: "#98A2B3",
    opacity: 0.72,
  },
  driverMarkerText: {
    fontSize: 16,
  },
  fallback: {
    borderRadius: 9,
    backgroundColor: "#EEF4F0",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
  },
  fallbackRoute: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  fallbackText: {
    color: MUTED,
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
});
