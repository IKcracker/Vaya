import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchPassengerTripExperience, PassengerTripExperience, submitDriverReview } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN='#10B981'; const BG='#F7F9F8'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

function formatDeparture(value:string){return new Intl.DateTimeFormat('en-ZA',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));}

export default function TripCompletedScreen(){
 const router=useRouter(); const params=useLocalSearchParams<{id?:string}>(); const {session}=usePassengerAuth(); const tripId=typeof params.id==='string'?params.id:'';
 const [trip,setTrip]=useState<PassengerTripExperience|null>(null); const [rating,setRating]=useState(5); const [comment,setComment]=useState(''); const [loading,setLoading]=useState(Boolean(session&&tripId)); const [saving,setSaving]=useState(false); const [error,setError]=useState<string|null>(null); const [success,setSuccess]=useState<string|null>(null);

 useEffect(()=>{if(!session||!tripId)return;let active=true;fetchPassengerTripExperience(session,tripId).then(r=>{if(!active)return;setTrip(r.trip);if(r.trip.review?.rating)setRating(r.trip.review.rating);if(r.trip.review?.comment)setComment(r.trip.review.comment)}).catch((reason:unknown)=>{if(active)setError(reason instanceof Error?reason.message:'Unable to load trip')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[session,tripId]);

 async function submit(){if(!session||!trip||saving||trip.review)return;setSaving(true);setError(null);try{const r=await submitDriverReview(session,trip.tripId,{rating,comment});setTrip({...trip,review:r.review});setSuccess('Thanks — your review has been saved.')}catch(reason){setError(reason instanceof Error?reason.message:'Unable to submit review')}finally{setSaving(false)}}

 if(loading)return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color={GREEN}/></View></SafeAreaView>;

 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page}>
  <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.headerTitle}>Trip Completed</Text><View style={{width:38}}/></View>
  {!trip?<View style={styles.state}><Text style={styles.stateTitle}>Trip unavailable</Text><Text style={styles.stateText}>{error??'This trip could not be loaded.'}</Text></View>:<>
   <View style={styles.confetti}><Text style={styles.confettiText}>🎉</Text></View>
   <Text style={styles.title}>Thanks for riding with {trip.driver.name}!</Text>
   <Text style={styles.subtitle}>{trip.route}{"\n"}{formatDeparture(trip.departureAt)}</Text>

   {trip.tripStatus!=='Completed'?<View style={styles.notice}><Text style={styles.noticeTitle}>Trip is not completed yet</Text><Text style={styles.noticeText}>A review can be submitted once the driver marks the trip as completed.</Text></View>:null}

   <View style={styles.card}><Text style={styles.label}>{trip.review?'Your review':'How was your trip?'}</Text><View style={styles.stars}>{[1,2,3,4,5].map((s)=><Pressable key={s} disabled={Boolean(trip.review)} onPress={()=>setRating(s)}><Text style={[styles.star,s>rating&&styles.starInactive]}>★</Text></Pressable>)}</View><TextInput editable={!trip.review&&trip.tripStatus==='Completed'} value={comment} onChangeText={setComment} multiline placeholder="Add a comment (optional)" placeholderTextColor="#98A2B3" style={[styles.input,trip.review&&styles.inputDisabled]} maxLength={1200}/></View>
   {success?<View style={styles.success}><Text style={styles.successText}>{success}</Text></View>:null}
   {error?<View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>:null}
   {!trip.review&&trip.tripStatus==='Completed'?<Pressable disabled={saving} onPress={()=>void submit()} style={[styles.primary,saving&&styles.disabled]}>{saving?<ActivityIndicator color="#FFFFFF"/>:<Text style={styles.primaryText}>Submit Review</Text>}</Pressable>:<Pressable onPress={()=>router.replace('/trips')} style={styles.primary}><Text style={styles.primaryText}>Back to My Trips</Text></Pressable>}
  </>}
 </ScrollView></SafeAreaView>
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:BG},page:{padding:16,paddingBottom:40},center:{flex:1,alignItems:'center',justifyContent:'center'},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{width:38,height:38,borderRadius:11,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center'},backText:{color:TEXT,fontSize:29,lineHeight:29,marginTop:-3},headerTitle:{color:TEXT,fontSize:18,fontWeight:'900'},confetti:{marginTop:34,alignItems:'center'},confettiText:{fontSize:52},title:{color:TEXT,fontSize:22,fontWeight:'900',textAlign:'center',marginTop:12},subtitle:{color:MUTED,fontSize:10,lineHeight:17,textAlign:'center',marginTop:7},notice:{marginTop:18,borderRadius:12,backgroundColor:'#FFF4E8',padding:11},noticeTitle:{color:'#B54708',fontSize:9.5,fontWeight:'900'},noticeText:{color:'#B54708',fontSize:8,lineHeight:13,marginTop:3},card:{marginTop:24,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,borderRadius:15,padding:14},label:{color:TEXT,fontSize:11,fontWeight:'900',textAlign:'center'},stars:{flexDirection:'row',justifyContent:'center',gap:8,marginTop:12},star:{color:GREEN,fontSize:28},starInactive:{color:'#D0D5DD'},input:{marginTop:14,minHeight:84,borderWidth:1,borderColor:LINE,borderRadius:11,backgroundColor:'#F9FAFB',padding:11,fontSize:10,color:TEXT,textAlignVertical:'top'},inputDisabled:{backgroundColor:'#F2F4F3'},primary:{marginTop:18,height:46,borderRadius:11,backgroundColor:GREEN,alignItems:'center',justifyContent:'center'},primaryText:{color:'#FFFFFF',fontSize:10,fontWeight:'900'},disabled:{opacity:.55},success:{marginTop:12,borderRadius:10,backgroundColor:'#ECFDF3',padding:10},successText:{color:'#027A48',fontSize:9},error:{marginTop:12,borderRadius:10,backgroundColor:'#FFF1F0',padding:10},errorText:{color:'#B42318',fontSize:9},state:{minHeight:180,alignItems:'center',justifyContent:'center'},stateTitle:{color:TEXT,fontSize:13,fontWeight:'900'},stateText:{color:MUTED,fontSize:9,textAlign:'center',marginTop:4}});
