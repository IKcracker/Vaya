import { requestPasswordReset } from "@/lib/auth";
import { completeOnboarding } from "@/lib/onboarding-storage";
import { Design } from "@/constants/design";
import { BrandMark } from "@/components/brand-mark";
import { JourneyHero } from "@/components/journey-hero";
import { useLocalSearchParams, useRouter } from "expo-router";
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

import { usePassengerAuth } from "@/providers/passenger-auth-provider";

const GREEN = Design.color.primary;
const GREEN_DARK = "#1765F3";
const BG = Design.color.background;
const TEXT = Design.color.text;
const MUTED = Design.color.muted;
const LINE = Design.color.border;

export default function PassengerAuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const { signIn, signUp } = usePassengerAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const next =
    typeof params.next === "string" &&
    params.next.startsWith("/") &&
    !params.next.startsWith("//") &&
    !/[\\\x00-\x1f]/.test(params.next) &&
    !params.next.startsWith("/auth")
      ? params.next
      : "/";
  const valid =
    /^\S+@\S+\.\S+$/.test(email.trim()) &&
    password.length >= 8 &&
    (mode === "sign-in" ||
      (name.trim().length >= 2 &&
        city.trim().length >= 2 &&
        password === confirmPassword));

  async function submit() {
    if (!valid || submitting || resetting) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "sign-in") {
        await signIn(email.trim(), password);
      } else {
        const message = await signUp({
          name: name.trim(),
          city: city.trim(),
          email: email.trim().toLowerCase(),
          password,
        });
        if (message) {
          setMode("sign-in");
          setPassword("");
          setConfirmPassword("");
          setNotice(message);
          return;
        }
      }
      await completeOnboarding();
      router.replace(
        (mode === "sign-up" && next === "/" ? "/choose-role" : next) as never,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : mode === "sign-in"
            ? "Unable to sign in"
            : "Unable to create account",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function forgotPassword() {
    if (resetting || submitting) return;
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter your email address above first.");
      return;
    }
    setResetting(true);
    setError(null);
    setNotice(null);
    try {
      const response = await requestPasswordReset(email);
      setNotice(response.message);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to send reset email.",
      );
    } finally {
      setResetting(false);
    }
  }
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.authHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          style={styles.back}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <BrandMark />
        </View>
        <JourneyHero compact title={"Your next ride\nstarts here."} eyebrow="GO TOGETHER" />
        <View style={styles.authPanel}>
        <Text style={styles.title}>
          {mode === "sign-in" ? "Welcome back" : "Create your account"}
        </Text>
        <Text style={styles.subtitle}>
          {mode === "sign-in"
            ? "Sign in to continue to Vaya"
            : "Join Vaya and start sharing rides."}
        </Text>

        <View style={styles.form}>
          {mode === "sign-up" ? (
            <>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                accessibilityLabel="Full name"
                editable={!submitting && !resetting}
                maxLength={120}
                autoComplete="name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholder="Full name"
                placeholderTextColor="#98A2B3"
                style={styles.input}
              />
              <Text style={styles.label}>Home city</Text>
              <TextInput
                accessibilityLabel="Home city"
                editable={!submitting && !resetting}
                maxLength={120}
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
                placeholder="Home city"
                placeholderTextColor="#98A2B3"
                style={styles.input}
              />
            </>
          ) : null}
          <Text style={styles.label}>Email address</Text>
          <TextInput
            accessibilityLabel="Email address"
            editable={!submitting && !resetting}
            maxLength={254}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="Email address"
            placeholderTextColor="#98A2B3"
            style={styles.input}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            accessibilityLabel="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!submitting && !resetting}
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            placeholder="Password"
            placeholderTextColor="#98A2B3"
            style={styles.input}
          />
          {mode === "sign-up" ? (
            <>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                accessibilityLabel="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!submitting}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                style={styles.input}
              />
              <Text style={styles.subtitle}>Use at least 8 characters.</Text>
            </>
          ) : null}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                showPassword ? "Hide password" : "Show password"
              }
              onPress={() => setShowPassword((v) => !v)}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Text style={styles.footerLink}>
                {showPassword ? "Hide password" : "Show password"}
              </Text>
            </Pressable>
            {mode === "sign-in" ? (
              <Pressable
                accessibilityRole="button"
                disabled={resetting || submitting}
                onPress={() => void forgotPassword()}
                style={{ minHeight: 44, justifyContent: "center" }}
              >
                <Text style={styles.footerLink}>
                  {resetting ? "Sending…" : "Forgot password?"}
                </Text>
              </Pressable>
            ) : null}
          </View>
          {notice ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}
          {error ? (
            <View style={styles.error}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={!valid || submitting || resetting}
            onPress={() => void submit()}
            style={[
              styles.primary,
              (!valid || submitting || resetting) && styles.primaryDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>
                {mode === "sign-in" ? "Sign In" : "Create Account"}
              </Text>
            )}
          </Pressable>
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>
            {mode === "sign-in"
              ? "Don't have an account? "
              : "Already have an account? "}
          </Text>
          <Pressable
            disabled={submitting || resetting}
            accessibilityRole="button"
            onPress={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setError(null);
              setNotice(null);
              setPassword("");
              setConfirmPassword("");
            }}
          >
            <Text style={styles.footerLink}>
              {mode === "sign-in" ? "Sign up" : "Sign in"}
            </Text>
          </Pressable>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: { color: TEXT, fontSize: 13, fontWeight: "500", marginTop: 8 },
  safe: { flex: 1, backgroundColor: BG },
  page: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  authHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  authPanel: { marginTop: 18, padding: 22, borderRadius: 24, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: LINE, boxShadow: Design.shadow.card },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    borderRadius: 22,
    backgroundColor: Design.color.surface,
  },
  backText: {
    color: TEXT,
    fontSize: 26,
    lineHeight: 38,
    marginTop: -2,
    flexShrink: 1,
  },
  brandWrap: { alignItems: "flex-start", marginTop: 32 },
  brand: {
    color: TEXT,
    fontSize: 30,
    fontWeight: "700",
    marginTop: 8,
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  title: {
    color: TEXT,
    fontSize: 25,
    fontWeight: "800",
    textAlign: "left",
    marginTop: 0,
    flexShrink: 1,
  },
  subtitle: {
    color: MUTED,
    fontSize: 14,
    textAlign: "left",
    marginTop: 8,
    flexShrink: 1,
    lineHeight: 21,
  },
  form: { marginTop: 24, gap: 8 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 14,
    backgroundColor: "#F7F9FD",
    paddingHorizontal: 14,
    color: TEXT,
    fontSize: 16,
    flexShrink: 1,
    paddingVertical: 10,
  },
  primary: {
    minHeight: 55,
    borderRadius: 16,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 10,
    boxShadow: Design.shadow.button,
  },
  primaryDisabled: { opacity: 0.45 },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    flexWrap: "wrap",
    alignItems: "center",
  },
  footerText: { color: MUTED, fontSize: 14, flexShrink: 1 },
  footerLink: {
    color: GREEN_DARK,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    paddingVertical: 12,
  },
  error: {
    backgroundColor: "#FFF1F0",
    borderRadius: Design.radius.card,
    padding: 16,
  },
  errorText: { color: "#B42318", fontSize: 14, flexShrink: 1 },
  notice: {
    backgroundColor: "#ECFDF3",
    borderRadius: Design.radius.card,
    padding: 16,
  },
  noticeText: { color: "#027A48", fontSize: 14, flexShrink: 1 },
});
