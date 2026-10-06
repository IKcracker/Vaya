import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN='#16B364'; const GREEN_DARK='#087F5B'; const BG='#FFFFFF'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

export default function PassengerAuthScreen(){
 const router=useRouter(); const params=useLocalSearchParams<{next?:string}>(); const {signIn,signUp}=usePassengerAuth();
 const [mode,setMode]=useState<'sign-in'|'sign-up'>('sign-in'); const [name,setName]=useState(''); const [city,setCity]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [submitting,setSubmitting]=useState(false); const [error,setError]=useState<string|null>(null); const [notice,setNotice]=useState<string|null>(null);
 const next=typeof params.next==='string'&&params.next.startsWith('/')&&!params.next.startsWith('//')&&!params.next.startsWith('/auth')?params.next:'/';
 const valid=/^\S+@\S+\.\S+$/.test(email.trim())&&password.length>=8&&(mode==='sign-in'||(name.trim().length>=2&&city.trim().length>=2));

 async function submit(){
  if(submitting)return; setSubmitting(true); setError(null); setNotice(null);
  try{
   if(mode==='sign-in'){await signIn(email.trim(),password);}
   else{const message=await signUp({name:name.trim(),city:city.trim(),email:email.trim().toLowerCase(),password});if(message){setMode('sign-in');setPassword('');setNotice(message);return;}}
   router.replace((mode==='sign-up'?'/choose-role':next) as never);
  }catch(reason){setError(reason instanceof Error?reason.message:mode==='sign-in'?'Unable to sign in':'Unable to create account');}
  finally{setSubmitting(false);}
 }

 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
  <Pressable onPress={()=>router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>

  <View style={styles.brandWrap}>
    <View style={styles.mark}><View style={styles.markInner}/></View>
    <Text style={styles.brand}>Vaya</Text>
  </View>

  <Text style={styles.title}>{mode==='sign-in'?'Welcome back':'Create your account'}</Text>
  <Text style={styles.subtitle}>{mode==='sign-in'?'Sign in to continue to Vaya':'Join Vaya and start sharing rides.'}</Text>

  <View style={styles.form}>
    {mode==='sign-up'?<>
      <TextInput value={name} onChangeText={setName} autoCapitalize="words" placeholder="Full name" placeholderTextColor="#98A2B3" style={styles.input}/>
      <TextInput value={city} onChangeText={setCity} autoCapitalize="words" placeholder="Home city" placeholderTextColor="#98A2B3" style={styles.input}/>
    </>:null}
    <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="Email address" placeholderTextColor="#98A2B3" style={styles.input}/>
    <TextInput value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode==='sign-in'?'current-password':'new-password'} placeholder="Password" placeholderTextColor="#98A2B3" style={styles.input}/>

    {mode==='sign-in'?<Pressable><Text style={styles.forgot}>Forgot password?</Text></Pressable>:null}
    {notice?<View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View>:null}
    {error?<View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>:null}

    <Pressable disabled={!valid||submitting} onPress={()=>void submit()} style={[styles.primary,(!valid||submitting)&&styles.primaryDisabled]}>
      {submitting?<ActivityIndicator color="#FFFFFF"/>:<Text style={styles.primaryText}>{mode==='sign-in'?'Sign In':'Create Account'}</Text>}
    </Pressable>

    <View style={styles.orRow}><View style={styles.orLine}/><Text style={styles.orText}>Or continue with</Text><View style={styles.orLine}/></View>
    <View style={styles.socialRow}>
      <View style={styles.social}><Text style={styles.socialText}>G</Text></View>
      <View style={styles.social}><Text style={styles.socialText}>●</Text></View>
      <View style={styles.social}><Text style={styles.socialText}>f</Text></View>
    </View>
  </View>

  <View style={styles.footerRow}>
    <Text style={styles.footerText}>{mode==='sign-in'?"Don't have an account? ":"Already have an account? "}</Text>
    <Pressable onPress={()=>{setMode(mode==='sign-in'?'sign-up':'sign-in');setError(null);setNotice(null);}}><Text style={styles.footerLink}>{mode==='sign-in'?'Sign up':'Sign in'}</Text></Pressable>
  </View>
 </ScrollView></SafeAreaView>
}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:BG},page:{flexGrow:1,paddingHorizontal:22,paddingTop:8,paddingBottom:28},back:{width:30,height:30,alignItems:'center',justifyContent:'center',alignSelf:'flex-start'},backText:{color:TEXT,fontSize:26,lineHeight:26,marginTop:-2},
 brandWrap:{alignItems:'center',marginTop:18},mark:{width:42,height:52,borderRadius:22,backgroundColor:GREEN,transform:[{rotate:'18deg'}],overflow:'hidden'},markInner:{position:'absolute',left:11,top:10,width:20,height:20,borderRadius:10,backgroundColor:'#063C35'},brand:{color:TEXT,fontSize:18,fontWeight:'900',marginTop:8,letterSpacing:-.5},
 title:{color:TEXT,fontSize:21,fontWeight:'900',textAlign:'center',marginTop:18},subtitle:{color:MUTED,fontSize:9,textAlign:'center',marginTop:5},
 form:{marginTop:22,gap:10},input:{height:42,borderWidth:1,borderColor:LINE,borderRadius:8,backgroundColor:'#F8FAF9',paddingHorizontal:11,color:TEXT,fontSize:10.5},forgot:{alignSelf:'flex-end',color:TEXT,fontSize:8,fontWeight:'800',textAlign:'right',marginTop:-3},primary:{height:42,borderRadius:8,backgroundColor:GREEN,alignItems:'center',justifyContent:'center',marginTop:4},primaryDisabled:{opacity:.45},primaryText:{color:'#FFFFFF',fontSize:10,fontWeight:'900'},
 orRow:{flexDirection:'row',alignItems:'center',gap:9,marginVertical:6},orLine:{flex:1,height:1,backgroundColor:LINE},orText:{color:MUTED,fontSize:7.5},socialRow:{flexDirection:'row',justifyContent:'center',gap:14},social:{width:38,height:38,borderRadius:19,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center',backgroundColor:SURFACE},socialText:{color:TEXT,fontSize:14,fontWeight:'900'},
 footerRow:{flexDirection:'row',justifyContent:'center',marginTop:18},footerText:{color:MUTED,fontSize:8.5},footerLink:{color:GREEN_DARK,fontSize:8.5,fontWeight:'900'},error:{backgroundColor:'#FFF1F0',borderRadius:8,padding:9},errorText:{color:'#B42318',fontSize:8.5},notice:{backgroundColor:'#ECFDF3',borderRadius:8,padding:9},noticeText:{color:'#027A48',fontSize:8.5}
});
