import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMobilePrivacyPreferences, MobilePrivacyPreferences, updateMobilePrivacyPreferences } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN='#10B981'; const BG='#F7F9F8'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

export default function PrivacySecurityScreen(){
 const router=useRouter(); const {session}=usePassengerAuth();
 const [prefs,setPrefs]=useState<MobilePrivacyPreferences|null>(null); const [loading,setLoading]=useState(Boolean(session)); const [saving,setSaving]=useState(false); const [error,setError]=useState<string|null>(null);

 useEffect(()=>{if(!session)return;let active=true;fetchMobilePrivacyPreferences(session).then(r=>{if(active)setPrefs(r.preferences)}).catch((reason:unknown)=>{if(active)setError(reason instanceof Error?reason.message:'Unable to load privacy settings')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[session]);

 async function update(key:keyof MobilePrivacyPreferences,value:boolean){
   if(!session||!prefs||saving)return; const previous=prefs; const next={...prefs,[key]:value}; setPrefs(next); setSaving(true); setError(null);
   try{const response=await updateMobilePrivacyPreferences(session,{[key]:value});setPrefs(response.preferences)}catch(reason){setPrefs(previous);setError(reason instanceof Error?reason.message:'Unable to save privacy settings')}finally{setSaving(false)}
 }

 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page}>
  <Header title="Privacy & Security" onBack={()=>router.back()}/>
  {loading?<View style={styles.state}><ActivityIndicator color={GREEN}/></View>:prefs?<>
    <Text style={styles.section}>PRIVACY</Text><View style={styles.card}>
      <ToggleRow title="Profile Visibility" note="Show my profile to users connected by a trip" value={prefs.profileVisible} onValueChange={(v)=>void update('profileVisible',v)}/>
      <ToggleRow title="Share Phone Number" note="Allow sharing after a confirmed booking" value={prefs.sharePhone} onValueChange={(v)=>void update('sharePhone',v)}/>
      <ToggleRow title="Location Sharing" note="Allow trip location sharing during active journeys" value={prefs.locationSharing} onValueChange={(v)=>void update('locationSharing',v)} last/>
    </View>
    <Text style={styles.section}>SECURITY</Text><View style={styles.card}>
      <InfoRow title="Authentication" note="Secure Vaya session active on this device"/>
      <InfoRow title="Two-Factor Authentication" note="Not available yet" last/>
    </View>
    <View style={styles.notice}><Text style={styles.noticeTitle}>Security controls</Text><Text style={styles.noticeText}>Vaya does not pretend 2FA is enabled before the backend supports it. Password and account-security actions remain handled by the existing authentication service.</Text></View>
  </>:null}
  {saving?<Text style={styles.saving}>Saving…</Text>:null}{error?<View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>:null}
 </ScrollView></SafeAreaView>
}
function Header({title,onBack}:{title:string;onBack:()=>void}){return <View style={styles.header}><Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.title}>{title}</Text><View style={{width:38}}/></View>}
function ToggleRow({title,note,value,onValueChange,last}:{title:string;note:string;value:boolean;onValueChange:(value:boolean)=>void;last?:boolean}){return <View style={[styles.row,!last&&styles.border]}><View style={{flex:1}}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowNote}>{note}</Text></View><Switch value={value} onValueChange={onValueChange} trackColor={{false:'#D0D5DD',true:'#A6F4C5'}} thumbColor={value?GREEN:'#FFFFFF'}/></View>}
function InfoRow({title,note,last}:{title:string;note:string;last?:boolean}){return <View style={[styles.row,!last&&styles.border]}><View><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowNote}>{note}</Text></View></View>}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:BG},page:{padding:16,paddingBottom:40},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{width:38,height:38,borderRadius:11,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center'},backText:{color:TEXT,fontSize:29,lineHeight:29,marginTop:-3},title:{color:TEXT,fontSize:18,fontWeight:'900'},section:{color:MUTED,fontSize:8,fontWeight:'900',letterSpacing:.8,marginTop:20,marginBottom:7},card:{backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,borderRadius:15,overflow:'hidden'},row:{minHeight:62,padding:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},border:{borderBottomWidth:1,borderBottomColor:LINE},rowTitle:{color:TEXT,fontSize:10,fontWeight:'900'},rowNote:{color:MUTED,fontSize:8,marginTop:3,maxWidth:260},notice:{marginTop:18,borderRadius:13,backgroundColor:'#E9F9F3',padding:12},noticeTitle:{color:'#087F5B',fontSize:9.5,fontWeight:'900'},noticeText:{color:'#087F5B',fontSize:8,lineHeight:13,marginTop:3},saving:{color:MUTED,fontSize:8,textAlign:'center',marginTop:12},state:{minHeight:180,alignItems:'center',justifyContent:'center'},error:{marginTop:12,borderRadius:11,backgroundColor:'#FFF1F0',padding:11},errorText:{color:'#B42318',fontSize:9}});
