import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createAuthenticatedBooking } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN='#16B364'; const BG='#FFFFFF'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

type CreatedBooking={id:string;status:string;paymentStatus:string;seats:number;amount:string;trip:{id:string;route:string;departureAt:string}};

export default function BookingScreen(){
 const router=useRouter(); const params=useLocalSearchParams<{id?:string;seats?:string}>(); const tripId=typeof params.id==='string'?params.id:''; const seats=Math.max(1,Number(typeof params.seats==='string'?params.seats:'1')||1);
 const {loading,session,passenger,refresh}=usePassengerAuth(); const [submitting,setSubmitting]=useState(false); const [booking,setBooking]=useState<CreatedBooking|null>(null); const [error,setError]=useState<string|null>(null);

 async function confirmBooking(){if(!session||!passenger||!tripId||submitting)return;setSubmitting(true);setError(null);try{const r=await createAuthenticatedBooking(session,{tripId,seats});setBooking(r.booking);await refresh()}catch(reason){setError(reason instanceof Error?reason.message:'Unable to create booking')}finally{setSubmitting(false)}}

 if(loading)return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color={GREEN}/></View></SafeAreaView>;
 if(!session)return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.title}>Sign in to book</Text><Text style={styles.centerText}>Use your Vaya account to reserve seats and keep your trips together.</Text><Pressable onPress={()=>router.push({pathname:'/auth',params:{next:`/booking/${encodeURIComponent(tripId)}?seats=${seats}`}})} style={styles.primary}><Text style={styles.primaryText}>Sign In</Text></Pressable></View></SafeAreaView>;
 if(!passenger)return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.title}>Complete your profile</Text><Text style={styles.centerText}>A passenger profile is required before booking.</Text><Pressable onPress={()=>router.replace('/profile')} style={styles.primary}><Text style={styles.primaryText}>Open Profile</Text></Pressable></View></SafeAreaView>;

 if(booking)return <SafeAreaView style={styles.safe}><View style={styles.success}>
  <View style={styles.successIcon}><Text style={styles.successIconText}>✓</Text></View>
  <Text style={styles.successTitle}>Booking confirmed</Text>
  <Text style={styles.successText}>Your seat is reserved and waiting for payment.</Text>
  <View style={styles.summaryList}><Row label="Route" value={booking.trip.route}/><Row label="Seats" value={String(booking.seats)}/><Row label="Amount" value={booking.amount}/><Row label="Payment" value={booking.paymentStatus} last/></View>
  <Pressable onPress={()=>router.replace({pathname:'/payment/[id]',params:{id:booking.id}})} style={styles.primary}><Text style={styles.primaryText}>Pay Now · {booking.amount}</Text></Pressable>
  <Pressable onPress={()=>router.replace('/trips')} style={styles.secondary}><Text style={styles.secondaryText}>View My Trips</Text></Pressable>
 </View></SafeAreaView>;

 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page}>
  <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.headerTitle}>Booking</Text><View style={{width:28}}/></View>

  <View style={styles.summaryCard}><View><Text style={styles.summaryLabel}>Seats</Text><Text style={styles.summaryValue}>{seats}</Text></View><View style={{alignItems:'flex-end'}}><Text style={styles.summaryLabel}>Status</Text><Text style={styles.summaryValue}>Awaiting payment</Text></View></View>

  <Text style={styles.sectionTitle}>Passenger</Text>
  <View style={styles.accountCard}><View style={styles.avatar}><Text style={styles.avatarText}>{passenger.name.split(' ').filter(Boolean).map(v=>v[0]).join('').slice(0,2).toUpperCase()}</Text></View><View style={{flex:1}}><Text style={styles.name}>{passenger.name}</Text><Text style={styles.meta}>{passenger.email}</Text><Text style={styles.meta}>{passenger.city}</Text></View><Text style={styles.verified}>✓</Text></View>

  <Text style={styles.sectionTitle}>Booking summary</Text>
  <View style={styles.summaryList}><Row label="Trip" value={tripId}/><Row label="Seats" value={String(seats)}/><Row label="Status" value="Awaiting payment" last/></View>

  {error?<View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>:null}
  <View style={styles.notice}><Text style={styles.noticeTitle}>Seat availability is rechecked</Text><Text style={styles.noticeText}>Vaya confirms the booking only if your requested seats are still available.</Text></View>

  <Pressable disabled={submitting||!tripId} onPress={()=>void confirmBooking()} style={[styles.primary,(submitting||!tripId)&&styles.disabled]}>{submitting?<ActivityIndicator color="#FFFFFF"/>:<Text style={styles.primaryText}>Confirm Booking</Text>}</Pressable>
 </ScrollView></SafeAreaView>
}

function Row({label,value,last}:{label:string;value:string;last?:boolean}){return <View style={[styles.row,!last&&styles.rowBorder]}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:BG},page:{paddingHorizontal:14,paddingTop:8,paddingBottom:28},center:{flex:1,alignItems:'center',justifyContent:'center',padding:24},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{width:28,height:28,alignItems:'center',justifyContent:'center'},backText:{color:TEXT,fontSize:25,lineHeight:25,marginTop:-2},headerTitle:{color:TEXT,fontSize:13,fontWeight:'900'},
 title:{color:TEXT,fontSize:15,fontWeight:'900'},centerText:{color:MUTED,fontSize:8.5,textAlign:'center',lineHeight:14,marginTop:5,maxWidth:260},
 summaryCard:{marginTop:12,borderWidth:1,borderColor:LINE,borderRadius:9,padding:10,flexDirection:'row',justifyContent:'space-between'},summaryLabel:{color:MUTED,fontSize:6.8},summaryValue:{color:TEXT,fontSize:9.5,fontWeight:'900',marginTop:2},sectionTitle:{color:TEXT,fontSize:10,fontWeight:'900',marginTop:16,marginBottom:6},
 accountCard:{height:60,borderWidth:1,borderColor:LINE,borderRadius:9,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:10},avatar:{width:34,height:34,borderRadius:17,backgroundColor:'#E9F9F3',alignItems:'center',justifyContent:'center'},avatarText:{color:'#087F5B',fontSize:8.5,fontWeight:'900'},name:{color:TEXT,fontSize:9.2,fontWeight:'900'},meta:{color:MUTED,fontSize:7,marginTop:1},verified:{color:GREEN,fontSize:12,fontWeight:'900'},
 summaryList:{borderWidth:1,borderColor:LINE,borderRadius:9,overflow:'hidden'},row:{minHeight:42,paddingHorizontal:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},rowBorder:{borderBottomWidth:1,borderBottomColor:LINE},rowLabel:{color:MUTED,fontSize:7.3},rowValue:{color:TEXT,fontSize:8.5,fontWeight:'900',maxWidth:'65%',textAlign:'right'},
 notice:{marginTop:12,borderRadius:8,backgroundColor:'#ECFDF3',padding:10},noticeTitle:{color:'#087F5B',fontSize:8.2,fontWeight:'900'},noticeText:{color:MUTED,fontSize:7.2,lineHeight:12,marginTop:2},error:{marginTop:12,borderRadius:8,backgroundColor:'#FFF1F0',padding:10},errorText:{color:'#B42318',fontSize:8.2},
 primary:{height:42,borderRadius:8,backgroundColor:GREEN,alignItems:'center',justifyContent:'center',marginTop:14,paddingHorizontal:16},primaryText:{color:'#FFFFFF',fontSize:9.2,fontWeight:'900'},secondary:{height:40,borderRadius:8,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center',marginTop:8},secondaryText:{color:TEXT,fontSize:8.8,fontWeight:'900'},disabled:{opacity:.45},
 success:{flex:1,paddingHorizontal:18,justifyContent:'center',alignItems:'stretch'},successIcon:{alignSelf:'center',width:48,height:48,borderRadius:24,backgroundColor:'#ECFDF3',alignItems:'center',justifyContent:'center'},successIconText:{color:GREEN,fontSize:22,fontWeight:'900'},successTitle:{color:TEXT,fontSize:18,fontWeight:'900',textAlign:'center',marginTop:12},successText:{color:MUTED,fontSize:8.5,textAlign:'center',marginTop:4,marginBottom:18},});
