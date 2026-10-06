import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchPassengerTrips, PassengerTrip } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN='#16B364'; const GREEN_DARK='#087F5B'; const BG='#FFFFFF'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

function formatDate(value:string){return new Intl.DateTimeFormat('en-ZA',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));}
function initials(name:string){return name.split(/\s+/).filter(Boolean).map(p=>p[0]).join('').slice(0,2).toUpperCase();}

export default function TripsScreen(){
 const router=useRouter(); const {loading:authLoading,session}=usePassengerAuth(); const [trips,setTrips]=useState<PassengerTrip[]>([]); const [now]=useState(()=>Date.now()); const [loading,setLoading]=useState(Boolean(session)); const [error,setError]=useState<string|null>(null); const [tab,setTab]=useState<'upcoming'|'history'>('upcoming');
 useEffect(()=>{if(!session)return;let active=true;fetchPassengerTrips(session).then(r=>{if(active)setTrips(r.trips)}).catch((reason:unknown)=>{if(active)setError(reason instanceof Error?reason.message:'Unable to load your trips')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[session]);
 const {upcoming,history}=useMemo(()=>{const future:PassengerTrip[]=[];const past:PassengerTrip[]=[];for(const trip of trips){const departure=new Date(trip.departureAt).getTime();if(departure>=now&&trip.bookingStatus!=='Cancelled'&&trip.tripStatus!=='Cancelled')future.push(trip);else past.push(trip)}return{upcoming:future,history:past}},[now,trips]);
 if(authLoading)return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color={GREEN}/></View></SafeAreaView>;
 if(!session)return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.emptyTitle}>Sign in to see your trips</Text><Text style={styles.emptyText}>Your bookings and ride history stay in your Vaya account.</Text><Pressable onPress={()=>router.push({pathname:'/auth',params:{next:'/trips'}})} style={styles.primary}><Text style={styles.primaryText}>Sign in</Text></Pressable></View></SafeAreaView>;
 const data=tab==='upcoming'?upcoming:history;

 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
  <Text style={styles.title}>My Trips</Text>
  <View style={styles.tabs}><Pressable onPress={()=>setTab('upcoming')} style={[styles.tab,tab==='upcoming'&&styles.tabActive]}><Text style={[styles.tabText,tab==='upcoming'&&styles.tabTextActive]}>Upcoming</Text></Pressable><Pressable onPress={()=>setTab('history')} style={[styles.tab,tab==='history'&&styles.tabActive]}><Text style={[styles.tabText,tab==='history'&&styles.tabTextActive]}>Past</Text></Pressable></View>

  {loading?<View style={styles.state}><ActivityIndicator color={GREEN}/></View>:error?<View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>:data.length?<View style={styles.list}>{data.map((trip,index)=><Pressable key={trip.id} onPress={()=>tab==='upcoming'&&trip.paymentStatus!=='Paid'?router.push({pathname:'/payment/[id]',params:{id:trip.id}}):['Boarding','On schedule'].includes(trip.tripStatus)?router.push({pathname:'/trip-progress/[id]',params:{id:trip.tripId}}):trip.tripStatus==='Completed'?router.push({pathname:'/trip-completed/[id]',params:{id:trip.tripId}}):router.push({pathname:'/trip/[id]',params:{id:trip.tripId,passengers:String(trip.seats)}})} style={[styles.card,index<data.length-1&&styles.cardSpace]}>
    <View style={styles.topRow}><View style={styles.status}><Text style={styles.statusText}>{tab==='upcoming'?'Upcoming':trip.bookingStatus}</Text></View><Text style={styles.date}>{formatDate(trip.departureAt)}</Text></View>
    <Text style={styles.route}>{trip.route}</Text>
    <View style={styles.driverRow}><View style={styles.avatar}>{trip.driverProfileImageUrl?<Image source={{uri:`${API_URL}${trip.driverProfileImageUrl}`}} style={styles.avatarImage} contentFit="cover"/>:<Text style={styles.avatarText}>{initials(trip.driver)}</Text>}</View><View style={{flex:1}}><Text style={styles.driver}>{trip.driver}</Text><Text style={styles.meta}>{trip.seats} seat{trip.seats===1?'':'s'} · {trip.tripStatus}</Text></View><Text style={styles.amount}>{trip.amount}</Text></View>
    <View style={styles.footer}><Text style={styles.payment}>{trip.paymentStatus}</Text><Text style={styles.view}>View trip ›</Text></View>
  </Pressable>)}</View>:<View style={styles.empty}><Text style={styles.emptyTitle}>{tab==='upcoming'?'No upcoming trips':'No past trips'}</Text><Text style={styles.emptyText}>{tab==='upcoming'?'Find a ride and your booking will appear here.':'Completed and cancelled trips will appear here.'}</Text>{tab==='upcoming'?<Pressable onPress={()=>router.push('/search')} style={styles.smallButton}><Text style={styles.smallButtonText}>Find a Ride</Text></Pressable>:null}</View>}
 </ScrollView></SafeAreaView>
}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:BG},page:{paddingHorizontal:14,paddingTop:10,paddingBottom:105},center:{flex:1,alignItems:'center',justifyContent:'center',padding:24},title:{color:TEXT,fontSize:17,fontWeight:'900'},tabs:{marginTop:13,height:34,borderBottomWidth:1,borderBottomColor:LINE,flexDirection:'row'},tab:{flex:1,alignItems:'center',justifyContent:'center',borderBottomWidth:2,borderBottomColor:'transparent'},tabActive:{borderBottomColor:GREEN},tabText:{color:MUTED,fontSize:8.5,fontWeight:'800'},tabTextActive:{color:GREEN_DARK},
 state:{minHeight:180,alignItems:'center',justifyContent:'center'},error:{marginTop:12,padding:10,borderRadius:8,backgroundColor:'#FFF1F0'},errorText:{color:'#B42318',fontSize:8.5},list:{marginTop:12},card:{borderWidth:1,borderColor:LINE,borderRadius:9,backgroundColor:SURFACE,padding:10},cardSpace:{marginBottom:8},topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},status:{backgroundColor:'#ECFDF3',borderRadius:999,paddingHorizontal:7,paddingVertical:3},statusText:{color:'#027A48',fontSize:6.5,fontWeight:'900'},date:{color:MUTED,fontSize:7},route:{color:TEXT,fontSize:10.5,fontWeight:'900',marginTop:8},driverRow:{flexDirection:'row',alignItems:'center',gap:8,marginTop:9},avatar:{width:30,height:30,borderRadius:15,overflow:'hidden',backgroundColor:'#E9F9F3',alignItems:'center',justifyContent:'center'},avatarImage:{width:'100%',height:'100%'},avatarText:{color:GREEN_DARK,fontSize:7.5,fontWeight:'900'},driver:{color:TEXT,fontSize:8.5,fontWeight:'900'},meta:{color:MUTED,fontSize:6.8,marginTop:2},amount:{color:TEXT,fontSize:9.5,fontWeight:'900'},footer:{marginTop:9,paddingTop:8,borderTopWidth:1,borderTopColor:LINE,flexDirection:'row',justifyContent:'space-between'},payment:{color:MUTED,fontSize:7},view:{color:GREEN_DARK,fontSize:7.5,fontWeight:'900'},
 empty:{minHeight:180,alignItems:'center',justifyContent:'center',padding:22},emptyTitle:{color:TEXT,fontSize:11,fontWeight:'900'},emptyText:{color:MUTED,fontSize:8,textAlign:'center',lineHeight:13,marginTop:4},smallButton:{marginTop:12,height:36,paddingHorizontal:14,borderRadius:8,backgroundColor:GREEN,alignItems:'center',justifyContent:'center'},smallButtonText:{color:'#FFFFFF',fontSize:8.5,fontWeight:'900'},primary:{marginTop:14,height:40,paddingHorizontal:18,borderRadius:8,backgroundColor:GREEN,alignItems:'center',justifyContent:'center'},primaryText:{color:'#FFFFFF',fontSize:9,fontWeight:'900'}
});
