import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const GREEN = '#10B981';
const BG = '#F7F9F8';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

const threads = [
  { id: 'james', initials: 'JK', name: 'James K.', text: 'See you at the pickup point!', time: '10m', unread: true },
  { id: 'linda', initials: 'LW', name: 'Linda W.', text: 'Thanks again!', time: '1h' },
  { id: 'david', initials: 'DO', name: 'David O.', text: 'I’ve arrived', time: '3h' },
  { id: 'support', initials: 'V', name: 'Vaya Support', text: 'How can we help?', time: '1d' },
];

export default function MessagesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <Pressable onPress={() => router.push('/help-support')} style={styles.helpButton}>
            <Text style={styles.helpText}>?</Text>
          </Pressable>
        </View>

        <View style={styles.list}>
          {threads.map((thread, index) => (
            <Pressable
              key={thread.id}
              style={({ pressed }) => [
                styles.row,
                index < threads.length - 1 && styles.border,
                pressed && styles.pressed,
              ]}>
              <View style={[styles.avatar, thread.id === 'support' && styles.supportAvatar]}>
                <Text style={[styles.avatarText, thread.id === 'support' && styles.supportAvatarText]}>
                  {thread.initials}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{thread.name}</Text>
                  <Text style={styles.time}>{thread.time}</Text>
                </View>
                <Text style={[styles.preview, thread.unread && styles.previewUnread]} numberOfLines={1}>
                  {thread.text}
                </Text>
              </View>
              {thread.unread ? <View style={styles.unreadDot} /> : null}
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.compose}>
          <Text style={styles.composeText}>＋</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  page: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 120, minHeight: '100%' },
  pressed: { opacity: 0.72 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { color: TEXT, fontSize: 24, fontWeight: '900', letterSpacing: -0.4 },
  helpButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E9F9F3', alignItems: 'center', justifyContent: 'center' },
  helpText: { color: '#087F5B', fontSize: 14, fontWeight: '900' },
  list: { backgroundColor: SURFACE, borderWidth: 1, borderColor: LINE, borderRadius: 15, overflow: 'hidden' },
  row: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: LINE },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E9F9F3', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#087F5B', fontSize: 10, fontWeight: '900' },
  supportAvatar: { backgroundColor: '#063C35' },
  supportAvatarText: { color: '#FFFFFF' },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { color: TEXT, fontSize: 10.5, fontWeight: '900' },
  time: { color: '#98A2B3', fontSize: 7.5, fontWeight: '700' },
  preview: { color: MUTED, fontSize: 8.5, marginTop: 4 },
  previewUnread: { color: TEXT, fontWeight: '800' },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },
  compose: { position: 'absolute', right: 18, bottom: 28, width: 48, height: 48, borderRadius: 24, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  composeText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginTop: -2 },
});
