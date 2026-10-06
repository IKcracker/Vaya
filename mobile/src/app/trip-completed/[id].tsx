import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GREEN='#10B981'; const BG='#F7F9F8'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

export default function TripCompletedScreen(){
 const router=useRouter(); useLocalSearchParams<{id?:string}>();
 return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page}>
  <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.headerTitle}>Trip Completed</Text><View style={{width:38}}/></View>
  <View style={styles.confetti}><Text style={styles.confettiText}>🎉</Text></View>
  <Text style={styles.title}>Thanks for riding with James!</Text>
  <Text style={styles.subtitle}>Nairobi → Mombasa{"\n"}Fri, 16 May · 8:00 AM</Text>
  <View style={styles.card}><Text style={styles.label}>How was your trip?</Text><View style={styles.stars}>{[1,2,3,4,5].map((s)=><Text key={s} style={styles.star}>★</Text>)}</View><TextInput multiline placeholder="Add a comment (optional)" placeholderTextColor="#98A2B3" style={styles.input}/></View>
  <Pressable onPress={()=>router.replace('/trips')} style={styles.primary}><Text style={styles.primaryText}>Submit Review</Text></Pressable>
 </ScrollView></SafeAreaView>
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:BG},page:{padding:16,paddingBottom:40},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{width:38,height:38,borderRadius:11,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center'},backText:{color:TEXT,fontSize:29,lineHeight:29,marginTop:-3},headerTitle:{color:TEXT,fontSize:18,fontWeight:'900'},confetti:{marginTop:34,alignItems:'center'},confettiText:{fontSize:52},title:{color:TEXT,fontSize:22,fontWeight:'900',textAlign:'center',marginTop:12},subtitle:{color:MUTED,fontSize:10,lineHeight:17,textAlign:'center',marginTop:7},card:{marginTop:24,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,borderRadius:15,padding:14},label:{color:TEXT,fontSize:11,fontWeight:'900',textAlign:'center'},stars:{flexDirection:'row',justifyContent:'center',gap:8,marginTop:12},star:{color:GREEN,fontSize:28},input:{marginTop:14,minHeight:84,borderWidth:1,borderColor:LINE,borderRadius:11,backgroundColor:'#F9FAFB',padding:11,fontSize:10,color:TEXT,textAlignVertical:'top'},primary:{marginTop:18,height:46,borderRadius:11,backgroundColor:GREEN,alignItems:'center',justifyContent:'center'},primaryText:{color:'#FFFFFF',fontSize:10,fontWeight:'900'}});
