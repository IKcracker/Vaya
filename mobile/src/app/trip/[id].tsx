import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL, getTrip, PublicTrip } from '@/lib/api';

const GREEN='#16B364'; const GREEN_DARK='#087F5B'; const BG='#FFFFFF'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

function formatDeparture(value:string){return new Intl.DateTimeFormat('en-ZA',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));}
function initials(name:string){return name.split(/\s+/).filter(Boolean).map(p=>p[0]).join('').slice(0,2).toUpperCase();}

export default function TripDetailScreen(){
 const router=useRouter(); const params=useLocalSearchParams<{id?:string;passengers?:string}>(); const id=typeof params.id==='string'?params.id:''; const passengers=Math.max(1,Number(typeof params.passengers==='string'?params.passengers:'1')||1);
 const [trip,setTrip]=useState<PublicTrip|null>(null); const [loading,setLoading]=useState(Boolean(id)); const [error,setError]=useState<string|null>(id?null:'Trip reference is missing.');
 useEffect(()=>{if(!id)return;let active=true;getTrip(id).then(r=>{if(active)setTrip(r.trip)}).catch((reason:unknown)=>{if(active)setError(reason instanceof Error?reason.message:'Unable to load this trip')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[id]);
 const total=useMemo(()=>trip?`R${((trip.fareCents*passengers)/100).toFixed(trip.fareCents%100===0?0:2)}`:'R0',[passengers,trip]);

 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
  <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.headerTitle}>Ride Details</Text><View style={{width:28}}/></View>
  {loading?<View style={styles.state}><ActivityIndicator color={GREEN}/></View>:error||!trip?<View style={styles.error}><Text style={styles.errorTitle}>Couldn’t load this ride</Text><Text style={styles.errorText}>{error??'Trip not found.'}</Text></View>:<>
   <View style={styles.routeCard}>
    <View style={styles.routeTop}><View><Text style={styles.route}>{trip.from} → {trip.to}</Text><Text style={styles.departure}>{formatDeparture(trip.departureAt)}</Text></View><View style={styles.status}><Text style={styles.statusText}>{trip.status}</Text></View></View>
    <View style={styles.timeline}><View style={styles.timelineDot}/><View style={styles.timelineLine}/><View style={[styles.timelineDot,{backgroundColor:GREEN}]}/></View>
    <View style={styles.fareRow}><View><Text style={styles.label}>Fare</Text><Text style={styles.value}>{trip.fare}</Text></View><View><Text style={styles.label}>Seats</Text><Text style={styles.value}>{passengers}</Text></View><View style={{alignItems:'flex-end'}}><Text style={styles.label}>Total</Text><Text style={styles.total}>{total}</Text></View></View>
   </View>

   <Text style={styles.sectionTitle}>Driver</Text>
   <View style={styles.driverCard}><View style={styles.avatar}>{trip.driver.profileImageUrl?<Image source={{uri:`${API_URL}${trip.driver.profileImageUrl}`}} style={styles.avatarImage} contentFit="cover"/>:<Text style={styles.avatarText}>{initials(trip.driver.name)}</Text>}</View><View style={{flex:1}}><View style={styles.nameRow}><Text style={styles.driverName}>{trip.driver.name}</Text>{trip.driver.verified?<Text style={styles.verified}>✓</Text>:null}</View><Text style={styles.driverMeta}>{trip.driver.verified?'Verified driver':'Verification pending'}</Text></View><Text style={styles.chevron}>›</Text></View>

   <Text style={styles.sectionTitle}>Trip details</Text>
   <View style={styles.list}>
    <DetailRow label="Departure" value={formatDeparture(trip.departureAt)}/>
    <DetailRow label="Vehicle" value={trip.driver.vehicle}/>
    <DetailRow label="Available seats" value={`${trip.availableSeats} of ${trip.seatCapacity}`}/>
    <DetailRow label="Driver area" value={trip.driver.location||'Not provided'} last/>
   </View>

   <View style={styles.safety}><Text style={styles.safetyIcon}>✓</Text><View style={{flex:1}}><Text style={styles.safetyTitle}>Safe ride</Text><Text style={styles.safetyText}>Driver and vehicle verification are checked before booking.</Text></View></View>

   <Pressable disabled={trip.availableSeats<passengers} onPress={()=>router.push({pathname:'/booking/[id]',params:{id:trip.id,seats:String(passengers)}})} style={[styles.primary,trip.availableSeats<passengers&&styles.disabled]}><Text style={styles.primaryText}>{trip.availableSeats<passengers?'Not enough seats':`Continue · ${total}`}</Text></Pressable>
  </>}
 </ScrollView></SafeAreaView>
}

function DetailRow({label,value,last}:{label:string;value:string;last?:boolean}){return <View style={[styles.detailRow,!last&&styles.border]}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:BG},page:{paddingHorizontal:14,paddingTop:8,paddingBottom:30},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{width:28,height:28,alignItems:'center',justifyContent:'center'},backText:{color:TEXT,fontSize:25,lineHeight:25,marginTop:-2},headerTitle:{color:TEXT,fontSize:13,fontWeight:'900'},
 state:{minHeight:220,alignItems:'center',justifyContent:'center'},error:{marginTop:16,padding:12,borderRadius:8,backgroundColor:'#FFF1F0'},errorTitle:{color:'#B42318',fontSize:10,fontWeight:'900'},errorText:{color:'#B42318',fontSize:8,marginTop:3},
 routeCard:{marginTop:12,borderWidth:1,borderColor:LINE,borderRadius:10,padding:11,backgroundColor:SURFACE},routeTop:{flexDirection:'row',justifyContent:'space-between',gap:8},route:{color:TEXT,fontSize:12,fontWeight:'900'},departure:{color:MUTED,fontSize:7.8,marginTop:3},status:{alignSelf:'flex-start',backgroundColor:'#ECFDF3',borderRadius:999,paddingHorizontal:7,paddingVertical:4},statusText:{color:'#027A48',fontSize:6.8,fontWeight:'900'},timeline:{flexDirection:'row',alignItems:'center',marginTop:12},timelineDot:{width:6,height:6,borderRadius:3,backgroundColor:'#98A2B3'},timelineLine:{flex:1,height:1,backgroundColor:'#D0D5DD'},fareRow:{marginTop:11,paddingTop:9,borderTopWidth:1,borderTopColor:LINE,flexDirection:'row',justifyContent:'space-between'},label:{color:MUTED,fontSize:6.8},value:{color:TEXT,fontSize:9,fontWeight:'900',marginTop:2},total:{color:GREEN_DARK,fontSize:10,fontWeight:'900',marginTop:2},
 sectionTitle:{color:TEXT,fontSize:10.5,fontWeight:'900',marginTop:17,marginBottom:7},driverCard:{height:58,borderWidth:1,borderColor:LINE,borderRadius:9,backgroundColor:SURFACE,paddingHorizontal:10,flexDirection:'row',alignItems:'center',gap:8},avatar:{width:34,height:34,borderRadius:17,overflow:'hidden',backgroundColor:'#E9F9F3',alignItems:'center',justifyContent:'center'},avatarImage:{width:'100%',height:'100%'},avatarText:{color:GREEN_DARK,fontSize:8.5,fontWeight:'900'},nameRow:{flexDirection:'row',alignItems:'center',gap:4},driverName:{color:TEXT,fontSize:9.2,fontWeight:'900'},verified:{color:GREEN,fontSize:9,fontWeight:'900'},driverMeta:{color:MUTED,fontSize:7.2,marginTop:2},chevron:{color:'#98A2B3',fontSize:18},
 list:{borderWidth:1,borderColor:LINE,borderRadius:9,overflow:'hidden',backgroundColor:SURFACE},detailRow:{minHeight:45,paddingHorizontal:10,paddingVertical:8,justifyContent:'center'},border:{borderBottomWidth:1,borderBottomColor:LINE},detailLabel:{color:MUTED,fontSize:7},detailValue:{color:TEXT,fontSize:8.8,fontWeight:'800',marginTop:2},
 safety:{marginTop:14,borderRadius:8,backgroundColor:'#ECFDF3',padding:10,flexDirection:'row',gap:8,alignItems:'center'},safetyIcon:{color:GREEN_DARK,fontSize:11,fontWeight:'900'},safetyTitle:{color:TEXT,fontSize:8.5,fontWeight:'900'},safetyText:{color:MUTED,fontSize:7.2,marginTop:2},primary:{height:42,borderRadius:8,backgroundColor:GREEN,alignItems:'center',justifyContent:'center',marginTop:14},primaryText:{color:'#FFFFFF',fontSize:9.5,fontWeight:'900'},disabled:{opacity:.4}
});
