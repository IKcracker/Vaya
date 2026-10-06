import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DriverEarnings, fetchDriverEarnings } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN='#10B981'; const BG='#F7F9F8'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

function dateLabel(value:string){return new Intl.DateTimeFormat('en-ZA',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value));}

export default function EarningsScreen(){
 const router=useRouter(); const {session}=usePassengerAuth();
 const [data,setData]=useState<DriverEarnings|null>(null); const [loading,setLoading]=useState(Boolean(session)); const [error,setError]=useState<string|null>(null);

 useEffect(()=>{if(!session)return;let active=true;fetchDriverEarnings(session).then(r=>{if(active)setData(r.earnings)}).catch((reason:unknown)=>{if(active)setError(reason instanceof Error?reason.message:'Unable to load earnings')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[session]);

 const max=useMemo(()=>Math.max(1,...(data?.chart.map(item=>item.amountCents)??[1])),[data]);
 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page}>
  <Header title="Earnings" onBack={()=>router.back()}/>
  {loading?<View style={styles.state}><ActivityIndicator color={GREEN}/></View>:error?<View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>:data?<>
    <Text style={styles.label}>Total Earnings</Text><Text style={styles.total}>{data.total}</Text><Text style={styles.meta}>{data.thisMonth} this month</Text>
    <View style={styles.chartCard}><View style={styles.chart}>{data.chart.map(item=><View key={item.label} style={styles.barWrap}><View style={[styles.bar,{height:Math.max(4,100*item.amountCents/max)}]}/></View>)}</View><View style={styles.months}>{data.chart.map(item=><Text key={item.label} style={styles.month}>{item.label}</Text>)}</View></View>
    <Text style={styles.sectionTitle}>Recent Payouts</Text>
    {data.payouts.length?<View style={styles.list}>{data.payouts.map((p,index)=><View key={p.reference} style={[styles.row,index<data.payouts.length-1&&styles.border]}><View><Text style={styles.date}>{dateLabel(p.createdAt)}</Text><Text style={styles.route}>{p.route}</Text></View><View style={{alignItems:'flex-end'}}><Text style={styles.amount}>{p.amount}</Text><Text style={styles.completed}>{p.status}</Text></View></View>)}</View>:<View style={styles.state}><Text style={styles.emptyTitle}>No settled earnings yet</Text><Text style={styles.emptyText}>Completed paid bookings from your trips will appear here.</Text></View>}
  </>:null}
 </ScrollView></SafeAreaView>;
}
function Header({title,onBack}:{title:string;onBack:()=>void}){return <View style={styles.header}><Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.title}>{title}</Text><View style={{width:38}}/></View>}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:BG},page:{padding:16,paddingBottom:40},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{width:38,height:38,borderRadius:11,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center'},backText:{color:TEXT,fontSize:29,lineHeight:29,marginTop:-3},title:{color:TEXT,fontSize:18,fontWeight:'900'},label:{color:MUTED,fontSize:9,marginTop:22},total:{color:TEXT,fontSize:27,fontWeight:'900',letterSpacing:-.5,marginTop:3},meta:{color:MUTED,fontSize:8,marginTop:2},chartCard:{marginTop:14,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,borderRadius:15,padding:14},chart:{height:120,flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between'},barWrap:{flex:1,alignItems:'center',justifyContent:'flex-end',height:110},bar:{width:18,borderRadius:6,backgroundColor:GREEN},months:{flexDirection:'row',justifyContent:'space-between',marginTop:8},month:{flex:1,textAlign:'center',color:MUTED,fontSize:7},sectionTitle:{color:TEXT,fontSize:13,fontWeight:'900',marginTop:22,marginBottom:8},list:{backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,borderRadius:15,overflow:'hidden'},row:{minHeight:66,padding:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},border:{borderBottomWidth:1,borderBottomColor:LINE},date:{color:TEXT,fontSize:9.5,fontWeight:'900'},route:{color:MUTED,fontSize:7.5,marginTop:3},amount:{color:TEXT,fontSize:9.5,fontWeight:'900'},completed:{color:'#027A48',fontSize:7.5,marginTop:3,fontWeight:'800'},state:{minHeight:180,alignItems:'center',justifyContent:'center',padding:24},emptyTitle:{color:TEXT,fontSize:12,fontWeight:'900'},emptyText:{color:MUTED,fontSize:9,textAlign:'center',marginTop:4},error:{marginTop:16,borderRadius:11,backgroundColor:'#FFF1F0',padding:11},errorText:{color:'#B42318',fontSize:9}});
