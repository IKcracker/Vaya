import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DriverDocumentKind,
  submitDriverApplication,
  uploadDriverDocument,
} from '@/lib/auth';
import {
  DRIVER_DOCUMENT_REQUIREMENTS,
  formatFileSize,
  pickDriverDocument,
  PickedDriverDocument,
} from '@/lib/driver-documents';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#1877F2';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

export default function DriverApplicationScreen() {
  const router = useRouter();
  const { loading, session, passenger, user } = usePassengerAuth();
  const [name, setName] = useState(passenger?.name || user?.name || '');
  const [phone, setPhone] = useState(passenger?.phone || '');
  const [location, setLocation] = useState(passenger?.city || '');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleRegistration, setVehicleRegistration] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [documents, setDocuments] = useState<
    Partial<Record<DriverDocumentKind, PickedDriverDocument>>
  >({});
  const [picking, setPicking] = useState<DriverDocumentKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationSaved, setApplicationSaved] = useState(false);
  const [uploaded, setUploaded] = useState<DriverDocumentKind[]>([]);
  const [uploadLabel, setUploadLabel] = useState('Saving application…');
  const [consent, setConsent] = useState(false);

  const year = Number(vehicleYear);
  const requiredDocumentsReady = useMemo(
    () =>
      DRIVER_DOCUMENT_REQUIREMENTS.filter((item) => item.required).every(
        (item) => Boolean(documents[item.kind])
      ),
    [documents]
  );

  const valid =
    name.trim().length >= 2 &&
    location.trim().length >= 2 &&
    vehicleMake.trim().length >= 2 &&
    vehicleModel.trim().length >= 1 &&
    vehicleRegistration.trim().length >= 2 &&
    vehicleColor.trim().length >= 2 &&
    Number.isInteger(year) &&
    year >= 1980 &&
    year <= 2100 &&
    requiredDocumentsReady && consent;

  async function chooseDocument(kind: DriverDocumentKind) {
    if (submitting || picking) return;
    setPicking(kind);
    setError(null);

    try {
      const picked = await pickDriverDocument(kind);
      if (picked) {
        setDocuments((current) => ({ ...current, [kind]: picked }));
        setUploaded((current) => current.filter((item) => item !== kind));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to select document');
    } finally {
      setPicking(null);
    }
  }

  async function submit() {
    if (!session || !valid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      if (!applicationSaved) {
        setUploadLabel('Saving application…');
        await submitDriverApplication(session, {
        name: name.trim(),
        phone: phone.trim(),
        location: location.trim(),
        vehicleMake: vehicleMake.trim(),
        vehicleModel: vehicleModel.trim(),
        vehicleYear: year,
        vehicleRegistration: vehicleRegistration.trim().toUpperCase(),
        vehicleColor: vehicleColor.trim(),
        });
        setApplicationSaved(true);
      }

      for (const requirement of DRIVER_DOCUMENT_REQUIREMENTS) {
        const document = documents[requirement.kind];
        if (!document || uploaded.includes(document.kind)) continue;
        setUploadLabel(`Uploading ${requirement.label.toLowerCase()}…`);

        await uploadDriverDocument(session, {
          kind: document.kind,
          fileName: document.fileName,
          contentType: document.contentType,
          fileData: document.fileData,
        });
        setUploaded((current) => [...current.filter((kind) => kind !== document.kind), document.kind]);
      }

      router.replace({ pathname: '/driver-verification', params: { refresh: String(Date.now()) } });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to submit driver application'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={BLUE} />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.stateTitle}>Sign in to become a driver</Text>
          <Text style={styles.stateText}>
            Driver verification is linked to your Vaya account.
          </Text>
          <Pressable
            onPress={() =>
              router.replace({
                pathname: '/auth',
                params: { next: '/driver-application' },
              })
            }
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>DRIVER VERIFICATION</Text>
            <Text style={styles.title}>Apply to drive with Vaya</Text>
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={styles.introTitle}>Safety first, before the first trip.</Text>
          <Text style={styles.introText}>
            Complete your profile and attach the documents Vaya Operations needs
            to verify you and your vehicle. Required documents must be approved
            before driver access can be activated.
          </Text>
        </View>

        <SectionTitle title="Driver details" />
        <View style={styles.card}>
          <Field label="Full name">
            <TextInput editable={!submitting && !applicationSaved} value={name} onChangeText={setName} autoCapitalize="words" style={styles.input} />
          </Field>
          <Field label="Phone">
            <TextInput editable={!submitting && !applicationSaved} value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} placeholder="e.g. 071 234 5678" placeholderTextColor="#98A2B3" />
          </Field>
          <Field label="Operating area">
            <TextInput editable={!submitting && !applicationSaved} value={location} onChangeText={setLocation} autoCapitalize="words" style={styles.input} placeholder="Johannesburg" placeholderTextColor="#98A2B3" />
          </Field>
        </View>

        <SectionTitle title="Vehicle" />
        <View style={styles.card}>
          <Field label="Make">
            <TextInput editable={!submitting && !applicationSaved} value={vehicleMake} onChangeText={setVehicleMake} autoCapitalize="words" style={styles.input} placeholder="Toyota" placeholderTextColor="#98A2B3" />
          </Field>
          <Field label="Model">
            <TextInput editable={!submitting && !applicationSaved} value={vehicleModel} onChangeText={setVehicleModel} autoCapitalize="words" style={styles.input} placeholder="Corolla" placeholderTextColor="#98A2B3" />
          </Field>
          <Field label="Year">
            <TextInput editable={!submitting && !applicationSaved} value={vehicleYear} onChangeText={setVehicleYear} keyboardType="number-pad" maxLength={4} style={styles.input} placeholder="2022" placeholderTextColor="#98A2B3" />
          </Field>
          <Field label="Registration number">
            <TextInput editable={!submitting && !applicationSaved} value={vehicleRegistration} onChangeText={setVehicleRegistration} autoCapitalize="characters" style={styles.input} placeholder="AB 12 CD GP" placeholderTextColor="#98A2B3" />
          </Field>
          <Field label="Vehicle colour">
            <TextInput editable={!submitting && !applicationSaved} value={vehicleColor} onChangeText={setVehicleColor} autoCapitalize="words" style={styles.input} placeholder="White" placeholderTextColor="#98A2B3" />
          </Field>
        </View>

        <SectionTitle title="Verification documents" subtitle="PDF, JPG, PNG or WEBP · max 3 MB each" />
        <View style={styles.documentProgress}><Text style={styles.reviewTitle}>{DRIVER_DOCUMENT_REQUIREMENTS.filter((item) => item.required && documents[item.kind]).length} of 4 required documents selected</Text><Text style={styles.reviewText}>Choose clear, complete copies. Staff compare the details with your profile and vehicle.</Text></View>
        <View style={styles.documentsCard}>
          {DRIVER_DOCUMENT_REQUIREMENTS.map((item, index) => {
            const selected = documents[item.kind];
            const isPicking = picking === item.kind;

            return (
              <View
                key={item.kind}
                style={[
                  styles.documentRow,
                  index < DRIVER_DOCUMENT_REQUIREMENTS.length - 1 && styles.documentBorder,
                ]}>
                <View style={styles.documentTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.documentTitleRow}>
                      <Text style={styles.documentTitle}>{item.label}</Text>
                      <Text style={item.required ? styles.required : styles.optional}>
                        {item.required ? 'Required' : 'Optional'}
                      </Text>
                    </View>
                    <Text style={styles.documentDescription}>{item.description}</Text>
                  </View>
                </View>

                {selected ? (
                  <View>
                  {selected.contentType.startsWith('image/') ? <Image source={{ uri: selected.uri }} accessibilityLabel={`${item.label} preview`} style={styles.preview} resizeMode="contain" /> : null}
                  <View style={styles.selectedFile}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedName} numberOfLines={1}>{selected.fileName}</Text>
                      <Text style={styles.selectedMeta}>{formatFileSize(selected.sizeBytes)} · {uploaded.includes(item.kind) ? 'Uploaded' : 'Ready to upload'}</Text>
                    </View>
                    <Pressable
                      disabled={submitting || Boolean(picking)}
                      onPress={() => void chooseDocument(item.kind)}
                      style={({ pressed }) => [styles.replaceButton, pressed && styles.pressed]}>
                      <Text style={styles.replaceText}>Replace</Text>
                    </Pressable>
                  </View>
                  </View>
                ) : (
                  <Pressable
                    disabled={submitting || Boolean(picking)}
                    onPress={() => void chooseDocument(item.kind)}
                    style={({ pressed }) => [styles.uploadButton, pressed && styles.pressed]}>
                    {isPicking ? <ActivityIndicator size="small" color={BLUE} /> : <Text style={styles.uploadText}>Choose document</Text>}
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        {error ? (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
            {applicationSaved ? <Pressable onPress={() => router.replace('/driver-verification')}><Text style={styles.uploadText}>Continue from my saved application →</Text></Pressable> : null}
          </View>
        ) : null}

        <View style={styles.reviewNote}>
          <Text style={styles.reviewTitle}>How approval works</Text>
          <Text style={styles.reviewText}>
            Every required document is reviewed individually. If a document is
            rejected or needs more information, Vaya will show the reason and you
            can replace only that document.
          </Text>
        </View>

        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent }} disabled={submitting} onPress={() => setConsent((value) => !value)} style={styles.consent}>
          <Text style={styles.check}>{consent ? '✓' : '○'}</Text><Text style={styles.consentText}>These documents belong to me and this vehicle. I understand Vaya staff must review them before I can publish trips.</Text>
        </Pressable>

        <Pressable
          disabled={!valid || submitting || Boolean(picking)}
          onPress={() => void submit()}
          style={({ pressed }) => [
            styles.primary,
            (!valid || submitting) && styles.primaryDisabled,
            pressed && valid && !submitting && styles.pressed,
          ]}>
          {submitting ? (
            <View style={styles.submittingRow}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.primaryText}>{uploadLabel}</Text>
            </View>
          ) : (
            <Text style={styles.primaryText}>Submit verification</Text>
          )}
        </Pressable>

        {!requiredDocumentsReady ? (
          <Text style={styles.helperText}>
            Add all four required documents to continue.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
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
  documentProgress: { backgroundColor: '#EEF5FF', padding: 14, borderRadius: 14, marginBottom: 12 },
  preview: { width: '100%', height: 150, borderRadius: 12, marginTop: 12, backgroundColor: '#F2F4F7' },
  consent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 18, padding: 14, borderWidth: 1, borderColor: LINE, borderRadius: 14, backgroundColor: SURFACE },
  check: { color: BLUE, fontSize: 22 },
  consentText: { flex: 1, color: TEXT, fontSize: 12, lineHeight: 19 },
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 44 },
  pressed: { opacity: 0.72 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  stateTitle: { color: TEXT, fontSize: 18, fontWeight: '900' },
  stateText: { color: MUTED, fontSize: 11, lineHeight: 18, textAlign: 'center', marginTop: 6 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 40, height: 40, borderRadius: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  backText: { color: TEXT, fontSize: 30, lineHeight: 30, marginTop: -3 },
  eyebrow: { color: BLUE, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 21, fontWeight: '900', marginTop: 3 },
  intro: { marginTop: 22, backgroundColor: '#0B1730', borderRadius: 18, padding: 17 },
  introTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  introText: { color: '#A9B6CA', fontSize: 10, lineHeight: 17, marginTop: 5 },
  sectionHeading: { marginTop: 24, marginBottom: 9 },
  sectionTitle: { color: TEXT, fontSize: 17, fontWeight: '900' },
  sectionSubtitle: { color: MUTED, fontSize: 9, marginTop: 3 },
  card: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 16, padding: 15, gap: 14 },
  field: { gap: 6 },
  label: { color: MUTED, fontSize: 9, fontWeight: '800' },
  input: { minHeight: 44, borderWidth: 1, borderColor: LINE, borderRadius: 11, backgroundColor: '#F9FAFB', color: TEXT, paddingHorizontal: 12, fontSize: 13, fontWeight: '700' },
  documentsCard: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 16, overflow: 'hidden' },
  documentRow: { padding: 14 },
  documentBorder: { borderBottomWidth: 1, borderBottomColor: LINE },
  documentTop: { flexDirection: 'row', gap: 10 },
  documentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  documentTitle: { color: TEXT, fontSize: 12, fontWeight: '900' },
  required: { color: '#B42318', backgroundColor: '#FFF1F0', fontSize: 8, fontWeight: '900', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  optional: { color: MUTED, backgroundColor: '#F2F4F7', fontSize: 8, fontWeight: '900', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  documentDescription: { color: MUTED, fontSize: 9, lineHeight: 15, marginTop: 5 },
  uploadButton: { height: 40, marginTop: 11, borderWidth: 1, borderColor: '#B2CCFF', backgroundColor: '#F5F9FF', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  uploadText: { color: BLUE, fontSize: 10, fontWeight: '900' },
  selectedFile: { marginTop: 11, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10 },
  selectedName: { color: TEXT, fontSize: 10, fontWeight: '900' },
  selectedMeta: { color: '#027A48', fontSize: 8, fontWeight: '700', marginTop: 3 },
  replaceButton: { borderWidth: 1, borderColor: LINE, backgroundColor: SURFACE, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  replaceText: { color: BLUE, fontSize: 9, fontWeight: '900' },
  error: { marginTop: 14, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF8F7', borderRadius: 12, padding: 12 },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16 },
  reviewNote: { marginTop: 16, borderRadius: 14, backgroundColor: '#EEF5FF', padding: 14 },
  reviewTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  reviewText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
  primary: { marginTop: 18, minHeight: 50, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryDisabled: { opacity: 0.45 },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  submittingRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  helperText: { textAlign: 'center', color: MUTED, fontSize: 9, marginTop: 8 },
});
