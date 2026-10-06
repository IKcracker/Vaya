import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchPassengerPayments, PassengerPayment } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN='#10B981'; const BG='#F7F9F8'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

export default function PaymentMethodsScreen(){
 const router=useRouter(); const {session}=usePassengerAuth();
 const [payments,setPayments]=useState<PassengerPayment[]>([]); const [loading,setLoading]=useState(Boolean(session)); const [error,setError]=useState<string|null>(null);
 useEffect(()=>{if(!session)return;let active=true;fetchPassengerPayments(session).then(r=>{if(active)setPayments(r.payments)}).catch((reason:unknown)=>{if(active)setError(reason instanceof Error?reason.message:'Unable to load payment activity')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[session]);
 const methods=useMemo(()=>Array.from(new Set(payments.map(p=>p.method).filter(Boolean))),[payments]);

 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page}>
  <Header title="Payment Methods" onBack={()=>router.back()}/>
  <View style={styles.notice}><Text style={styles.noticeTitle}>Secure checkout</Text><Text style={styles.noticeText}>Vaya uses Paystack for payment processing. Saved card numbers are not stored in the Vaya database.</Text></View>
  {loading?<View style={styles.state}><ActivityIndicator color={GREEN}/></View>:error?<View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>:<>
    <Text style={styles.section}>AVAILABLE CHECKOUT</Text>
    <View style={styles.list}><View style={styles.row}><View style={styles.brand}><Text style={styles.brandText}>P</Text></View><View style={{flex:1}}><Text style={styles.number}>Paystack</Text><Text style={styles.meta}>Secure card and supported payment checkout</Text></View><View style={styles.defaultBadge}><Text style={styles.defaultText}>Active</Text></View></View></View>
    <Text style={styles.section}>PAYMENT ACTIVITY</Text>
    {payments.length?<View style={styles.list}>{payments.slice(0,8).map((p,index)=><Pressable key={p.reference} onPress={()=>router.push({pathname:'/payment/[id]',params:{id:p.bookingId}})} style={[styles.row,index<Math.min(payments.length,8)-1&&styles.border]}><View style={styles.brand}><Text style={styles.brandText}>{p.method.slice(0,1).toUpperCase()}</Text></View><View style={{flex:1}}><Text style={styles.number}>{p.amount} · {p.route}</Text><Text style={styles.meta}>{p.method} · {p.status}</Text></View><Text style={styles.chevron}>›</Text></Pressable>)}</View>:<View style={styles.state}><Text style={styles.emptyTitle}>No payments yet</Text><Text style={styles.emptyText}>Your real checkout history will appear here after your first booking.</Text></View>}
    {methods.length>1?<Text style={styles.methods}>Previously used: {methods.join(', ')}</Text>:null}
  </>}
 </ScrollView></SafeAreaView>
}
function Header({title,onBack}:{title:string;onBack:()=>void}){return <View style={styles.header}><Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.title}>{title}</Text><View style={{width:38}}/></View>}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:BG},page:{padding:16,paddingBottom:40},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{width:38,height:38,borderRadius:11,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center'},backText:{color:TEXT,fontSize:29,lineHeight:29,marginTop:-3},title:{color:TEXT,fontSize:18,fontWeight:'900'},notice:{marginTop:18,backgroundColor:'#E9F9F3',borderRadius:13,padding:12},noticeTitle:{color:'#087F5B',fontSize:9.5,fontWeight:'900'},noticeText:{color:'#087F5B',fontSize:8,lineHeight:13,marginTop:3},section:{color:MUTED,fontSize:8,fontWeight:'900',letterSpacing:.8,marginTop:20,marginBottom:7},list:{backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,borderRadius:15,overflow:'hidden'},row:{minHeight:66,flexDirection:'row',alignItems:'center',gap:11,padding:12},border:{borderBottomWidth:1,borderBottomColor:LINE},brand:{width:38,height:28,borderRadius:7,backgroundColor:'#0B1730',alignItems:'center',justifyContent:'center'},brandText:{color:'#FFFFFF',fontSize:10,fontWeight:'900'},number:{color:TEXT,fontSize:9.5,fontWeight:'900'},meta:{color:MUTED,fontSize:7.8,marginTop:3},defaultBadge:{backgroundColor:'#ECFDF3',borderRadius:999,paddingHorizontal:8,paddingVertical:5},defaultText:{color:'#027A48',fontSize:7,fontWeight:'900'},chevron:{color:'#98A2B3',fontSize:21},state:{minHeight:160,alignItems:'center',justifyContent:'center',padding:20},emptyTitle:{color:TEXT,fontSize:11,fontWeight:'900'},emptyText:{color:MUTED,fontSize:8.5,textAlign:'center',marginTop:4},methods:{color:MUTED,fontSize:8,textAlign:'center',marginTop:12},error:{marginTop:14,borderRadius:11,backgroundColor:'#FFF1F0',padding:11},errorText:{color:'#B42318',fontSize:9}});
