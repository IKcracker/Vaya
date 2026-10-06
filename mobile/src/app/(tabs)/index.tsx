import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchPassengerTrips, PassengerTrip } from '@/lib/auth';
import { API_URL, PublicTrip, searchTrips } from '@/lib/api';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN='#16B364'; const GREEN_DARK='#087F5B'; const BG='#FFFFFF'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

function initials(name:string){return name.split(/\s+/).filter(Boolean).map(p=>p[0]).join('').slice(0,2).toUpperCase();}
function formatTripDate(value:string){return new Intl.DateTimeFormat('en-ZA',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));}

export default function HomeScreen(){
 const {loading,session,passenger,user}=usePassengerAuth();
 const [trips,setTrips]=useState<PassengerTrip[]>([]);
 const [available,setAvailable]=useState<PublicTrip[]>([]);
 const [tripsLoading,setTripsLoading]=useState(Boolean(session));
 const [routesLoading,setRoutesLoading]=useState(true);
 const [now]=useState(()=>Date.now());

 useEffect(()=>{
  let active=true;
  searchTrips({from:'',to:'',passengers:1})
   .then(r=>{if(active)setAvailable(r.trips)})
   .catch(()=>{if(active)setAvailable([])})
   .finally(()=>{if(active)setRoutesLoading(false)});
  return()=>{active=false};
 },[]);

 useEffect(()=>{
  if(!session){setTripsLoading(false);return;}
  let active=true;
  fetchPassengerTrips(session)
   .then(r=>{if(active)setTrips(r.trips)})
   .finally(()=>{if(active)setTripsLoading(false)});
  return()=>{active=false};
 },[session]);

 const displayName=passenger?.name||user?.name||'Traveller';
 const nextTrip=useMemo(()=>trips.find(t=>new Date(t.departureAt).getTime()>now&&t.bookingStatus!=='Cancelled'&&t.tripStatus!=='Cancelled')??null,[now,trips]);
 const suggestedRoutes=useMemo(()=>{
  const seen=new Set<string>();
  const preferredCity=passenger?.city.trim().toLowerCase();
  const sorted=[...available].sort((a,b)=>{
   const aLocal=preferredCity&&a.from.trim().toLowerCase()===preferredCity?0:1;
   const bLocal=preferredCity&&b.from.trim().toLowerCase()===preferredCity?0:1;
   if(aLocal!==bLocal)return Number(aLocal)-Number(bLocal);
   return new Date(a.departureAt).getTime()-new Date(b.departureAt).getTime();
  });
  return sorted.filter(trip=>{
   const key=`${trip.from.toLowerCase()}|${trip.to.toLowerCase()}`;
   if(seen.has(key))return false;
   seen.add(key); return true;
  }).slice(0,3);
 },[available,passenger?.city]);
 const imageSource=passenger?.profileImageUrl&&session?{uri:`${API_URL}${passenger.profileImageUrl}`,headers:{'x-vaya-session':session}}:null;
 const defaultFrom=passenger?.city??'';

 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
  <View style={styles.topbar}>
   <View style={styles.brandRow}><View style={styles.logoMark}><View style={styles.logoCut}/></View><Text style={styles.brand}>Vaya</Text></View>
   <Pressable onPress={()=>router.push('/profile')} style={styles.avatar}>{loading?<ActivityIndicator color={GREEN} size="small"/>:imageSource?<Image source={imageSource} style={styles.avatarImage} contentFit="cover"/>:<Text style={styles.avatarText}>{session?initials(displayName):'V'}</Text>}</Pressable>
  </View>

  <View style={styles.searchCard}>
   <Text style={styles.prompt}>Where would you like to go?</Text>
   <Pressable onPress={()=>router.push({pathname:'/search',params:{from:defaultFrom}})} style={styles.searchRow}>
    <View style={styles.dotStart}/><View style={{flex:1}}><Text style={styles.searchLabel}>Leaving from</Text><Text style={styles.searchValue}>{defaultFrom||'Choose city or town'}</Text></View><Text style={styles.chevron}>›</Text>
   </Pressable>
   <View style={styles.divider}/>
   <Pressable onPress={()=>router.push({pathname:'/search',params:{from:defaultFrom}})} style={styles.searchRow}>
    <View style={styles.dotEnd}/><View style={{flex:1}}><Text style={styles.searchLabel}>Going to</Text><Text style={styles.searchValue}>Enter destination</Text></View><Text style={styles.chevron}>›</Text>
   </Pressable>
   <Pressable onPress={()=>router.push({pathname:'/search',params:{from:defaultFrom}})} style={styles.primary}><Text style={styles.primaryText}>Search Rides</Text></Pressable>
  </View>

  <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Available routes</Text><Text style={styles.liveLabel}>LIVE</Text></View>
  {routesLoading?<View style={styles.routeState}><ActivityIndicator color={GREEN}/></View>:suggestedRoutes.length?<View style={styles.routes}>{suggestedRoutes.map(trip=><Pressable key={trip.id} onPress={()=>router.push({pathname:'/search',params:{from:trip.from,to:trip.to}})} style={styles.routeCard}>
    <View style={styles.routeIcon}><Text style={styles.routeIconText}>↗</Text></View>
    <View style={{flex:1}}><Text style={styles.routeName}>{trip.from} → {trip.to}</Text><Text style={styles.routeMeta}>{formatTripDate(trip.departureAt)} · {trip.availableSeats} seats left</Text></View>
    <Text style={styles.routeFare}>{trip.fare}</Text>
   </Pressable>)}</View>:<View style={styles.empty}><Text style={styles.emptyTitle}>No published rides yet</Text><Text style={styles.emptyText}>New driver trips will appear here automatically.</Text></View>}

  <View style={styles.sectionRow}><Text style={styles.sectionTitle}>My next trip</Text><Pressable onPress={()=>router.push('/trips')}><Text style={styles.link}>View all</Text></Pressable></View>
  {session&&tripsLoading?<View style={styles.state}><ActivityIndicator color={GREEN}/></View>:nextTrip?<Pressable onPress={()=>router.push('/trips')} style={styles.tripCard}>
    <View style={styles.tripTop}><View><Text style={styles.tripRoute}>{nextTrip.route}</Text><Text style={styles.tripDate}>{formatTripDate(nextTrip.departureAt)}</Text></View><Text style={styles.tripAmount}>{nextTrip.amount}</Text></View>
    <View style={styles.tripBottom}><View style={styles.driverAvatar}><Text style={styles.driverAvatarText}>{initials(nextTrip.driver)}</Text></View><View style={{flex:1}}><Text style={styles.driverName}>{nextTrip.driver}</Text><Text style={styles.tripMeta}>{nextTrip.paymentStatus} · {nextTrip.tripStatus}</Text></View><Text style={styles.viewText}>View</Text></View>
   </Pressable>:<View style={styles.empty}><Text style={styles.emptyTitle}>No upcoming trips</Text><Text style={styles.emptyText}>Book a ride and it will appear here.</Text></View>}
 </ScrollView></SafeAreaView>
}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:BG},page:{paddingHorizontal:14,paddingTop:8,paddingBottom:110},topbar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},brandRow:{flexDirection:'row',alignItems:'center',gap:6},logoMark:{width:20,height:25,borderRadius:10,backgroundColor:GREEN,transform:[{rotate:'18deg'}],overflow:'hidden'},logoCut:{position:'absolute',left:6,top:5,width:9,height:9,borderRadius:5,backgroundColor:'#063C35'},brand:{color:TEXT,fontSize:18,fontWeight:'900',letterSpacing:-.5},avatar:{width:32,height:32,borderRadius:16,overflow:'hidden',backgroundColor:'#E9F9F3',alignItems:'center',justifyContent:'center'},avatarImage:{width:'100%',height:'100%'},avatarText:{color:GREEN_DARK,fontSize:9,fontWeight:'900'},
 searchCard:{marginTop:12,borderWidth:1,borderColor:LINE,borderRadius:10,backgroundColor:SURFACE,padding:10},prompt:{color:TEXT,fontSize:13,fontWeight:'900',marginBottom:8},searchRow:{height:48,flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:2},dotStart:{width:8,height:8,borderRadius:4,backgroundColor:GREEN},dotEnd:{width:8,height:8,borderRadius:4,borderWidth:2,borderColor:'#98A2B3'},searchLabel:{color:MUTED,fontSize:7.5},searchValue:{color:TEXT,fontSize:9.5,fontWeight:'800',marginTop:2},chevron:{color:'#98A2B3',fontSize:18},divider:{height:1,backgroundColor:LINE,marginLeft:17},primary:{height:40,borderRadius:8,backgroundColor:GREEN,alignItems:'center',justifyContent:'center',marginTop:8},primaryText:{color:'#FFFFFF',fontSize:9.5,fontWeight:'900'},
 sectionRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},sectionTitle:{color:TEXT,fontSize:11.5,fontWeight:'900',marginTop:18,marginBottom:8},liveLabel:{color:GREEN_DARK,fontSize:6.5,fontWeight:'900',marginTop:18,backgroundColor:'#ECFDF3',paddingHorizontal:6,paddingVertical:3,borderRadius:8},routes:{gap:6},routeCard:{minHeight:54,borderWidth:1,borderColor:LINE,borderRadius:9,paddingHorizontal:9,flexDirection:'row',alignItems:'center',gap:8},routeIcon:{width:28,height:28,borderRadius:9,backgroundColor:'#ECFDF3',alignItems:'center',justifyContent:'center'},routeIconText:{color:GREEN_DARK,fontSize:11,fontWeight:'900'},routeName:{color:TEXT,fontSize:8.8,fontWeight:'900'},routeMeta:{color:MUTED,fontSize:6.8,marginTop:2},routeFare:{color:TEXT,fontSize:9,fontWeight:'900'},routeState:{minHeight:70,alignItems:'center',justifyContent:'center'},link:{color:GREEN_DARK,fontSize:8,fontWeight:'900',marginTop:18},state:{minHeight:90,alignItems:'center',justifyContent:'center'},tripCard:{borderWidth:1,borderColor:LINE,borderRadius:10,backgroundColor:SURFACE,padding:11},tripTop:{flexDirection:'row',justifyContent:'space-between',gap:10},tripRoute:{color:TEXT,fontSize:10.5,fontWeight:'900'},tripDate:{color:MUTED,fontSize:7.8,marginTop:3},tripAmount:{color:TEXT,fontSize:10,fontWeight:'900'},tripBottom:{marginTop:10,paddingTop:9,borderTopWidth:1,borderTopColor:LINE,flexDirection:'row',alignItems:'center',gap:8},driverAvatar:{width:28,height:28,borderRadius:14,backgroundColor:'#E9F9F3',alignItems:'center',justifyContent:'center'},driverAvatarText:{color:GREEN_DARK,fontSize:7.5,fontWeight:'900'},driverName:{color:TEXT,fontSize:8.8,fontWeight:'900'},tripMeta:{color:MUTED,fontSize:7,marginTop:2},viewText:{color:GREEN_DARK,fontSize:8,fontWeight:'900'},empty:{borderWidth:1,borderColor:LINE,borderRadius:10,padding:16,alignItems:'center'},emptyTitle:{color:TEXT,fontSize:9.5,fontWeight:'900'},emptyText:{color:MUTED,fontSize:7.8,marginTop:3}
});
