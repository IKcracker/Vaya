import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMobileDriver, MobileDriver } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN = '#10B981';
const BG = '#F7F9F8';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

export default function DriverProfileScreen() {
  const router = useRouter();
  const { session, passenger } = usePassengerAuth();
  const [driver, setDriver] = useState<MobileDriver | null>(null);
  const [loading, setLoading] = useState(Boolean(session));

  useEffect(() => {
    if (!session) return;
    fetchMobileDriver(session)
      .then((response) => setDriver(response.driver))
      .finally(() => setLoading(false));
  }, [session]);

  if (loading) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color={GREEN} /></View></SafeAreaView>;
  }

  if (!driver || !session) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.title}>Driver profile unavailable</Text><Pressable onPress={() => router.replace('/explore')} style={styles.primary}><Text style={styles.primaryText}>Open driver mode</Text></Pressable></View></SafeAreaView>;
  }

  const imageSource = passenger?.profileImageUrl
    ? { uri: `${API_URL}${passenger.profileImageUrl}`, headers: { 'x-vaya-session': session } }
    : null;
  const vehicles = driver.vehicles ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.cover}>
          <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
          <View style={styles.avatar}>
            {imageSource ? <Image source={imageSource} style={styles.avatarImage} contentFit="cover" /> : <Text style={styles.avatarText}>{driver.initials}</Text>}
          </View>
        </View>

        <View style={styles.identity}>
          <Text style={styles.name}>{driver.name}</Text>
          <View style={styles.verifiedRow}><Text style={styles.verifiedIcon}>{driver.status === 'Approved' ? '✓' : '•'}</Text><Text style={styles.verifiedText}>{driver.status === 'Approved' ? 'Verified Driver' : driver.status}</Text></View>
          <Text style={styles.rating}>{driver.stats?.ratingAverage ? `★ ${driver.stats.ratingAverage.toFixed(1)} (${driver.stats.ratingCount} review${driver.stats.ratingCount === 1 ? '' : 's'})` : 'No ratings yet'} · {driver.stats?.yearsDriving ?? 0}+ years</Text>
        </View>

        <View style={styles.stats}>
          <Stat value={String(driver.stats?.totalTrips ?? 0)} label="Trips" />
          <Stat value={String(driver.stats?.completedTrips ?? 0)} label="Completed" />
          <Stat value={String(driver.stats?.yearsDriving ?? 0)} label="Years" />
        </View>

        <Text style={styles.sectionTitle}>Driver details</Text>
        <View style={styles.card}>
          <Text style={styles.body}>Operating area: {driver.location}</Text>
          <Text style={styles.body}>Verification: {driver.status}</Text>
          <Text style={styles.body}>Member since: {driver.stats?.memberSince ? new Intl.DateTimeFormat('en-ZA', { month: 'short', year: 'numeric' }).format(new Date(driver.stats.memberSince)) : 'Not available'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Recent reviews</Text>
        <View style={styles.card}>
          {driver.reviews?.length ? driver.reviews.map((review, index) => (
            <View key={`${review.createdAt}-${index}`} style={[styles.reviewRow, index < driver.reviews!.length - 1 && styles.reviewBorder]}>
              <Text style={styles.reviewRating}>{'★'.repeat(Math.max(1, Math.min(5, Math.round(review.rating))))}</Text>
              <Text style={styles.reviewComment}>{review.comment || 'No written comment'}</Text>
            </View>
          )) : <Text style={styles.body}>No passenger reviews yet.</Text>}
        </View>

        <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Vehicles ({vehicles.length})</Text><Pressable onPress={() => router.push('/driver-vehicle')}><Text style={styles.link}>View all</Text></Pressable></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicles}>
          {vehicles.map((vehicle) => (
            <View key={vehicle.id} style={styles.vehicleCard}>
              <View style={styles.carVisual}><Text style={styles.carVisualText}>🚙</Text></View>
              <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text>
              <Text style={styles.vehicleMeta}>{vehicle.registration}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.actions}>
          <Pressable onPress={() => router.push('/profile-edit')} style={styles.secondary}><Text style={styles.secondaryText}>Edit Profile</Text></Pressable>
          <Pressable onPress={() => router.push('/driver-rides')} style={styles.primaryFlex}><Text style={styles.primaryText}>My Rides</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: TEXT, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  cover: { height: 150, backgroundColor: '#B8D3C7', position: 'relative', alignItems: 'center', justifyContent: 'flex-end' },
  back: { position: 'absolute', left: 16, top: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: TEXT, fontSize: 28, lineHeight: 28, marginTop: -3 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 4, borderColor: '#FFFFFF', overflow: 'hidden', backgroundColor: '#E9F9F3', alignItems: 'center', justifyContent: 'center', transform: [{ translateY: 34 }] },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: '#087F5B', fontSize: 24, fontWeight: '900' },
  identity: { marginTop: 43, alignItems: 'center', paddingHorizontal: 16 },
  name: { color: TEXT, fontSize: 22, fontWeight: '900' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  verifiedIcon: { color: GREEN, fontSize: 11, fontWeight: '900' },
  verifiedText: { color: '#027A48', fontSize: 9, fontWeight: '900' },
  rating: { color: MUTED, fontSize: 9, marginTop: 5 },
  stats: { marginHorizontal: 16, marginTop: 18, flexDirection: 'row', backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 15 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  statValue: { color: TEXT, fontSize: 14, fontWeight: '900' },
  statLabel: { color: MUTED, fontSize: 8, marginTop: 3 },
  sectionTitle: { color: TEXT, fontSize: 13, fontWeight: '900', marginHorizontal: 16, marginTop: 20, marginBottom: 8 },
  card: { marginHorizontal: 16, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 14, padding: 13 },
  body: { color: MUTED, fontSize: 9, lineHeight: 15, marginBottom: 3 },
  reviewRow: { paddingVertical: 8 },
  reviewBorder: { borderBottomWidth: 1, borderBottomColor: LINE },
  reviewRating: { color: GREEN, fontSize: 10, fontWeight: '900' },
  reviewComment: { color: MUTED, fontSize: 8.5, lineHeight: 14, marginTop: 3 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { color: '#087F5B', fontSize: 8, fontWeight: '900', marginRight: 16, marginTop: 16 },
  vehicles: { paddingHorizontal: 16, gap: 9 },
  vehicleCard: { width: 120, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 13, padding: 10 },
  carVisual: { height: 54, borderRadius: 10, backgroundColor: '#F1F5F3', alignItems: 'center', justifyContent: 'center' },
  carVisualText: { fontSize: 27 },
  vehicleName: { color: TEXT, fontSize: 9, fontWeight: '900', marginTop: 8 },
  vehicleMeta: { color: MUTED, fontSize: 7.5, marginTop: 3 },
  actions: { margin: 16, flexDirection: 'row', gap: 9 },
  secondary: { flex: 1, height: 44, borderRadius: 11, backgroundColor: SURFACE, borderWidth: 1, borderColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#087F5B', fontSize: 10, fontWeight: '900' },
  primary: { marginTop: 16, height: 44, paddingHorizontal: 16, borderRadius: 11, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  primaryFlex: { flex: 1, height: 44, borderRadius: 11, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
});
