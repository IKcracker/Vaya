import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RouteMap, RouteMapFallback } from '@/components/route-map';
import { fetchPassengerTripExperience, PassengerTripExperience } from '@/lib/auth';
import { API_URL, getRoutePreview, RoutePreview } from '@/lib/api';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN='#10B981'; const BG='#F7F9F8'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

function formatDeparture(value:string){
  return new Intl.DateTimeFormat('en-ZA',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));
}
function initials(name:string){return name.split(/\s+/).filter(Boolean).map(p=>p[0]).join('').slice(0,2).toUpperCase();}

export default function TripProgressScreen(){
 const router=useRouter(); const params=useLocalSearchParams<{id?:string}>(); const {session}=usePassengerAuth();
 const tripId=typeof params.id==='string'?params.id:'';
 const [trip,setTrip]=useState<PassengerTripExperience|null>(null); const [route,setRoute]=useState<RoutePreview|null>(null); const [routeMessage,setRouteMessage]=useState<string|null>(null); const [loading,setLoading]=useState(Boolean(session&&tripId)); const [error,setError]=useState<string|null>(null);

 useEffect(()=>{if(!session||!tripId)return;let active=true;fetchPassengerTripExperience(session,tripId).then(async r=>{if(!active)return;setTrip(r.trip);const routeResponse=await getRoutePreview(r.trip.from,r.trip.to).catch(()=>({route:null,error:'Map route unavailable'}));if(active){setRoute(routeResponse.route);setRouteMessage(routeResponse.error??null)}}).catch((reason:unknown)=>{if(active)setError(reason instanceof Error?reason.message:'Unable to load trip')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[session,tripId]);

 if(loading)return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color={GREEN}/></View></SafeAreaView>;

 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page}>
  <Header title="Trip in Progress" onBack={()=>router.back()}/>
  {error||!trip?<View style={styles.state}><Text style={styles.stateTitle}>Trip unavailable</Text><Text style={styles.stateText}>{error??'This trip could not be loaded.'}</Text></View>:<>
    <View style={styles.mapWrap}>
      {route?<RouteMap route={route} from={trip.from} to={trip.to} height={220}/>:<RouteMapFallback from={trip.from} to={trip.to} message={routeMessage??'Loading road route...'} height={220}/>}
    </View>

    <View style={styles.driverCard}>
      <View style={styles.avatar}>{trip.driver.profileImageUrl?<Image source={{uri:`${API_URL}${trip.driver.profileImageUrl}`}} style={styles.avatarImage} contentFit="cover"/>:<Text style={styles.avatarText}>{initials(trip.driver.name)}</Text>}</View>
      <View style={{flex:1}}><Text style={styles.driverName}>{trip.driver.name}</Text><Text style={styles.rating}>{trip.driver.verified?'✓ Verified driver':'Driver verification pending'}</Text></View>
      <Pressable onPress={()=>trip.driver.email&&router.push({pathname:'/conversation/[email]',params:{email:trip.driver.email}})} disabled={!trip.driver.email} style={[styles.call,!trip.driver.email&&styles.callDisabled]}><Text style={styles.callText}>✉</Text></Pressable>
    </View>

    <View style={styles.timeline}>
      <View style={styles.timelineRow}><View style={styles.timelineDot}/><View style={{flex:1}}><Text style={styles.city}>{trip.from}</Text><Text style={styles.time}>{formatDeparture(trip.departureAt)}</Text></View></View>
      <View style={styles.timelineLine}/>
      <View style={styles.timelineRow}><View style={[styles.timelineDot,styles.timelineDotEnd]}/><View style={{flex:1}}><Text style={styles.city}>{trip.to}</Text><Text style={styles.time}>Destination</Text></View></View>
    </View>

    <View style={styles.vehicle}><Text style={styles.vehicleIcon}>🚙</Text><View style={{flex:1}}><Text style={styles.vehicleText}>{trip.vehicle.label}</Text><Text style={styles.vehicleMeta}>{trip.vehicle.registration||trip.vehicle.color||'Verified trip vehicle'}</Text></View></View>

    <View style={styles.statusCard}><Text style={styles.statusLabel}>CURRENT STATUS</Text><Text style={styles.statusValue}>{trip.tripStatus}</Text><Text style={styles.statusText}>{trip.tripStatus==='Completed'?'Your trip is complete and ready for review.':'The driver controls trip progress. Updates will appear here automatically.'}</Text></View>

    {trip.tripStatus==='Completed'?<Pressable onPress={()=>router.replace({pathname:'/trip-completed/[id]',params:{id:trip.tripId}})} style={styles.complete}><Text style={styles.completeText}>{trip.review?'View Review':'Review This Trip'}</Text></Pressable>:<Pressable onPress={()=>router.push({pathname:'/trip/[id]',params:{id:trip.tripId,passengers:String(trip.seats)}})} style={styles.secondary}><Text style={styles.secondaryText}>View Trip Details</Text></Pressable>}
  </>}
 </ScrollView></SafeAreaView>;
}
function Header({title,onBack}:{title:string;onBack:()=>void}){return <View style={styles.header}><Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.title}>{title}</Text><View style={{width:38}}/></View>}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:BG},page:{padding:16,paddingBottom:40},center:{flex:1,alignItems:'center',justifyContent:'center'},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{width:38,height:38,borderRadius:11,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center'},backText:{color:TEXT,fontSize:29,lineHeight:29,marginTop:-3},title:{color:TEXT,fontSize:18,fontWeight:'900'},mapWrap:{marginTop:12},driverCard:{marginTop:12,flexDirection:'row',alignItems:'center',gap:10,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,borderRadius:14,padding:12},avatar:{width:42,height:42,borderRadius:21,overflow:'hidden',backgroundColor:'#E9F9F3',alignItems:'center',justifyContent:'center'},avatarImage:{width:'100%',height:'100%'},avatarText:{color:'#087F5B',fontSize:10,fontWeight:'900'},driverName:{color:TEXT,fontSize:11,fontWeight:'900'},rating:{color:MUTED,fontSize:8,marginTop:3},call:{width:36,height:36,borderRadius:18,backgroundColor:'#ECFDF3',alignItems:'center',justifyContent:'center'},callDisabled:{opacity:.45},callText:{color:'#027A48',fontSize:15},timeline:{marginTop:12,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,borderRadius:14,padding:14},timelineRow:{flexDirection:'row',alignItems:'center',gap:10},timelineDot:{width:9,height:9,borderRadius:5,backgroundColor:GREEN},timelineDotEnd:{backgroundColor:'#0E7490'},timelineLine:{width:2,height:36,backgroundColor:'#B7EAD6',marginLeft:3.5},city:{color:TEXT,fontSize:10,fontWeight:'900'},time:{color:MUTED,fontSize:8,marginTop:2},vehicle:{marginTop:12,minHeight:52,borderRadius:12,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:12},vehicleIcon:{fontSize:18},vehicleText:{color:TEXT,fontSize:9,fontWeight:'900'},vehicleMeta:{color:MUTED,fontSize:7.5,marginTop:2},statusCard:{marginTop:12,borderRadius:13,backgroundColor:'#E9F9F3',padding:12},statusLabel:{color:'#087F5B',fontSize:7.5,fontWeight:'900',letterSpacing:.7},statusValue:{color:TEXT,fontSize:12,fontWeight:'900',marginTop:4},statusText:{color:MUTED,fontSize:8,lineHeight:13,marginTop:3},complete:{marginTop:18,height:46,borderRadius:11,backgroundColor:GREEN,alignItems:'center',justifyContent:'center'},completeText:{color:'#FFFFFF',fontSize:10,fontWeight:'900'},secondary:{marginTop:18,height:46,borderRadius:11,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center'},secondaryText:{color:TEXT,fontSize:10,fontWeight:'900'},state:{marginTop:18,minHeight:180,alignItems:'center',justifyContent:'center',padding:22},stateTitle:{color:TEXT,fontSize:13,fontWeight:'900'},stateText:{color:MUTED,fontSize:9,textAlign:'center',marginTop:4}});
