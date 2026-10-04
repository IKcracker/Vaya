import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DriverDocumentKind,
  fetchMobileDriver,
  MobileDriver,
  uploadDriverDocument,
} from '@/lib/auth';
import {
  DRIVER_DOCUMENT_REQUIREMENTS,
  formatFileSize,
  pickDriverDocument,
} from '@/lib/driver-documents';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const BLUE = '#1877F2';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

function tone(status: string) {
  if (status === 'Approved') return { bg: '#ECFDF3', text: '#027A48' };
  if (status === 'Rejected' || status === 'Needs info') {
    return { bg: '#FFF1F0', text: '#B42318' };
  }
  return { bg: '#FFFAEB', text: '#B54708' };
}

export default function DriverVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ refresh?: string }>();
  const { session } = usePassengerAuth();
  const [driver, setDriver] = useState<MobileDriver | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<DriverDocumentKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshKey = typeof params.refresh === 'string' ? params.refresh : '';

  async function load() {
    if (!session) return;
    setError(null);

    try {
      const response = await fetchMobileDriver(session);
      setDriver(response.driver);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load verification');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [refreshKey, session]);

  const documents = useMemo(
    () => new Map(driver?.verification?.documents.map((item) => [item.kind, item]) ?? []),
    [driver?.verification?.documents]
  );

  async function replace(kind: DriverDocumentKind) {
    if (!session || uploading) return;
    setUploading(kind);
    setError(null);

    try {
      const selected = await pickDriverDocument(kind);
      if (!selected) return;

      await uploadDriverDocument(session, {
        kind,
        fileName: selected.fileName,
        contentType: selected.contentType,
        fileData: selected.fileData,
      });

      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to upload document');
    } finally {
      setUploading(null);
    }
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>Sign in required</Text>
          <Text style={styles.muted}>Sign in to manage driver verification.</Text>
        </View>
      </SafeAreaView>
    );
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

  if (!driver) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>No driver application found</Text>
          <Pressable
            onPress={() => router.replace('/driver-application')}
            style={styles.primary}>
            <Text style={styles.primaryText}>Start application</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const verification = driver.verification;
  const progress = verification
    ? `${verification.approvedRequiredCount}/${verification.requiredCount} approved`
    : driver.checks;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>DRIVER VERIFICATION</Text>
            <Text style={styles.title}>Your documents</Text>
          </View>
        </View>

        <View style={styles.summary}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Application status</Text>
            <Text style={styles.summaryValue}>{driver.status}</Text>
            <Text style={styles.summaryMeta}>{progress}</Text>
          </View>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>
              {verification?.uploadedRequiredCount ?? 0}/{verification?.requiredCount ?? 4} uploaded
            </Text>
          </View>
        </View>

        {error ? (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.list}>
          {DRIVER_DOCUMENT_REQUIREMENTS.map((requirement, index) => {
            const document = documents.get(requirement.kind);
            const status = document?.status ?? 'Missing';
            const statusTone = tone(status);
            const busy = uploading === requirement.kind;

            return (
              <View
                key={requirement.kind}
                style={[
                  styles.row,
                  index < DRIVER_DOCUMENT_REQUIREMENTS.length - 1 && styles.rowBorder,
                ]}>
                <View style={styles.rowTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docTitle}>{requirement.label}</Text>
                    <Text style={styles.docDescription}>{requirement.description}</Text>
                  </View>
                  <View style={[styles.status, { backgroundColor: statusTone.bg }]}>
                    <Text style={[styles.statusText, { color: statusTone.text }]}>{status}</Text>
                  </View>
                </View>

                {document ? (
                  <View style={styles.fileBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fileName} numberOfLines={1}>{document.fileName}</Text>
                      <Text style={styles.fileMeta}>{formatFileSize(document.sizeBytes)}</Text>
                    </View>
                  </View>
                ) : null}

                {document?.reviewNote ? (
                  <View style={styles.note}>
                    <Text style={styles.noteTitle}>Vaya Operations note</Text>
                    <Text style={styles.noteText}>{document.reviewNote}</Text>
                  </View>
                ) : null}

                {status !== 'Approved' ? (
                  <Pressable
                    disabled={Boolean(uploading)}
                    onPress={() => void replace(requirement.kind)}
                    style={({ pressed }) => [
                      styles.uploadButton,
                      Boolean(uploading) && styles.disabled,
                      pressed && styles.pressed,
                    ]}>
                    {busy ? (
                      <ActivityIndicator size="small" color={BLUE} />
                    ) : (
                      <Text style={styles.uploadText}>
                        {document ? 'Replace document' : 'Upload document'}
                      </Text>
                    )}
                  </Pressable>
                ) : (
                  <View style={styles.approvedStrip}>
                    <Text style={styles.approvedText}>✓ Verified by Vaya Operations</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.help}>
          <Text style={styles.helpTitle}>What happens after re-uploading?</Text>
          <Text style={styles.helpText}>
            Replaced documents return to Review automatically. Your driver account
            can only be approved after all required documents are individually approved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { padding: 18, paddingBottom: 50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.5 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  back: { width: 40, height: 40, borderRadius: 12, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  backText: { color: TEXT, fontSize: 30, lineHeight: 30, marginTop: -3 },
  eyebrow: { color: BLUE, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: TEXT, fontSize: 22, fontWeight: '900', marginTop: 3, textAlign: 'left' },
  muted: { color: MUTED, fontSize: 11, lineHeight: 18, marginTop: 6, textAlign: 'center' },
  primary: { marginTop: 16, backgroundColor: BLUE, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 13 },
  primaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0B1730', borderRadius: 18, padding: 16, marginBottom: 16 },
  summaryLabel: { color: '#A9B6CA', fontSize: 9, fontWeight: '800' },
  summaryValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 3 },
  summaryMeta: { color: '#A9B6CA', fontSize: 10, marginTop: 4 },
  summaryBadge: { backgroundColor: '#15284A', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
  summaryBadgeText: { color: '#D7E6FF', fontSize: 9, fontWeight: '900' },
  error: { borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFF8F7', borderRadius: 12, padding: 12, marginBottom: 14 },
  errorText: { color: '#B42318', fontSize: 10, lineHeight: 16 },
  list: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 16, overflow: 'hidden' },
  row: { padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: LINE },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  docTitle: { color: TEXT, fontSize: 12, fontWeight: '900' },
  docDescription: { color: MUTED, fontSize: 9, lineHeight: 15, marginTop: 4 },
  status: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { fontSize: 8, fontWeight: '900' },
  fileBox: { marginTop: 10, flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10 },
  fileName: { color: TEXT, fontSize: 10, fontWeight: '900' },
  fileMeta: { color: MUTED, fontSize: 8, marginTop: 3 },
  note: { marginTop: 10, backgroundColor: '#FFF7ED', borderRadius: 10, padding: 10 },
  noteTitle: { color: '#9A3412', fontSize: 8, fontWeight: '900' },
  noteText: { color: '#7C2D12', fontSize: 9, lineHeight: 14, marginTop: 3 },
  uploadButton: { height: 40, marginTop: 10, borderWidth: 1, borderColor: '#B2CCFF', backgroundColor: '#F5F9FF', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  uploadText: { color: BLUE, fontSize: 10, fontWeight: '900' },
  approvedStrip: { marginTop: 10, backgroundColor: '#ECFDF3', borderRadius: 10, padding: 10 },
  approvedText: { color: '#027A48', fontSize: 9, fontWeight: '900' },
  help: { marginTop: 16, backgroundColor: '#EEF5FF', borderRadius: 14, padding: 14 },
  helpTitle: { color: TEXT, fontSize: 11, fontWeight: '900' },
  helpText: { color: MUTED, fontSize: 10, lineHeight: 16, marginTop: 4 },
});
