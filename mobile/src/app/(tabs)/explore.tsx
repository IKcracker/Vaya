import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMobileDriver, MobileDriver, MobileDriverTrip } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN='#16B364'; const GREEN_DARK='#087F5B'; const BG='#FFFFFF'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

function formatDeparture(value:string){return new Intl.DateTimeFormat('en-ZA',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));}
function statusTone(status:string){if(status==='Approved')return{bg:'#ECFDF3',text:'#027A48'};if(status==='Rejected'||status==='Suspended')return{bg:'#FFF1F0',text:'#B42318'};return{bg:'#FFFAEB',text:'#B54708'};}

export default function DriverScreen(){
 const router=useRouter(); const params=useLocalSearchParams<{refresh?:string}>(); const {loading:authLoading,session,passenger,user}=usePassengerAuth(); const [driver,setDriver]=useState<MobileDriver|null>(null); const [trips,setTrips]=useState<MobileDriverTrip[]>([]); const [loading,setLoading]=useState(Boolean(session)); const [error,setError]=useState<string|null>(null); const refreshKey=typeof params.refresh==='string'?params.refresh:'';
 useEffect(()=>{if(!session)return;let active=true;fetchMobileDriver(session).then(r=>{if(!active)return;setDriver(r.driver);setTrips(r.trips)}).catch((reason:unknown)=>{if(active)setError(reason instanceof Error?reason.message:'Unable to load driver mode')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[refreshKey,session]);
 const nextTrip=useMemo(()=>trips.find(t=>t.status!=='Completed'&&t.status!=='Cancelled')??null,[trips]);

 if(authLoading||loading)return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color={GREEN}/></View></SafeAreaView>;
 if(!session)return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.emptyTitle}>Drive with Vaya</Text><Text style={styles.emptyText}>Sign in first. Passenger and driver modes use one Vaya account.</Text><Pressable onPress={()=>router.push({pathname:'/auth',params:{next:'/explore'}})} style={styles.primary}><Text style={styles.primaryText}>Sign In</Text></Pressable></View></SafeAreaView>;
 if(error)return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.errorTitle}>Driver mode unavailable</Text><Text style={styles.emptyText}>{error}</Text></View></SafeAreaView>;

 if(!driver){
  const name=passenger?.name||user?.name||'Vaya passenger';
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page}>
   <Text style={styles.title}>Become a Driver</Text><Text style={styles.subtitle}>{name}, complete these steps before publishing rides.</Text>
   <View style={styles.steps}><Step number="1" title="Driver details"/><Step number="2" title="Vehicle verification"/><Step number="3" title="Start publishing" last/></View>
   <Pressable onPress={()=>router.push('/driver-application')} style={styles.primary}><Text style={styles.primaryText}>Start Driver Setup</Text></Pressable>
  </ScrollView></SafeAreaView>;
 }

 const tone=statusTone(driver.status); const approved=driver.status==='Approved'; const activeTrips=trips.filter(t=>t.status!=='Completed'&&t.status!=='Cancelled').length; const approvedVehicles=driver.vehicles?.filter(v=>v.status==='Approved').length??0; const expected=trips.reduce((sum,t)=>sum+t.fareCents*t.seatsBooked,0);

 if(!approved)return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page}>
  <View style={styles.header}><Text style={styles.title}>Driver Verification</Text><View style={[styles.status,{backgroundColor:tone.bg}]}><Text style={[styles.statusText,{color:tone.text}]}>{driver.status}</Text></View></View>
  <View style={styles.reviewCard}><Text style={styles.reviewName}>{driver.name}</Text><Text style={styles.reviewMeta}>{driver.vehicle}</Text><Text style={styles.reviewMeta}>{driver.location}</Text><View style={styles.divider}/><Text style={styles.checks}>{driver.checks}</Text></View>
  <Pressable onPress={()=>router.push('/driver-verification')} style={styles.rowLink}><View><Text style={styles.rowLinkTitle}>Verification documents</Text><Text style={styles.rowLinkMeta}>{driver.verification?`${driver.verification.uploadedRequiredCount}/${driver.verification.requiredCount} uploaded`:driver.checks}</Text></View><Text style={styles.chevron}>›</Text></Pressable>
 </ScrollView></SafeAreaView>;

 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
  <View style={styles.header}><View><Text style={styles.title}>Driver Dashboard</Text><Text style={styles.subtitle}>Welcome back, {driver.name.split(' ')[0]}</Text></View><View style={styles.status}><Text style={styles.statusText}>Approved</Text></View></View>

  <View style={styles.stats}><Stat value={String(activeTrips)} label="Active rides"/><Stat value={String(approvedVehicles)} label="Vehicles"/><Stat value={`R${(expected/100).toFixed(0)}`} label="Expected"/></View>

  <Pressable onPress={()=>router.push('/driver-publish')} style={styles.primary}><Text style={styles.primaryText}>＋ Publish a Ride</Text></Pressable>

  <Text style={styles.section}>Driver tools</Text>
  <View style={styles.menu}>
   <MenuRow title="My Rides" onPress={()=>router.push('/driver-rides')}/>
   <MenuRow title="My Vehicles" value={String(approvedVehicles)} onPress={()=>router.push('/driver-vehicle')}/>
   <MenuRow title="Verification" value={driver.status} onPress={()=>router.push('/driver-verification')}/>
   <MenuRow title="Earnings" onPress={()=>router.push('/earnings')}/>
   <MenuRow title="Driver Profile" onPress={()=>router.push('/driver-profile')}/>
   <MenuRow title="Settings" onPress={()=>router.push('/settings')} last/>
  </View>

  <Text style={styles.section}>Next ride</Text>
  {nextTrip?<Pressable onPress={()=>router.push({pathname:'/driver-trip/[id]',params:{id:nextTrip.id}})} style={styles.tripCard}><View style={styles.tripTop}><View style={{flex:1}}><Text style={styles.tripRoute}>{nextTrip.route}</Text><Text style={styles.tripMeta}>{formatDeparture(nextTrip.departureAt)}</Text></View><Text style={styles.tripFare}>{nextTrip.fare}</Text></View><View style={styles.tripFooter}><Text style={styles.tripMeta}>{nextTrip.seatsBooked}/{nextTrip.seatCapacity} booked</Text><Text style={styles.manage}>Manage ›</Text></View></Pressable>:<View style={styles.emptyCard}><Text style={styles.emptyTitle}>No active rides</Text><Text style={styles.emptyText}>Publish a route to make it available to passengers.</Text></View>}
 </ScrollView></SafeAreaView>
}

function Step({number,title,last}:{number:string;title:string;last?:boolean}){return <View style={[styles.step,!last&&styles.border]}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View><Text style={styles.stepTitle}>{title}</Text></View>}
function Stat({value,label}:{value:string;label:string}){return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>}
function MenuRow({title,value,onPress,last}:{title:string;value?:string;onPress:()=>void;last?:boolean}){return <Pressable onPress={onPress} style={[styles.menuRow,!last&&styles.border]}><Text style={styles.menuTitle}>{title}</Text>{value?<Text style={styles.menuValue}>{value}</Text>:null}<Text style={styles.chevron}>›</Text></Pressable>}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:BG},page:{paddingHorizontal:14,paddingTop:10,paddingBottom:105},center:{flex:1,alignItems:'center',justifyContent:'center',padding:24},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},title:{color:TEXT,fontSize:17,fontWeight:'900'},subtitle:{color:MUTED,fontSize:7.8,marginTop:3},status:{backgroundColor:'#ECFDF3',borderRadius:999,paddingHorizontal:7,paddingVertical:4},statusText:{color:'#027A48',fontSize:6.5,fontWeight:'900'},
 stats:{marginTop:14,flexDirection:'row',borderTopWidth:1,borderBottomWidth:1,borderColor:LINE,paddingVertical:10},stat:{flex:1,alignItems:'center'},statValue:{color:TEXT,fontSize:12,fontWeight:'900'},statLabel:{color:MUTED,fontSize:6.8,marginTop:2},
 primary:{height:40,borderRadius:8,backgroundColor:GREEN,alignItems:'center',justifyContent:'center',marginTop:14,paddingHorizontal:14},primaryText:{color:'#FFFFFF',fontSize:9,fontWeight:'900'},section:{color:TEXT,fontSize:10,fontWeight:'900',marginTop:17,marginBottom:6},
 menu:{borderWidth:1,borderColor:LINE,borderRadius:9,overflow:'hidden'},menuRow:{minHeight:44,flexDirection:'row',alignItems:'center',paddingHorizontal:10,gap:8},border:{borderBottomWidth:1,borderBottomColor:LINE},menuTitle:{flex:1,color:TEXT,fontSize:8.5,fontWeight:'800'},menuValue:{color:MUTED,fontSize:7.2},chevron:{color:'#98A2B3',fontSize:17},
 tripCard:{borderWidth:1,borderColor:LINE,borderRadius:9,padding:10},tripTop:{flexDirection:'row',gap:10},tripRoute:{color:TEXT,fontSize:9.5,fontWeight:'900'},tripMeta:{color:MUTED,fontSize:7,marginTop:2},tripFare:{color:TEXT,fontSize:9.5,fontWeight:'900'},tripFooter:{marginTop:8,paddingTop:7,borderTopWidth:1,borderTopColor:LINE,flexDirection:'row',justifyContent:'space-between'},manage:{color:GREEN_DARK,fontSize:7.5,fontWeight:'900'},
 emptyCard:{borderWidth:1,borderColor:LINE,borderRadius:9,padding:14},emptyTitle:{color:TEXT,fontSize:10,fontWeight:'900'},emptyText:{color:MUTED,fontSize:7.5,lineHeight:12,marginTop:3},errorTitle:{color:'#B42318',fontSize:12,fontWeight:'900'},
 steps:{marginTop:16,borderWidth:1,borderColor:LINE,borderRadius:9,overflow:'hidden'},step:{height:50,flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:10},stepNumber:{width:26,height:26,borderRadius:13,backgroundColor:'#E9F9F3',alignItems:'center',justifyContent:'center'},stepNumberText:{color:GREEN_DARK,fontSize:7.5,fontWeight:'900'},stepTitle:{color:TEXT,fontSize:8.5,fontWeight:'800'},
 reviewCard:{marginTop:14,borderWidth:1,borderColor:LINE,borderRadius:9,padding:10},reviewName:{color:TEXT,fontSize:11,fontWeight:'900'},reviewMeta:{color:MUTED,fontSize:7.5,marginTop:3},divider:{height:1,backgroundColor:LINE,marginVertical:9},checks:{color:TEXT,fontSize:8,lineHeight:13},rowLink:{marginTop:10,minHeight:52,borderWidth:1,borderColor:LINE,borderRadius:9,paddingHorizontal:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},rowLinkTitle:{color:TEXT,fontSize:8.5,fontWeight:'900'},rowLinkMeta:{color:MUTED,fontSize:7,marginTop:2}
});
