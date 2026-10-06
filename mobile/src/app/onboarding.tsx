import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GREEN='#16B364'; const BG='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085';

export default function OnboardingScreen(){
 const router=useRouter();
 async function continueToAuth(){await SecureStore.setItemAsync('vaya.onboarding.completed','1');router.replace('/auth');}
 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
  <View style={styles.visual}>
   <View style={styles.sky}/>
   <View style={styles.mountainBack}/>
   <View style={styles.mountainFront}/>
   <View style={styles.road}/>
   <View style={styles.car}>
    <View style={styles.carTop}/>
    <View style={styles.windshield}/>
    <View style={styles.carBody}/>
    <View style={[styles.wheel,{left:18}]}/><View style={[styles.wheel,{right:18}]}/>
   </View>
   <View style={styles.people}>
    {[0,1,2].map((item)=><View key={item} style={[styles.person,{left:54+item*48}]}><View style={styles.head}/><View style={styles.body}/></View>)}
   </View>
  </View>

  <View style={styles.copyWrap}>
   <Text style={styles.title}>A safer, smarter{"\n"}way to travel</Text>
   <Text style={styles.copy}>Share rides, save money and meet great people along the way.</Text>
   <View style={styles.dots}><View style={[styles.dot,styles.activeDot]}/><View style={styles.dot}/><View style={styles.dot}/><View style={styles.dot}/></View>
  </View>

  <Pressable onPress={()=>void continueToAuth()} style={styles.primary}><Text style={styles.primaryText}>Next</Text></Pressable>
 </ScrollView></SafeAreaView>
}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:BG},page:{flexGrow:1,paddingHorizontal:14,paddingTop:16,paddingBottom:20},
 visual:{height:320,borderRadius:18,overflow:'hidden',position:'relative',backgroundColor:'#EAF2F8'},sky:{position:'absolute',top:0,right:0,bottom:0,left:0,backgroundColor:'#EEF6FB'},
 mountainBack:{position:'absolute',left:-30,right:90,bottom:128,height:105,borderRadius:70,backgroundColor:'#D7E1F3',transform:[{rotate:'-8deg'}]},mountainFront:{position:'absolute',left:120,right:-60,bottom:120,height:120,borderRadius:70,backgroundColor:'#C9D8EB',transform:[{rotate:'9deg'}]},road:{position:'absolute',left:0,right:0,bottom:0,height:120,backgroundColor:'#8EAA99'},
 car:{position:'absolute',left:42,right:42,bottom:32,height:100},carTop:{position:'absolute',left:36,right:36,top:0,height:42,borderTopLeftRadius:24,borderTopRightRadius:24,backgroundColor:'#0F4039'},windshield:{position:'absolute',left:48,right:48,top:10,height:25,borderTopLeftRadius:15,borderTopRightRadius:15,backgroundColor:'#CDE7F1'},carBody:{position:'absolute',left:0,right:0,bottom:12,height:62,borderRadius:18,backgroundColor:GREEN},wheel:{position:'absolute',bottom:0,width:24,height:24,borderRadius:12,backgroundColor:'#1F2937',borderWidth:4,borderColor:'#0F172A'},
 people:{position:'absolute',left:0,right:0,bottom:95,height:72},person:{position:'absolute',bottom:0,width:34,alignItems:'center'},head:{width:20,height:20,borderRadius:10,backgroundColor:'#C98C62'},body:{width:30,height:40,borderTopLeftRadius:14,borderTopRightRadius:14,backgroundColor:'#FFFFFF'},
 copyWrap:{alignItems:'center',paddingHorizontal:18,marginTop:22},title:{color:TEXT,fontSize:21,lineHeight:27,fontWeight:'900',textAlign:'center',letterSpacing:-.4},copy:{color:MUTED,fontSize:9.5,lineHeight:15,textAlign:'center',marginTop:9,maxWidth:260},dots:{flexDirection:'row',gap:5,marginTop:16},dot:{width:5,height:5,borderRadius:3,backgroundColor:'#D0D5DD'},activeDot:{width:14,backgroundColor:GREEN},
 primary:{marginTop:'auto',height:44,borderRadius:8,backgroundColor:GREEN,alignItems:'center',justifyContent:'center'},primaryText:{color:'#FFFFFF',fontSize:10,fontWeight:'900'}
});
