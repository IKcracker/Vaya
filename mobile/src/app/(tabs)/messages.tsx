import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMobileMessageThreads, MobileMessageThread } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN = '#10B981';
const BG = '#F7F9F8';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function relativeTime(value: string) {
  if (!value) return '';
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return minutes <= 1 ? 'now' : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { session, loading: authLoading } = usePassengerAuth();
  const [threads, setThreads] = useState<MobileMessageThread[]>([]);
  const [loading, setLoading] = useState(Boolean(session));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let active = true;
    fetchMobileMessageThreads(session)
      .then((response) => {
        if (active) setThreads(response.threads);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load messages');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [session]);

  if (authLoading || loading) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color={GREEN} /></View></SafeAreaView>;
  }

  if (!session) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.emptyTitle}>Sign in to message</Text><Text style={styles.emptyText}>Messaging is available after you share a Vaya trip with another user.</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <Pressable onPress={() => router.push('/help-support')} style={styles.helpButton}><Text style={styles.helpText}>?</Text></Pressable>
        </View>

        {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}

        {threads.length ? (
          <View style={styles.list}>
            {threads.map((thread, index) => (
              <Pressable
                key={thread.id}
                onPress={() => router.push({ pathname: '/conversation/[email]', params: { email: thread.participant.email } })}
                style={({ pressed }) => [styles.row, index < threads.length - 1 && styles.border, pressed && styles.pressed]}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{initials(thread.participant.name)}</Text></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{thread.participant.name}</Text>
                    <Text style={styles.time}>{relativeTime(thread.lastAt)}</Text>
                  </View>
                  <Text style={styles.route}>{thread.route}</Text>
                  <Text style={[styles.preview, thread.unread && styles.previewUnread]} numberOfLines={1}>{thread.lastMessage}</Text>
                </View>
                {thread.unread ? <View style={styles.unreadDot} /> : null}
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>After you book or drive a trip, the people connected to that trip will appear here.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:BG},page:{paddingHorizontal:16,paddingTop:10,paddingBottom:120,minHeight:'100%'},center:{flex:1,alignItems:'center',justifyContent:'center',padding:28},pressed:{opacity:.72},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:16},title:{color:TEXT,fontSize:24,fontWeight:'900',letterSpacing:-.4},helpButton:{width:36,height:36,borderRadius:18,backgroundColor:'#E9F9F3',alignItems:'center',justifyContent:'center'},helpText:{color:'#087F5B',fontSize:14,fontWeight:'900'},
  list:{backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,borderRadius:15,overflow:'hidden'},row:{minHeight:76,flexDirection:'row',alignItems:'center',gap:10,padding:12},border:{borderBottomWidth:1,borderBottomColor:LINE},
  avatar:{width:40,height:40,borderRadius:20,backgroundColor:'#E9F9F3',alignItems:'center',justifyContent:'center'},avatarText:{color:'#087F5B',fontSize:10,fontWeight:'900'},nameRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},name:{color:TEXT,fontSize:10.5,fontWeight:'900'},time:{color:'#98A2B3',fontSize:7.5,fontWeight:'700'},route:{color:'#087F5B',fontSize:7.5,fontWeight:'800',marginTop:3},preview:{color:MUTED,fontSize:8.5,marginTop:3},previewUnread:{color:TEXT,fontWeight:'800'},unreadDot:{width:7,height:7,borderRadius:4,backgroundColor:GREEN},
  empty:{minHeight:180,borderWidth:1,borderColor:LINE,borderRadius:15,backgroundColor:SURFACE,alignItems:'center',justifyContent:'center',padding:24},emptyTitle:{color:TEXT,fontSize:12,fontWeight:'900'},emptyText:{color:MUTED,fontSize:9,lineHeight:15,textAlign:'center',marginTop:5},error:{marginBottom:10,borderRadius:11,backgroundColor:'#FFF1F0',padding:10},errorText:{color:'#B42318',fontSize:9}
});
