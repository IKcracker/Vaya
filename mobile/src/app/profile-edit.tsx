import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  removePassengerProfileImage,
  updatePassengerProfile,
  uploadPassengerProfileImage,
} from '@/lib/auth';
import { API_URL } from '@/lib/api';
import { pickProfileImage } from '@/lib/profile-image';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#10B981';
const BG = '#F6F8F7';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { session, passenger, refresh } = usePassengerAuth();
  const [name, setName] = useState(passenger?.name ?? '');
  const [phone, setPhone] = useState(passenger?.phone ?? '');
  const [city, setCity] = useState(passenger?.city ?? '');
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length >= 2 && city.trim().length >= 2;
  const profileImageSource =
    photoPreview
      ? { uri: photoPreview }
      : passenger?.profileImageUrl && session
        ? {
            uri: `${API_URL}${passenger.profileImageUrl}`,
            headers: { 'x-vaya-session': session },
          }
        : null;

  async function changePhoto() {
    if (!session || photoBusy) return;

    setPhotoBusy(true);
    setError(null);

    try {
      const selected = await pickProfileImage();
      if (!selected) return;

      setPhotoPreview(selected.uri);
      await uploadPassengerProfileImage(session, {
        contentType: selected.contentType,
        fileData: selected.fileData,
      });
      await refresh();
    } catch (reason) {
      setPhotoPreview(null);
      setError(reason instanceof Error ? reason.message : 'Unable to update profile photo');
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    if (!session || photoBusy || !passenger?.profileImageUrl) return;

    setPhotoBusy(true);
    setError(null);

    try {
      await removePassengerProfileImage(session);
      setPhotoPreview(null);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to remove profile photo');
    } finally {
      setPhotoBusy(false);
    }
  }

  async function save() {
    if (!session || !valid || saving) return;

    setSaving(true);
    setError(null);

    try {
      await updatePassengerProfile(session, {
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
      });
      await refresh();
      router.back();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.eyebrow}>PROFILE</Text>
            <Text style={styles.title}>Personal details</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Account email</Text>
          <Text style={styles.noticeText}>
            {passenger?.email ?? 'Your signed-in email'} is managed by your Vaya login and cannot be changed here.
          </Text>
        </View>

        <View style={styles.photoCard}>
          <View style={styles.photo}>
            {profileImageSource ? (
              <Image source={profileImageSource} style={styles.photoImage} contentFit="cover" />
            ) : (
              <Text style={styles.photoInitials}>
                {(name || passenger?.name || 'Vaya User')
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((value) => value[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.photoDetails}>
            <Text style={styles.photoTitle}>Profile photo</Text>
            <Text style={styles.photoText}>
              This photo is used across your passenger account and driver profile.
            </Text>
            <View style={styles.photoActions}>
              <Pressable
                disabled={photoBusy}
                onPress={() => void changePhoto()}
                style={({ pressed }) => [
                  styles.photoButton,
                  pressed && !photoBusy && styles.pressed,
                  photoBusy && styles.disabled,
                ]}>
                {photoBusy ? (
                  <ActivityIndicator size="small" color={BLUE} />
                ) : (
                  <Text style={styles.photoButtonText}>
                    {passenger?.profileImageUrl ? 'Change photo' : 'Upload photo'}
                  </Text>
                )}
              </Pressable>
              {passenger?.profileImageUrl ? (
                <Pressable
                  disabled={photoBusy}
                  onPress={() => void removePhoto()}
                  style={({ pressed }) => [
                    styles.removePhotoButton,
                    pressed && !photoBusy && styles.pressed,
                    photoBusy && styles.disabled,
                  ]}>
                  <Text style={styles.removePhotoText}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Field label="Full name">
            <TextInput
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#98A2B3"
            />
          </Field>

          <Field label="Phone number">
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
              placeholder="e.g. 071 234 5678"
              placeholderTextColor="#98A2B3"
            />
          </Field>

          <Field label="Home city">
            <TextInput
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
              style={styles.input}
              placeholder="Johannesburg"
              placeholderTextColor="#98A2B3"
            />
          </Field>
        </View>

        {error ? (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          disabled={!valid || saving}
          onPress={() => void save()}
          style={[styles.primary, (!valid || saving) && styles.disabled]}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>Save changes</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { padding: 18, paddingBottom: 40 },
  pressed: { opacity: 0.72 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  back: { width: 40, height: 40, borderRadius: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  backText: { color: TEXT, fontSize: 30, lineHeight: 30, marginTop: -3 },
  eyebrow: { color: BLUE, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 22, fontWeight: '900', marginTop: 3 },
  notice: { backgroundColor: '#E9F9F3', borderRadius: 14, padding: 14, marginBottom: 14 },
  noticeTitle: { color: TEXT, fontSize: 10, fontWeight: '900' },
  noticeText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
  photoCard: { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 16, padding: 15, marginBottom: 14 },
  photo: { width: 76, height: 76, borderRadius: 38, overflow: 'hidden', backgroundColor: '#E9F9F3', alignItems: 'center', justifyContent: 'center' },
  photoImage: { width: '100%', height: '100%' },
  photoInitials: { color: BLUE, fontSize: 21, fontWeight: '900' },
  photoDetails: { flex: 1 },
  photoTitle: { color: TEXT, fontSize: 13, fontWeight: '900' },
  photoText: { color: MUTED, fontSize: 9, lineHeight: 15, marginTop: 4 },
  photoActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  photoButton: { minHeight: 38, paddingHorizontal: 13, borderRadius: 10, borderWidth: 1, borderColor: '#B7EAD6', backgroundColor: '#F5F9FF', alignItems: 'center', justifyContent: 'center' },
  photoButtonText: { color: BLUE, fontSize: 10, fontWeight: '900' },
  removePhotoButton: { minHeight: 38, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF8F7', alignItems: 'center', justifyContent: 'center' },
  removePhotoText: { color: '#B42318', fontSize: 10, fontWeight: '900' },
  card: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 16, padding: 15, gap: 16 },
  field: { gap: 6 },
  label: { color: MUTED, fontSize: 9, fontWeight: '800' },
  input: { minHeight: 46, borderWidth: 1, borderColor: LINE, borderRadius: 11, backgroundColor: '#F9FAFB', color: TEXT, paddingHorizontal: 12, fontSize: 13, fontWeight: '700' },
  error: { marginTop: 14, borderRadius: 12, backgroundColor: '#FFF1F0', padding: 12 },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16 },
  primary: { marginTop: 18, height: 50, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.45 },
});
