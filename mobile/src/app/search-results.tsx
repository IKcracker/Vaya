import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RouteMap, RouteMapFallback } from '@/components/route-map';
import { API_URL, getRoutePreview, PublicTrip, RoutePreview, searchTrips } from '@/lib/api';

const GREEN='#16B364'; const GREEN_DARK='#087F5B'; const BG='#FFFFFF'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

function formatDeparture(value:string){
 const d=new Date(value);
 return {
  day:new Intl.DateTimeFormat('en-ZA',{weekday:'short',day:'2-digit',month:'short'}).format(d),
  time:new Intl.DateTimeFormat('en-ZA',{hour:'2-digit',minute:'2-digit',hour12:false}).format(d)
 };
}
function initials(name:string){return name.split(/\s+/).filter(Boolean).map(p=>p[0]).join('').slice(0,2).toUpperCase();}

export default function SearchResultsScreen(){
 const router=useRouter();
 const params=useLocalSearchParams<{from?:string;to?:string;date?:string;passengers?:string}>();
 const from=typeof params.from==='string'?params.from:'';
 const to=typeof params.to==='string'?params.to:'';
 const date=typeof params.date==='string'?params.date:'';
 const passengers=Math.max(1,Number(typeof params.passengers==='string'?params.passengers:'1')||1);
 const [trips,setTrips]=useState<PublicTrip[]>([]);
 const [route,setRoute]=useState<RoutePreview|null>(null);
 const [routeMessage,setRouteMessage]=useState<string|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState<string|null>(null);
 const [sortBy,setSortBy]=useState<'time'|'price'|'seats'>('time');

 const searchSummary=useMemo(()=>date?new Intl.DateTimeFormat('en-ZA',{weekday:'short',day:'2-digit',month:'short'}).format(new Date(`${date}T12:00:00`)):'Any date',[date]);

 useEffect(()=>{
  let active=true;

  searchTrips({from,to,date,passengers})
   .then((tripResponse)=>{
    if(!active)return;
    setTrips(tripResponse.trips);
   })
   .catch((reason:unknown)=>{
    if(active)setError(reason instanceof Error?reason.message:'Unable to search rides');
   })
   .finally(()=>{if(active)setLoading(false)});

  getRoutePreview(from,to)
   .then((response)=>{
    if(!active)return;
    setRoute(response.route);
    setRouteMessage(response.error??null);
   })
   .catch((reason:unknown)=>{
    if(active)setRouteMessage(reason instanceof Error?reason.message:'Map route unavailable');
   });

  return()=>{active=false};
 },[date,from,passengers,to]);

 const sortedTrips=useMemo(()=>{
  const copy=[...trips];
  if(sortBy==='price')return copy.sort((a,b)=>a.fareCents-b.fareCents);
  if(sortBy==='seats')return copy.sort((a,b)=>b.availableSeats-a.availableSeats);
  return copy.sort((a,b)=>new Date(a.departureAt).getTime()-new Date(b.departureAt).getTime());
 },[sortBy,trips]);

 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
  <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><View style={{flex:1}}><Text style={styles.headerRoute}>{from||'Anywhere'} → {to||'Anywhere'}</Text><Text style={styles.headerMeta}>{searchSummary} · {passengers} passenger{passengers===1?'':'s'}</Text></View></View>

  <View style={styles.mapWrap}>
   {route?<RouteMap route={route} from={from} to={to} height={150}/>:<RouteMapFallback from={from||'Start'} to={to||'Destination'} message={routeMessage??'Loading road route...'} height={150}/>}
  </View>

  <View style={styles.filters}>
   <Pressable onPress={()=>setSortBy('time')} style={[styles.filter,sortBy==='time'&&styles.filterActive]}><Text style={[styles.filterText,sortBy==='time'&&styles.filterActiveText]}>Earliest</Text></Pressable>
   <Pressable onPress={()=>setSortBy('price')} style={[styles.filter,sortBy==='price'&&styles.filterActive]}><Text style={[styles.filterText,sortBy==='price'&&styles.filterActiveText]}>Lowest price</Text></Pressable>
   <Pressable onPress={()=>setSortBy('seats')} style={[styles.filter,sortBy==='seats'&&styles.filterActive]}><Text style={[styles.filterText,sortBy==='seats'&&styles.filterActiveText]}>Most seats</Text></Pressable>
  </View>

  {loading?<View style={styles.state}><ActivityIndicator color={GREEN}/><Text style={styles.stateText}>Finding live rides...</Text></View>:error?<View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>:<>
   <Text style={styles.count}>{sortedTrips.length} live ride{sortedTrips.length===1?'':'s'} found</Text>
   {sortedTrips.map((trip)=>{
    const departure=formatDeparture(trip.departureAt);
    return <Pressable key={trip.id} onPress={()=>router.push({pathname:'/trip/[id]',params:{id:trip.id,passengers:String(passengers)}})} style={({pressed})=>[styles.card,pressed&&styles.pressed]}>
     <View style={styles.cardTop}>
      <View style={styles.avatar}>{trip.driver.profileImageUrl?<Image source={{uri:`${API_URL}${trip.driver.profileImageUrl}`}} style={styles.avatarImage} contentFit="cover"/>:<Text style={styles.avatarText}>{initials(trip.driver.name)}</Text>}</View>
      <View style={{flex:1}}><View style={styles.nameRow}><Text style={styles.name}>{trip.driver.name}</Text>{trip.driver.verified?<Text style={styles.verified}>✓</Text>:null}</View><Text style={styles.rating}>{trip.driver.verified?'Verified driver':'Verification pending'}</Text></View>
      <View style={styles.priceWrap}><Text style={styles.price}>{trip.fare}</Text><Text style={styles.priceMeta}>per seat</Text></View>
     </View>
     <View style={styles.routeRow}><View><Text style={styles.time}>{departure.time}</Text><Text style={styles.city}>{trip.from}</Text></View><View style={styles.routeTrack}><View style={styles.routeDot}/><View style={styles.routeLine}/><View style={[styles.routeDot,{backgroundColor:GREEN}]}/></View><View style={{alignItems:'flex-end'}}><Text style={styles.time}>{departure.day}</Text><Text style={styles.city}>{trip.to}</Text></View></View>
     <View style={styles.metaRow}><Text style={styles.meta}>{trip.driver.vehicle}</Text><Text style={styles.metaDot}>•</Text><Text style={styles.meta}>{trip.availableSeats} seat{trip.availableSeats===1?'':'s'} left</Text></View>
     <View style={styles.cardFooter}><Text style={styles.view}>View ride</Text><Text style={styles.chevron}>›</Text></View>
    </Pressable>
   })}
  </>}
 </ScrollView></SafeAreaView>
}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:BG},page:{paddingHorizontal:12,paddingTop:8,paddingBottom:30},pressed:{opacity:.72},header:{flexDirection:'row',alignItems:'center',gap:8},back:{width:28,height:28,alignItems:'center',justifyContent:'center'},backText:{color:TEXT,fontSize:25,lineHeight:25,marginTop:-2},headerRoute:{color:TEXT,fontSize:11,fontWeight:'900'},headerMeta:{color:MUTED,fontSize:7.5,marginTop:2},
 mapWrap:{marginTop:10},filters:{flexDirection:'row',gap:6,marginTop:9},filter:{height:28,paddingHorizontal:10,borderRadius:14,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center',backgroundColor:SURFACE},filterActive:{backgroundColor:'#E9F9F3',borderColor:'#C7EEDF'},filterText:{color:MUTED,fontSize:7.2,fontWeight:'800'},filterActiveText:{color:GREEN_DARK},count:{color:TEXT,fontSize:9,fontWeight:'900',marginTop:12,marginBottom:7},
 card:{borderWidth:1,borderColor:LINE,borderRadius:9,backgroundColor:SURFACE,padding:10,marginBottom:8},cardTop:{flexDirection:'row',alignItems:'center',gap:8},avatar:{width:34,height:34,borderRadius:17,overflow:'hidden',backgroundColor:'#E9F9F3',alignItems:'center',justifyContent:'center'},avatarImage:{width:'100%',height:'100%'},avatarText:{color:GREEN_DARK,fontSize:8.5,fontWeight:'900'},nameRow:{flexDirection:'row',alignItems:'center',gap:4},name:{color:TEXT,fontSize:9,fontWeight:'900'},verified:{color:GREEN,fontSize:9,fontWeight:'900'},rating:{color:MUTED,fontSize:7,marginTop:2},priceWrap:{alignItems:'flex-end'},price:{color:TEXT,fontSize:10,fontWeight:'900'},priceMeta:{color:MUTED,fontSize:6.5,marginTop:1},
 routeRow:{marginTop:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},time:{color:TEXT,fontSize:8.5,fontWeight:'900'},city:{color:MUTED,fontSize:7.5,marginTop:2,maxWidth:88},routeTrack:{flex:1,marginHorizontal:10,flexDirection:'row',alignItems:'center'},routeDot:{width:6,height:6,borderRadius:3,backgroundColor:'#98A2B3'},routeLine:{flex:1,height:1,backgroundColor:'#D0D5DD'},metaRow:{flexDirection:'row',alignItems:'center',gap:4,marginTop:8},meta:{color:MUTED,fontSize:6.8},metaDot:{color:'#D0D5DD',fontSize:7},cardFooter:{marginTop:8,paddingTop:7,borderTopWidth:1,borderTopColor:LINE,flexDirection:'row',justifyContent:'flex-end',alignItems:'center',gap:2},view:{color:GREEN_DARK,fontSize:7.5,fontWeight:'900'},chevron:{color:GREEN_DARK,fontSize:15},
 state:{minHeight:150,alignItems:'center',justifyContent:'center'},stateText:{color:MUTED,fontSize:8,marginTop:6},error:{marginTop:14,padding:10,borderRadius:8,backgroundColor:'#FFF1F0'},errorText:{color:'#B42318',fontSize:8.5}
});
