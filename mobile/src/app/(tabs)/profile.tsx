import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMobileDriver, MobileDriver } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN='#16B364'; const GREEN_DARK='#087F5B'; const BG='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

function initials(name:string){return name.split(/\s+/).filter(Boolean).map(v=>v[0]).join('').slice(0,2).toUpperCase();}
function joinedLabel(value?:string){return value?`Member since ${new Intl.DateTimeFormat('en-ZA',{month:'short',year:'numeric'}).format(new Date(value))}`:'Vaya member';}
function driverTone(status?:string){if(status==='Approved')return{bg:'#ECFDF3',text:'#027A48'};if(status==='Rejected'||status==='Suspended')return{bg:'#FFF1F0',text:'#B42318'};return{bg:'#FFFAEB',text:'#B54708'};}

export default function ProfileScreen(){
 const router=useRouter(); const {loading,session,user,passenger,signOut}=usePassengerAuth(); const [driver,setDriver]=useState<MobileDriver|null>(null);
 useEffect(()=>{if(!session)return;let active=true;fetchMobileDriver(session).then(r=>{if(active)setDriver(r.driver)}).catch(()=>{if(active)setDriver(null)});return()=>{active=false}},[session]);
 if(loading)return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color={GREEN}/></View></SafeAreaView>;
 if(!session)return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.emptyTitle}>Your Vaya profile</Text><Text style={styles.emptyText}>Sign in to manage your profile and trips.</Text><Pressable onPress={()=>router.push({pathname:'/auth',params:{next:'/profile'}})} style={styles.primary}><Text style={styles.primaryText}>Sign In</Text></Pressable></View></SafeAreaView>;

 const displayName=passenger?.name||user?.name||'Vaya Passenger'; const email=passenger?.email||user?.email||''; const tone=driverTone(driver?.status); const imageSource=passenger?.profileImageUrl?{uri:`${API_URL}${passenger.profileImageUrl}`,headers:{'x-vaya-session':session}}:null;

 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
  <View style={styles.header}><Text style={styles.title}>Profile</Text><Pressable onPress={()=>router.push('/settings')} style={styles.settings}><Text style={styles.settingsText}>⚙</Text></Pressable></View>

  <View style={styles.identity}>
   <View style={styles.avatar}>{imageSource?<Image source={imageSource} style={styles.avatarImage} contentFit="cover"/>:<Text style={styles.avatarText}>{initials(displayName)}</Text>}</View>
   <Text style={styles.name}>{displayName}</Text>
   <Text style={styles.email}>{email}</Text>
   <Text style={styles.member}>{joinedLabel(passenger?.joinedAt)}</Text>
   <Pressable onPress={()=>router.push('/profile-edit')} style={styles.edit}><Text style={styles.editText}>Edit Profile</Text></Pressable>
  </View>

  <View style={styles.stats}><Stat value={String(passenger?.tripsCount??0)} label="Trips"/><Stat value={passenger?.city||'—'} label="Home"/><Stat value={passenger?.status||'Active'} label="Status"/></View>

  <Text style={styles.section}>Account</Text>
  <View style={styles.menu}>
   <MenuRow icon="👤" title="Personal Details" onPress={()=>router.push('/profile-edit')}/>
   <MenuRow icon="💳" title="Payment Methods" onPress={()=>router.push('/payment-methods')}/>
   <MenuRow icon="🔒" title="Privacy & Security" onPress={()=>router.push('/privacy-security')}/>
   <MenuRow icon="🔔" title="Notifications" onPress={()=>router.push('/notifications')}/>
   <MenuRow icon="?" title="Help & Support" onPress={()=>router.push('/help-support')} last/>
  </View>

  <Text style={styles.section}>Driver</Text>
  <View style={styles.driverCard}>
   <View style={styles.driverTop}><View style={styles.driverIcon}><Text style={styles.driverIconText}>🚘</Text></View><View style={{flex:1}}><Text style={styles.driverTitle}>{driver?'Driver Profile':'Become a Driver'}</Text><Text style={styles.driverNote}>{driver?driver.vehicle||driver.checks:'Offer rides and earn from trips you already make.'}</Text></View>{driver?<View style={[styles.driverStatus,{backgroundColor:tone.bg}]}><Text style={[styles.driverStatusText,{color:tone.text}]}>{driver.status}</Text></View>:null}</View>
   <Pressable onPress={()=>router.push(driver?'/driver-profile':'/explore')} style={styles.driverButton}><Text style={styles.driverButtonText}>{driver?'Open Driver Profile':'Start Driver Setup'}</Text></Pressable>
  </View>

  <Pressable onPress={()=>void signOut()} style={styles.signOut}><Text style={styles.signOutText}>Sign Out</Text></Pressable>
 </ScrollView></SafeAreaView>
}

function Stat({value,label}:{value:string;label:string}){return <View style={styles.stat}><Text style={styles.statValue} numberOfLines={1}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>}
function MenuRow({icon,title,onPress,last}:{icon:string;title:string;onPress:()=>void;last?:boolean}){return <Pressable onPress={onPress} style={[styles.row,!last&&styles.border]}><View style={styles.rowIcon}><Text style={styles.rowIconText}>{icon}</Text></View><Text style={styles.rowTitle}>{title}</Text><Text style={styles.chevron}>›</Text></Pressable>}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:BG},page:{paddingHorizontal:14,paddingTop:10,paddingBottom:105},center:{flex:1,alignItems:'center',justifyContent:'center',padding:24},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},title:{color:TEXT,fontSize:17,fontWeight:'900'},settings:{width:30,height:30,borderRadius:15,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center'},settingsText:{fontSize:13},
 identity:{alignItems:'center',marginTop:18},avatar:{width:70,height:70,borderRadius:35,overflow:'hidden',backgroundColor:'#E9F9F3',alignItems:'center',justifyContent:'center'},avatarImage:{width:'100%',height:'100%'},avatarText:{color:GREEN_DARK,fontSize:18,fontWeight:'900'},name:{color:TEXT,fontSize:15,fontWeight:'900',marginTop:9},email:{color:MUTED,fontSize:7.8,marginTop:3},member:{color:'#98A2B3',fontSize:7.2,marginTop:2},edit:{marginTop:9,height:30,paddingHorizontal:14,borderRadius:15,borderWidth:1,borderColor:GREEN,alignItems:'center',justifyContent:'center'},editText:{color:GREEN_DARK,fontSize:7.5,fontWeight:'900'},
 stats:{marginTop:16,flexDirection:'row',borderTopWidth:1,borderBottomWidth:1,borderColor:LINE,paddingVertical:10},stat:{flex:1,alignItems:'center'},statValue:{color:TEXT,fontSize:9.5,fontWeight:'900',maxWidth:'90%'},statLabel:{color:MUTED,fontSize:6.8,marginTop:2},
 section:{color:TEXT,fontSize:10,fontWeight:'900',marginTop:17,marginBottom:6},menu:{borderWidth:1,borderColor:LINE,borderRadius:9,overflow:'hidden'},row:{minHeight:46,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:10},border:{borderBottomWidth:1,borderBottomColor:LINE},rowIcon:{width:26,height:26,borderRadius:8,backgroundColor:'#F3F6F4',alignItems:'center',justifyContent:'center'},rowIconText:{fontSize:12},rowTitle:{flex:1,color:TEXT,fontSize:8.5,fontWeight:'800'},chevron:{color:'#98A2B3',fontSize:18},
 driverCard:{borderWidth:1,borderColor:LINE,borderRadius:9,padding:10},driverTop:{flexDirection:'row',alignItems:'center',gap:8},driverIcon:{width:32,height:32,borderRadius:10,backgroundColor:'#E9F9F3',alignItems:'center',justifyContent:'center'},driverIconText:{fontSize:15},driverTitle:{color:TEXT,fontSize:8.8,fontWeight:'900'},driverNote:{color:MUTED,fontSize:7,lineHeight:11,marginTop:2},driverStatus:{borderRadius:999,paddingHorizontal:6,paddingVertical:3},driverStatusText:{fontSize:6.5,fontWeight:'900'},driverButton:{height:34,borderRadius:8,backgroundColor:GREEN,alignItems:'center',justifyContent:'center',marginTop:9},driverButtonText:{color:'#FFFFFF',fontSize:8,fontWeight:'900'},
 signOut:{height:38,borderRadius:8,borderWidth:1,borderColor:'#FECACA',backgroundColor:'#FFF8F7',alignItems:'center',justifyContent:'center',marginTop:18},signOutText:{color:'#B42318',fontSize:8.5,fontWeight:'900'},emptyTitle:{color:TEXT,fontSize:13,fontWeight:'900'},emptyText:{color:MUTED,fontSize:8.5,textAlign:'center',marginTop:4},primary:{marginTop:14,height:40,paddingHorizontal:16,borderRadius:8,backgroundColor:GREEN,alignItems:'center',justifyContent:'center'},primaryText:{color:'#FFFFFF',fontSize:9,fontWeight:'900'}
});
