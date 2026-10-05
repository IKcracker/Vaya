import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
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
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refreshKey = typeof params.refresh === 'string' ? params.refresh : '';

  async function refreshDriver() {
    if (!session) return;
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetchMobileDriver(session);
      setDriver(response.driver);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load verification');
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!session) return;

    let active = true;

    fetchMobileDriver(session)
      .then((response) => {
        if (!active) return;
        setDriver(response.driver);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'Unable to load verification');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey, session]);

  const documents = useMemo(
    () => new Map(driver?.verification?.documents.map((item) => [item.kind, item]) ?? []),
    [driver?.verification?.documents]
  );

  async function replace(kind: DriverDocumentKind) {
    if (!session || uploading) return;
    setUploading(kind);
    setError(null);
    setNotice(null);

    try {
      const selected = await pickDriverDocument(kind);
      if (!selected) return;

      const result = await uploadDriverDocument(session, {
        kind,
        fileName: selected.fileName,
        contentType: selected.contentType,
        fileData: selected.fileData,
      });

      setDriver((current) => current ? { ...current, verification: result.verification, status: result.verification.status, checks: result.verification.checks } : current);
      setNotice('Document uploaded. Vaya staff will review this new copy.');
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
          <Pressable style={styles.primary} onPress={() => router.replace({ pathname: '/auth', params: { next: '/driver-verification' } })}><Text style={styles.primaryText}>Sign in</Text></Pressable>
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
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  const approved = driver.status === 'Approved' && verification?.readyToApprove;
  const needsAction = Boolean(verification?.missingKinds.length || verification?.needsAttentionKinds.length);
  const nextAction = approved ? 'You’re ready to drive' : needsAction ? 'Complete your checklist' : verification?.readyToApprove ? 'Final approval pending' : 'Your documents are in review';
  const explanation = approved ? 'Your required documents and driver application have been approved.' : needsAction ? 'Upload missing documents and replace any copies flagged by Vaya staff.' : 'Vaya staff review every required document before enabling trip publishing. Pull down to check for updates.';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refreshDriver()} tintColor={BLUE} />}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>DRIVER VERIFICATION</Text>
            <Text style={styles.title}>Verification centre</Text>
          </View>
        </View>

        <View style={styles.summary}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>{driver.status.toUpperCase()}</Text>
            <Text style={styles.summaryValue}>{nextAction}</Text>
            <Text style={styles.summaryMeta}>{progress}</Text>
          </View>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryBadgeText}>
              {verification?.uploadedRequiredCount ?? 0}/{verification?.requiredCount ?? 4} uploaded
            </Text>
          </View>
        </View>

        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(verification?.approvedRequiredCount ?? 0) / (verification?.requiredCount || 4) * 100}%` }]} /></View>
        <Text style={styles.explanation}>{explanation}</Text>
        <View style={styles.metrics}>{[{ label: 'Uploaded', count: verification?.uploadedRequiredCount ?? 0 }, { label: 'Approved', count: verification?.approvedRequiredCount ?? 0 }, { label: 'Needs attention', count: (verification?.missingKinds.length ?? 0) + (verification?.needsAttentionKinds.length ?? 0) }].map((item) => <View key={item.label} style={styles.metric}><Text style={styles.metricValue}>{item.count}</Text><Text style={styles.metricLabel}>{item.label}</Text></View>)}</View>
        {notice ? <View style={styles.approvedStrip}><Text style={styles.approvedText}>{notice}</Text></View> : null}

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
                    <Text style={styles.requirement}>{requirement.required ? 'Required for approval' : 'Optional'}</Text>
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
                      <Text style={styles.fileMeta}>{formatFileSize(document.sizeBytes)} · Uploaded {new Date(document.uploadedAt).toLocaleDateString()}</Text>
                      {document.reviewedAt ? <Text style={styles.fileMeta}>Reviewed {new Date(document.reviewedAt).toLocaleDateString()}</Text> : null}
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
          <Text style={styles.helpTitle}>Clear copies make review easier</Text>
          <Text style={styles.helpText}>
            Keep the full document visible, including names, dates and vehicle details. Use a PDF, JPG, PNG or WEBP up to 3 MB. Replacements return to review; staff notes explain any corrections needed.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  progressTrack: { height: 6, backgroundColor: '#E4E7EC', borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: BLUE, borderRadius: 8 },
  explanation: { color: MUTED, fontSize: 13, lineHeight: 21, marginTop: 12, marginBottom: 18 },
  metrics: { flexDirection: 'row', gap: 9, marginBottom: 20 },
  metric: { flex: 1, padding: 14, backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1, borderColor: LINE },
  metricValue: { fontSize: 24, fontWeight: '800', color: TEXT },
  metricLabel: { fontSize: 10, color: MUTED, marginTop: 4 },
  requirement: { fontSize: 10, color: BLUE, marginTop: 4, fontWeight: '700' },
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
  list: { gap: 12, marginTop: 12 },
  row: { padding: 18, borderRadius: 16, backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE },
  rowBorder: {},
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  docTitle: { color: TEXT, fontSize: 15, fontWeight: '800' },
  docDescription: { color: MUTED, fontSize: 12, lineHeight: 18, marginTop: 6 },
  status: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { fontSize: 10, fontWeight: '800' },
  fileBox: { marginTop: 10, flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10 },
  fileName: { color: TEXT, fontSize: 12, fontWeight: '700' },
  fileMeta: { color: MUTED, fontSize: 10, marginTop: 4 },
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
