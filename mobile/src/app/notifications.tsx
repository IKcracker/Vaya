import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMobileNotifications, MobileNotification } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN='#10B981'; const BG='#F7F9F8'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

function iconFor(kind:string){if(kind==='payment')return 'R'; if(kind==='verification')return '✓'; return '🚘';}
function toneFor(kind:string){if(kind==='payment'||kind==='verification')return '#ECFDF3'; return '#FFF4E8';}
function relative(value:string){const diff=Math.max(0,Date.now()-new Date(value).getTime());const mins=Math.floor(diff/60000);if(mins<60)return mins<=1?'now':`${mins}m`;const hrs=Math.floor(mins/60);if(hrs<24)return `${hrs}h`;return `${Math.floor(hrs/24)}d`;}

export default function NotificationsScreen(){
 const router=useRouter(); const {session}=usePassengerAuth();
 const [items,setItems]=useState<MobileNotification[]>([]); const [loading,setLoading]=useState(Boolean(session)); const [tab,setTab]=useState<'all'|'recent'>('all'); const [error,setError]=useState<string|null>(null);

 useEffect(()=>{if(!session)return;let active=true;fetchMobileNotifications(session).then(r=>{if(active)setItems(r.notifications)}).catch((reason:unknown)=>{if(active)setError(reason instanceof Error?reason.message:'Unable to load notifications')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[session]);
 const visible=useMemo(()=>tab==='all'?items:items.filter(item=>Date.now()-new Date(item.createdAt).getTime()<24*60*60*1000),[items,tab]);

 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page}>
   <Header title="Notifications" onBack={()=>router.back()}/>
   <View style={styles.tabs}>
     <Pressable onPress={()=>setTab('all')} style={[styles.tab,tab==='all'&&styles.tabActive]}><Text style={[styles.tabText,tab==='all'&&styles.tabTextActive]}>All</Text></Pressable>
     <Pressable onPress={()=>setTab('recent')} style={[styles.tab,tab==='recent'&&styles.tabActive]}><Text style={[styles.tabText,tab==='recent'&&styles.tabTextActive]}>Last 24h</Text></Pressable>
   </View>
   {loading?<View style={styles.state}><ActivityIndicator color={GREEN}/></View>:error?<View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>:visible.length?<View style={styles.list}>{visible.map((item,index)=><View key={item.id} style={[styles.row,index<visible.length-1&&styles.border]}><View style={[styles.icon,{backgroundColor:toneFor(item.kind)}]}><Text style={styles.iconText}>{iconFor(item.kind)}</Text></View><View style={{flex:1}}><Text style={styles.rowTitle}>{item.title}</Text><Text style={styles.rowText}>{item.text}</Text></View><Text style={styles.time}>{relative(item.createdAt)}</Text></View>)}</View>:<View style={styles.state}><Text style={styles.emptyTitle}>No notifications yet</Text><Text style={styles.emptyText}>Trip, payment and verification updates will appear here.</Text></View>}
 </ScrollView></SafeAreaView>;
}
function Header({title,onBack}:{title:string;onBack:()=>void}){return <View style={styles.header}><Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.title}>{title}</Text><View style={{width:38}}/></View>}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:BG},page:{padding:16,paddingBottom:40},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{width:38,height:38,borderRadius:11,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center'},backText:{color:TEXT,fontSize:29,lineHeight:29,marginTop:-3},title:{color:TEXT,fontSize:18,fontWeight:'900'},tabs:{marginTop:16,flexDirection:'row',backgroundColor:'#EEF2F0',padding:3,borderRadius:10},tab:{flex:1,height:34,alignItems:'center',justifyContent:'center',borderRadius:8},tabActive:{backgroundColor:GREEN},tabText:{color:MUTED,fontSize:8.5,fontWeight:'900'},tabTextActive:{color:'#FFFFFF'},list:{marginTop:12,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,borderRadius:15,overflow:'hidden'},row:{minHeight:64,flexDirection:'row',alignItems:'center',gap:10,padding:11},border:{borderBottomWidth:1,borderBottomColor:LINE},icon:{width:34,height:34,borderRadius:10,alignItems:'center',justifyContent:'center'},iconText:{fontSize:13,fontWeight:'900'},rowTitle:{color:TEXT,fontSize:9.5,fontWeight:'900'},rowText:{color:MUTED,fontSize:8,marginTop:3},time:{color:'#98A2B3',fontSize:7},state:{minHeight:180,alignItems:'center',justifyContent:'center',padding:24},emptyTitle:{color:TEXT,fontSize:12,fontWeight:'900'},emptyText:{color:MUTED,fontSize:9,textAlign:'center',marginTop:4},error:{marginTop:12,borderRadius:11,backgroundColor:'#FFF1F0',padding:11},errorText:{color:'#B42318',fontSize:9}});
