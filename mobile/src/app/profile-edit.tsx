import { Design } from "@/constants/design";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  removePassengerProfileImage,
  updatePassengerProfile,
  uploadPassengerProfileImage,
} from "@/lib/auth";
import { API_URL } from "@/lib/api";
import { pickProfileImage } from "@/lib/profile-image";
import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const BLUE = Design.color.primary;
const BG = Design.color.background;
const SURFACE = "#FFFFFF";
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

export default function ProfileEditScreen() {
  const router = useRouter();
  const { session, passenger, refresh } = usePassengerAuth();
  const [name, setName] = useState(passenger?.name ?? "");
  const [phone, setPhone] = useState(passenger?.phone ?? "");
  const [city, setCity] = useState(passenger?.city ?? "");
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim().length >= 2 && city.trim().length >= 2;
  const profileImageSource = photoPreview
    ? { uri: photoPreview }
    : passenger?.profileImageUrl && session
      ? {
          uri: `${API_URL}${passenger.profileImageUrl}`,
          headers: { "x-vaya-session": session },
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
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to update profile photo",
      );
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
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to remove profile photo",
      );
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
      setError(
        reason instanceof Error ? reason.message : "Unable to update profile",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.back}
          >
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
            {passenger?.email ?? "Your signed-in email"} is managed by your Vaya
            login and cannot be changed here.
          </Text>
        </View>

        <View style={styles.photoCard}>
          <View style={styles.photo}>
            {profileImageSource ? (
              <Image
                source={profileImageSource}
                style={styles.photoImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.photoInitials}>
                {(name || passenger?.name || "Vaya User")
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((value) => value[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.photoDetails}>
            <Text style={styles.photoTitle}>Profile photo</Text>
            <Text style={styles.photoText}>
              This photo is used across your passenger account and driver
              profile.
            </Text>
            <View style={styles.photoActions}>
              <Pressable
                accessibilityRole="button"
                disabled={photoBusy}
                onPress={() => void changePhoto()}
                style={({ pressed }) => [
                  styles.photoButton,
                  pressed && !photoBusy && styles.pressed,
                  photoBusy && styles.disabled,
                ]}
              >
                {photoBusy ? (
                  <ActivityIndicator size="small" color={BLUE} />
                ) : (
                  <Text style={styles.photoButtonText}>
                    {passenger?.profileImageUrl
                      ? "Change photo"
                      : "Upload photo"}
                  </Text>
                )}
              </Pressable>
              {passenger?.profileImageUrl ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={photoBusy}
                  onPress={() => void removePhoto()}
                  style={({ pressed }) => [
                    styles.removePhotoButton,
                    pressed && !photoBusy && styles.pressed,
                    photoBusy && styles.disabled,
                  ]}
                >
                  <Text style={styles.removePhotoText}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Field label="Full name">
            <TextInput
              accessibilityLabel="Full name"
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
              accessibilityLabel="e.g. 071 234 5678"
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
              accessibilityLabel="Johannesburg"
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
          accessibilityRole="button"
          disabled={!valid || saving}
          onPress={() => void save()}
          style={[styles.primary, (!valid || saving) && styles.disabled]}
        >
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: {
    padding: 24,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  pressed: { opacity: 0.72 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    minHeight: 48,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: TEXT,
    fontSize: 30,
    lineHeight: 44,
    marginTop: -3,
    flexShrink: 1,
  },
  eyebrow: {
    color: BLUE,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.1,
    flexShrink: 1,
  },
  title: {
    color: TEXT,
    fontSize: 26,
    fontWeight: "600",
    marginTop: 3,
    flexShrink: 1,
  },
  notice: {
    backgroundColor: Design.color.primarySoft,
    borderRadius: Design.radius.card,
    padding: 16,
    marginBottom: 14,
  },
  noticeTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  noticeText: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
    flexShrink: 1,
  },
  photoCard: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    padding: 16,
    marginBottom: 14,
  },
  photo: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: "hidden",
    backgroundColor: Design.color.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  photoImage: { width: "100%", height: "100%" },
  photoInitials: {
    color: BLUE,
    fontSize: 21,
    fontWeight: "600",
    flexShrink: 1,
  },
  photoDetails: { flex: 1 },
  photoTitle: { color: TEXT, fontSize: 18, fontWeight: "600", flexShrink: 1 },
  photoText: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
    flexShrink: 1,
  },
  photoActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  photoButton: {
    minHeight: 52,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#B7EAD6",
    backgroundColor: "#F5F9FF",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  photoButtonText: {
    color: BLUE,
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  removePhotoButton: {
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFF8F7",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  removePhotoText: {
    color: "#B42318",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  card: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: Design.radius.card,
    padding: 16,
    gap: 16,
  },
  field: { gap: 6 },
  label: { color: MUTED, fontSize: 12, fontWeight: "600", flexShrink: 1 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 11,
    backgroundColor: "#F9FAFB",
    color: TEXT,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
    paddingVertical: 10,
  },
  error: {
    marginTop: 14,
    borderRadius: Design.radius.card,
    backgroundColor: "#FFF1F0",
    padding: 16,
  },
  errorText: { color: "#B42318", fontSize: 14, lineHeight: 21, flexShrink: 1 },
  primary: {
    marginTop: 18,
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  disabled: { opacity: 0.45 },
});
