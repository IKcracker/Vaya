import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GREEN='#16B364'; const BG='#FFFFFF'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

export default function ChooseRoleScreen(){
 const router=useRouter();
 return <SafeAreaView style={styles.safe}><View style={styles.page}>
  <Pressable onPress={()=>router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
  <Text style={styles.title}>Join as</Text>
  <Text style={styles.subtitle}>Choose how you want to use Vaya</Text>

  <View style={styles.cards}>
   <Pressable onPress={()=>router.replace('/')} style={({pressed})=>[styles.card,pressed&&styles.pressed]}>
    <View style={styles.iconWrap}><Text style={styles.icon}>🚗</Text></View>
    <View style={{flex:1}}><Text style={styles.cardTitle}>Passenger</Text><Text style={styles.cardText}>Find and book rides</Text></View>
    <Text style={styles.chevron}>›</Text>
   </Pressable>
   <Pressable onPress={()=>router.replace('/explore')} style={({pressed})=>[styles.card,pressed&&styles.pressed]}>
    <View style={styles.iconWrap}><Text style={styles.icon}>🚘</Text></View>
    <View style={{flex:1}}><Text style={styles.cardTitle}>Driver</Text><Text style={styles.cardText}>Offer rides and earn</Text></View>
    <Text style={styles.chevron}>›</Text>
   </Pressable>
  </View>

  <View style={styles.note}><Text style={styles.noteText}>You can switch roles anytime from your profile.</Text></View>
 </View></SafeAreaView>
}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:BG},page:{flex:1,paddingHorizontal:18,paddingTop:8},back:{width:30,height:30,alignItems:'center',justifyContent:'center'},backText:{color:TEXT,fontSize:26,lineHeight:26,marginTop:-2},
 title:{color:TEXT,fontSize:21,fontWeight:'900',marginTop:16},subtitle:{color:MUTED,fontSize:8.5,marginTop:4},cards:{gap:14,marginTop:24},
 card:{height:112,borderWidth:1,borderColor:LINE,borderRadius:10,backgroundColor:SURFACE,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:12},pressed:{opacity:.72},
 iconWrap:{width:52,height:52,borderRadius:26,backgroundColor:'#E9F9F3',alignItems:'center',justifyContent:'center'},icon:{fontSize:26},cardTitle:{color:TEXT,fontSize:13,fontWeight:'900'},cardText:{color:MUTED,fontSize:8.5,marginTop:4},chevron:{color:'#98A2B3',fontSize:24},
 note:{marginTop:'auto',marginBottom:20,paddingVertical:11,paddingHorizontal:12,borderRadius:8,backgroundColor:'#F8FAF9',borderWidth:1,borderColor:LINE},noteText:{color:MUTED,fontSize:8.2,textAlign:'center'}
});
