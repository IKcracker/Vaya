import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN='#16B364'; const GREEN_DARK='#087F5B'; const BG='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

function isoDate(date:Date){return date.toISOString().slice(0,10);}
function dateLabel(date:Date){return new Intl.DateTimeFormat('en-ZA',{weekday:'short',day:'2-digit',month:'short'}).format(date);}

export default function SearchScreen(){
 const router=useRouter();
 const params=useLocalSearchParams<{from?:string;to?:string}>();
 const {passenger}=usePassengerAuth();
 const [from,setFrom]=useState(typeof params.from==='string'?params.from:passenger?.city??'');
 const [to,setTo]=useState(typeof params.to==='string'?params.to:'');
 const [date,setDate]=useState('');
 const [passengers,setPassengers]=useState(1);

 const dateOptions=useMemo(()=>{
  const today=new Date();
  const tomorrow=new Date(today); tomorrow.setDate(today.getDate()+1);
  const nextFriday=new Date(today); const daysUntilFriday=(5-today.getDay()+7)%7||7; nextFriday.setDate(today.getDate()+daysUntilFriday);
  return [{label:'Any date',value:''},{label:dateLabel(tomorrow),value:isoDate(tomorrow)},{label:dateLabel(nextFriday),value:isoDate(nextFriday)}];
 },[]);

 const canSearch=from.trim().length>1&&to.trim().length>1&&from.trim().toLowerCase()!==to.trim().toLowerCase();

 function submit(){
  if(!canSearch)return;
  router.push({pathname:'/search-results',params:{from:from.trim(),to:to.trim(),date,passengers:String(passengers)}});
 }

 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
  <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.title}>Find a Ride</Text><View style={{width:28}}/></View>

  <View style={styles.routeCard}>
   <View style={styles.routeRow}><View style={styles.dotStart}/><View style={{flex:1}}><Text style={styles.label}>Leaving from</Text><TextInput value={from} onChangeText={setFrom} placeholder="City or town" placeholderTextColor="#98A2B3" autoCapitalize="words" style={styles.input}/></View></View>
   <View style={styles.routeDivider}/>
   <View style={styles.routeRow}><View style={styles.dotEnd}/><View style={{flex:1}}><Text style={styles.label}>Going to</Text><TextInput value={to} onChangeText={setTo} placeholder="City or town" placeholderTextColor="#98A2B3" autoCapitalize="words" style={styles.input}/></View></View>
  </View>

  {passenger?.city&&from.trim().toLowerCase()!==passenger.city.trim().toLowerCase()?<Pressable onPress={()=>setFrom(passenger.city)} style={styles.homeCity}><Text style={styles.homeCityText}>Use home city · {passenger.city}</Text></Pressable>:null}

  <Text style={styles.section}>Travel date</Text>
  <View style={styles.chips}>{dateOptions.map(option=><Pressable key={option.label} onPress={()=>setDate(option.value)} style={[styles.chip,date===option.value&&styles.chipActive]}><Text style={[styles.chipText,date===option.value&&styles.chipTextActive]}>{option.label}</Text></Pressable>)}</View>

  <View style={styles.passengerRow}><View><Text style={styles.section}>Passengers</Text><Text style={styles.hint}>Choose how many seats you need.</Text></View><View style={styles.stepper}><Pressable disabled={passengers<=1} onPress={()=>setPassengers(v=>Math.max(1,v-1))} style={[styles.stepButton,passengers<=1&&styles.stepDisabled]}><Text style={styles.stepText}>−</Text></Pressable><Text style={styles.count}>{passengers}</Text><Pressable disabled={passengers>=8} onPress={()=>setPassengers(v=>Math.min(8,v+1))} style={[styles.stepButton,passengers>=8&&styles.stepDisabled]}><Text style={styles.stepText}>＋</Text></Pressable></View></View>

  <Pressable disabled={!canSearch} onPress={submit} style={[styles.primary,!canSearch&&styles.disabled]}><Text style={styles.primaryText}>Search Rides</Text></Pressable>
  <Text style={styles.footer}>Results come directly from published Vaya trips with enough available seats.</Text>
 </ScrollView></SafeAreaView>
}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:BG},page:{paddingHorizontal:14,paddingTop:8,paddingBottom:28},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{width:28,height:28,alignItems:'center',justifyContent:'center'},backText:{color:TEXT,fontSize:25,lineHeight:25,marginTop:-2},title:{color:TEXT,fontSize:13,fontWeight:'900'},
 routeCard:{marginTop:14,borderWidth:1,borderColor:LINE,borderRadius:9,overflow:'hidden'},routeRow:{minHeight:61,flexDirection:'row',alignItems:'center',gap:9,paddingHorizontal:11},routeDivider:{height:1,backgroundColor:LINE,marginLeft:28},dotStart:{width:8,height:8,borderRadius:4,backgroundColor:GREEN},dotEnd:{width:8,height:8,borderRadius:4,borderWidth:2,borderColor:'#98A2B3'},label:{color:MUTED,fontSize:6.8},input:{color:TEXT,fontSize:10,fontWeight:'800',paddingVertical:4,marginTop:1},
 homeCity:{alignSelf:'flex-start',marginTop:8,borderRadius:14,backgroundColor:'#ECFDF3',paddingHorizontal:9,paddingVertical:6},homeCityText:{color:GREEN_DARK,fontSize:7.3,fontWeight:'900'},
 section:{color:TEXT,fontSize:9.5,fontWeight:'900',marginTop:17},chips:{marginTop:7,flexDirection:'row',gap:6,flexWrap:'wrap'},chip:{height:31,paddingHorizontal:10,borderRadius:16,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center'},chipActive:{backgroundColor:'#ECFDF3',borderColor:'#C7EEDF'},chipText:{color:MUTED,fontSize:7.2,fontWeight:'800'},chipTextActive:{color:GREEN_DARK},
 passengerRow:{marginTop:2,flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:10},hint:{color:MUTED,fontSize:6.8,marginTop:2},stepper:{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:LINE,borderRadius:8,overflow:'hidden'},stepButton:{width:34,height:34,alignItems:'center',justifyContent:'center',backgroundColor:'#F8FAF9'},stepDisabled:{opacity:.35},stepText:{color:TEXT,fontSize:16,fontWeight:'800'},count:{width:30,textAlign:'center',color:TEXT,fontSize:9,fontWeight:'900'},
 primary:{height:42,borderRadius:8,backgroundColor:GREEN,alignItems:'center',justifyContent:'center',marginTop:18},primaryText:{color:'#FFFFFF',fontSize:9.5,fontWeight:'900'},disabled:{opacity:.4},footer:{color:MUTED,fontSize:7.2,lineHeight:12,textAlign:'center',marginTop:10}
});
