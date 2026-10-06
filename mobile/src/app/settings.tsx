import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMobileDriver, MobileDriver } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN='#16B364'; const GREEN_DARK='#087F5B'; const BG='#FFFFFF'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

export default function SettingsScreen(){
 const router=useRouter(); const {loading,session,user,passenger,signOut}=usePassengerAuth(); const [driver,setDriver]=useState<MobileDriver|null>(null);
 useEffect(()=>{if(!session)return;fetchMobileDriver(session).then(r=>setDriver(r.driver)).catch(()=>setDriver(null))},[session]);
 if(loading)return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color={GREEN}/></View></SafeAreaView>;
 if(!session)return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.title}>Settings</Text><Text style={styles.centerText}>Sign in to manage your Vaya settings.</Text><Pressable onPress={()=>router.replace({pathname:'/auth',params:{next:'/settings'}})} style={styles.primary}><Text style={styles.primaryText}>Sign In</Text></Pressable></View></SafeAreaView>;

 const name=passenger?.name||user?.name||'Vaya member'; const email=passenger?.email||user?.email||''; const imageSource=passenger?.profileImageUrl?{uri:`${API_URL}${passenger.profileImageUrl}`,headers:{'x-vaya-session':session}}:null; const initials=name.split(/\s+/).filter(Boolean).map(p=>p[0]).join('').slice(0,2).toUpperCase(); const version=Constants.expoConfig?.version??'1.0.0';

 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
  <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.title}>Settings</Text><View style={{width:28}}/></View>

  <View style={styles.account}><View style={styles.avatar}>{imageSource?<Image source={imageSource} style={styles.avatarImage} contentFit="cover"/>:<Text style={styles.avatarText}>{initials}</Text>}</View><View style={{flex:1}}><Text style={styles.name}>{name}</Text><Text style={styles.email}>{email}</Text></View><Pressable onPress={()=>router.push('/profile-edit')}><Text style={styles.edit}>Edit</Text></Pressable></View>

  <Text style={styles.section}>ACCOUNT</Text>
  <View style={styles.group}>
   <Row icon="👤" title="Account" onPress={()=>router.push('/profile-edit')}/>
   <Row icon="💳" title="Payment Methods" onPress={()=>router.push('/payment-methods')}/>
   <Row icon="🔒" title="Privacy & Security" onPress={()=>router.push('/privacy-security')}/>
   <Row icon="🔔" title="Notifications" onPress={()=>router.push('/notifications')} last/>
  </View>

  {driver?<><Text style={styles.section}>DRIVER</Text><View style={styles.group}><Row icon="✓" title="Verification" value={driver.status} onPress={()=>router.push('/driver-verification')}/><Row icon="🚙" title="Vehicles" value={String(driver.vehicles?.length??0)} onPress={()=>router.push('/driver-vehicle')} last/></View></>:null}

  <Text style={styles.section}>SUPPORT</Text>
  <View style={styles.group}><Row icon="🛡" title="Safety" onPress={()=>router.push('/profile-safety')}/><Row icon="?" title="Help & Support" onPress={()=>router.push('/help-support')}/><InfoRow icon="文" title="Language" value="English"/><InfoRow icon="i" title="Version" value={version} last/></View>

  <Pressable onPress={()=>void signOut()} style={styles.signOut}><Text style={styles.signOutText}>Sign Out</Text></Pressable>
 </ScrollView></SafeAreaView>
}

function Row({icon,title,value,onPress,last}:{icon:string;title:string;value?:string;onPress:()=>void;last?:boolean}){return <Pressable onPress={onPress} style={[styles.row,!last&&styles.border]}><View style={styles.icon}><Text style={styles.iconText}>{icon}</Text></View><Text style={styles.rowTitle}>{title}</Text>{value?<Text style={styles.rowValue}>{value}</Text>:null}<Text style={styles.chevron}>›</Text></Pressable>}
function InfoRow({icon,title,value,last}:{icon:string;title:string;value:string;last?:boolean}){return <View style={[styles.row,!last&&styles.border]}><View style={styles.icon}><Text style={styles.iconText}>{icon}</Text></View><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowValue}>{value}</Text></View>}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:BG},page:{paddingHorizontal:14,paddingTop:8,paddingBottom:28},center:{flex:1,alignItems:'center',justifyContent:'center',padding:24},centerText:{color:MUTED,fontSize:8.5,textAlign:'center',marginTop:5},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{width:28,height:28,alignItems:'center',justifyContent:'center'},backText:{color:TEXT,fontSize:25,lineHeight:25,marginTop:-2},title:{color:TEXT,fontSize:13,fontWeight:'900'},
 account:{marginTop:12,height:58,borderWidth:1,borderColor:LINE,borderRadius:9,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:10},avatar:{width:36,height:36,borderRadius:18,overflow:'hidden',backgroundColor:'#E9F9F3',alignItems:'center',justifyContent:'center'},avatarImage:{width:'100%',height:'100%'},avatarText:{color:GREEN_DARK,fontSize:9,fontWeight:'900'},name:{color:TEXT,fontSize:9.5,fontWeight:'900'},email:{color:MUTED,fontSize:7,marginTop:2},edit:{color:GREEN_DARK,fontSize:7.5,fontWeight:'900'},
 section:{color:MUTED,fontSize:6.8,fontWeight:'900',letterSpacing:.7,marginTop:16,marginBottom:5},group:{borderWidth:1,borderColor:LINE,borderRadius:9,overflow:'hidden'},row:{minHeight:44,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:10},border:{borderBottomWidth:1,borderBottomColor:LINE},icon:{width:26,height:26,borderRadius:8,backgroundColor:'#F3F6F4',alignItems:'center',justifyContent:'center'},iconText:{fontSize:11},rowTitle:{flex:1,color:TEXT,fontSize:8.3,fontWeight:'800'},rowValue:{color:MUTED,fontSize:7.2},chevron:{color:'#98A2B3',fontSize:17},
 signOut:{height:38,borderRadius:8,borderWidth:1,borderColor:'#FECACA',backgroundColor:'#FFF8F7',alignItems:'center',justifyContent:'center',marginTop:18},signOutText:{color:'#B42318',fontSize:8.5,fontWeight:'900'},primary:{marginTop:14,height:40,paddingHorizontal:16,borderRadius:8,backgroundColor:GREEN,alignItems:'center',justifyContent:'center'},primaryText:{color:'#FFFFFF',fontSize:9,fontWeight:'900'}
});
