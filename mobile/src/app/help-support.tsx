import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { submitSupportRequest } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN='#10B981'; const BG='#F7F9F8'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

const topics=[
 {title:'Booking a Ride',body:'Search a route, choose a verified driver, select seats and complete payment. Your booking appears in My Trips after confirmation.'},
 {title:'Becoming a Driver',body:'Create a driver profile, add at least one vehicle and complete driver and vehicle verification before publishing rides.'},
 {title:'Vehicle Verification',body:'Each vehicle is verified separately. Upload the required registration and roadworthy documents from My Vehicles.'},
 {title:'Payments & Earnings',body:'Passenger payments are processed through Paystack. Driver earnings are calculated from settled payments on completed bookings.'},
 {title:'Safety & Reporting',body:'Use Report an Issue for safety-related concerns. Include the trip where possible so Vaya Operations can investigate quickly.'},
 {title:'Account Settings',body:'Profile, privacy, notifications, vehicle and payment activity settings are available from Settings.'},
];

export default function HelpSupportScreen(){
 const router=useRouter(); const {session}=usePassengerAuth();
 const [query,setQuery]=useState(''); const [selected,setSelected]=useState<string|null>(null); const [formOpen,setFormOpen]=useState(false);
 const [subject,setSubject]=useState(''); const [message,setMessage]=useState(''); const [saving,setSaving]=useState(false); const [error,setError]=useState<string|null>(null); const [success,setSuccess]=useState<string|null>(null);
 const filtered=useMemo(()=>topics.filter(t=>t.title.toLowerCase().includes(query.trim().toLowerCase())),[query]);

 async function submit(){
   if(!session||saving)return;
   setSaving(true); setError(null); setSuccess(null);
   try{
     const r=await submitSupportRequest(session,{subject,message});
     setSuccess(`Support request ${r.supportRequest.reference} was created.`);
     setSubject(''); setMessage(''); setFormOpen(false);
   }catch(reason){setError(reason instanceof Error?reason.message:'Unable to contact support')}
   finally{setSaving(false)}
 }

 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
  <Header title="Help & Support" onBack={()=>router.back()}/>
  <View style={styles.search}><Text style={styles.searchIcon}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Search for help..." placeholderTextColor="#98A2B3" style={styles.input}/></View>

  <View style={styles.list}>{filtered.map((topic,index)=><Pressable key={topic.title} onPress={()=>setSelected(selected===topic.title?null:topic.title)} style={[styles.topic,index<filtered.length-1&&styles.border]}><View style={styles.icon}><Text style={styles.iconText}>?</Text></View><View style={{flex:1}}><Text style={styles.rowTitle}>{topic.title}</Text>{selected===topic.title?<Text style={styles.answer}>{topic.body}</Text>:null}</View><Text style={styles.chevron}>{selected===topic.title?'⌃':'›'}</Text></Pressable>)}</View>

  {formOpen?<View style={styles.form}>
    <Text style={styles.formTitle}>Contact Vaya Support</Text>
    <TextInput value={subject} onChangeText={setSubject} placeholder="Subject" placeholderTextColor="#98A2B3" style={styles.field} maxLength={160}/>
    <TextInput value={message} onChangeText={setMessage} placeholder="Tell us what you need help with..." placeholderTextColor="#98A2B3" style={[styles.field,styles.message]} multiline maxLength={3000}/>
    <Pressable disabled={saving||subject.trim().length<3||message.trim().length<10} onPress={()=>void submit()} style={[styles.primary,(saving||subject.trim().length<3||message.trim().length<10)&&styles.disabled]}>{saving?<ActivityIndicator color="#FFFFFF"/>:<Text style={styles.primaryText}>Send Support Request</Text>}</Pressable>
    <Pressable onPress={()=>setFormOpen(false)} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable>
  </View>:<Pressable onPress={()=>setFormOpen(true)} style={styles.primary}><Text style={styles.primaryText}>Contact Support</Text></Pressable>}

  <Pressable onPress={()=>router.push('/profile-safety')} style={styles.secondary}><Text style={styles.secondaryText}>Report a Safety Issue</Text></Pressable>
  {success?<View style={styles.success}><Text style={styles.successText}>{success}</Text></View>:null}
  {error?<View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>:null}
 </ScrollView></SafeAreaView>
}
function Header({title,onBack}:{title:string;onBack:()=>void}){return <View style={styles.header}><Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.title}>{title}</Text><View style={{width:38}}/></View>}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:BG},page:{padding:16,paddingBottom:40},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{width:38,height:38,borderRadius:11,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center'},backText:{color:TEXT,fontSize:29,lineHeight:29,marginTop:-3},title:{color:TEXT,fontSize:18,fontWeight:'900'},search:{marginTop:18,height:44,borderWidth:1,borderColor:LINE,borderRadius:11,backgroundColor:SURFACE,flexDirection:'row',alignItems:'center',paddingHorizontal:11},searchIcon:{color:MUTED,fontSize:18},input:{flex:1,height:42,color:TEXT,fontSize:10,paddingHorizontal:8},list:{marginTop:14,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,borderRadius:15,overflow:'hidden'},topic:{minHeight:58,flexDirection:'row',alignItems:'flex-start',gap:10,padding:11},border:{borderBottomWidth:1,borderBottomColor:LINE},icon:{width:30,height:30,borderRadius:9,backgroundColor:'#E9F9F3',alignItems:'center',justifyContent:'center'},iconText:{color:'#087F5B',fontSize:11,fontWeight:'900'},rowTitle:{color:TEXT,fontSize:9.5,fontWeight:'900',marginTop:7},answer:{color:MUTED,fontSize:8.3,lineHeight:14,marginTop:6,paddingBottom:3},chevron:{color:'#98A2B3',fontSize:20,marginTop:5},form:{marginTop:18,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,borderRadius:15,padding:13},formTitle:{color:TEXT,fontSize:11,fontWeight:'900',marginBottom:10},field:{height:43,borderWidth:1,borderColor:LINE,borderRadius:10,backgroundColor:'#F9FAFB',paddingHorizontal:11,color:TEXT,fontSize:10,marginBottom:9},message:{minHeight:100,textAlignVertical:'top',paddingTop:10},primary:{marginTop:18,height:44,borderRadius:11,backgroundColor:GREEN,alignItems:'center',justifyContent:'center'},primaryText:{color:'#FFFFFF',fontSize:10,fontWeight:'900'},disabled:{opacity:.45},cancel:{height:38,alignItems:'center',justifyContent:'center'},cancelText:{color:MUTED,fontSize:9,fontWeight:'800'},secondary:{marginTop:9,height:44,borderRadius:11,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center'},secondaryText:{color:TEXT,fontSize:10,fontWeight:'900'},success:{marginTop:12,borderRadius:10,backgroundColor:'#ECFDF3',padding:10},successText:{color:'#027A48',fontSize:9},error:{marginTop:12,borderRadius:10,backgroundColor:'#FFF1F0',padding:10},errorText:{color:'#B42318',fontSize:9}});
