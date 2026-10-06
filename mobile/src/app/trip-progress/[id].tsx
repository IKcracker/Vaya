import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GREEN = '#10B981';
const BG = '#F7F9F8';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

export default function TripProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Header title="Trip in Progress" onBack={() => router.back()} />

        <View style={styles.map}>
          <View style={styles.routeLine} />
          <View style={[styles.pin, styles.pinStart]}><Text style={styles.pinText}>●</Text></View>
          <View style={[styles.pin, styles.pinEnd]}><Text style={styles.pinText}>●</Text></View>
          <View style={styles.car}><Text style={styles.carText}>🚗</Text></View>
        </View>

        <View style={styles.driverCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>JK</Text></View>
          <View style={{ flex: 1 }}><Text style={styles.driverName}>James K.</Text><Text style={styles.rating}>★ 4.8 (120)</Text></View>
          <View style={styles.call}><Text style={styles.callText}>☎</Text></View>
        </View>

        <View style={styles.timeline}>
          <View style={styles.timelineRow}><View style={styles.timelineDot} /><View style={{ flex: 1 }}><Text style={styles.city}>Nairobi</Text><Text style={styles.time}>8:00 AM</Text></View></View>
          <View style={styles.timelineLine} />
          <View style={styles.timelineRow}><View style={[styles.timelineDot, styles.timelineDotEnd]} /><View style={{ flex: 1 }}><Text style={styles.city}>Mombasa</Text><Text style={styles.time}>12:30 PM</Text></View></View>
        </View>

        <View style={styles.vehicle}><Text style={styles.vehicleIcon}>🚙</Text><Text style={styles.vehicleText}>Toyota Prado · KCN 123A</Text></View>

        <Pressable onPress={() => router.replace({ pathname: '/trip-completed/[id]', params: { id: params.id || 'trip' } })} style={styles.end}><Text style={styles.endText}>End Trip</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) { return <View style={styles.header}><Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.title}>{title}</Text><View style={{ width: 38 }} /></View>; }

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:BG},page:{padding:16,paddingBottom:40},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{width:38,height:38,borderRadius:11,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center'},backText:{color:TEXT,fontSize:29,lineHeight:29,marginTop:-3},title:{color:TEXT,fontSize:18,fontWeight:'900'},
 map:{marginTop:16,height:250,borderRadius:16,backgroundColor:'#DDEEDF',position:'relative',overflow:'hidden'},routeLine:{position:'absolute',left:80,top:48,width:130,height:145,borderLeftWidth:5,borderBottomWidth:5,borderColor:'#087F5B',borderBottomLeftRadius:60,transform:[{rotate:'-15deg'}]},pin:{position:'absolute',width:24,height:24,borderRadius:12,backgroundColor:'#FFFFFF',alignItems:'center',justifyContent:'center'},pinStart:{left:64,top:38},pinEnd:{right:58,bottom:39},pinText:{color:GREEN,fontSize:13},car:{position:'absolute',left:'46%',top:'48%',width:38,height:38,borderRadius:19,backgroundColor:'#FFFFFF',alignItems:'center',justifyContent:'center'},carText:{fontSize:20},
 driverCard:{marginTop:12,flexDirection:'row',alignItems:'center',gap:10,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,borderRadius:14,padding:12},avatar:{width:42,height:42,borderRadius:21,backgroundColor:'#E9F9F3',alignItems:'center',justifyContent:'center'},avatarText:{color:'#087F5B',fontSize:10,fontWeight:'900'},driverName:{color:TEXT,fontSize:11,fontWeight:'900'},rating:{color:MUTED,fontSize:8,marginTop:3},call:{width:36,height:36,borderRadius:18,backgroundColor:'#ECFDF3',alignItems:'center',justifyContent:'center'},callText:{color:'#027A48',fontSize:15},
 timeline:{marginTop:12,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,borderRadius:14,padding:14},timelineRow:{flexDirection:'row',alignItems:'center',gap:10},timelineDot:{width:9,height:9,borderRadius:5,backgroundColor:GREEN},timelineDotEnd:{backgroundColor:'#0E7490'},timelineLine:{width:2,height:36,backgroundColor:'#B7EAD6',marginLeft:3.5},city:{color:TEXT,fontSize:10,fontWeight:'900'},time:{color:MUTED,fontSize:8,marginTop:2},
 vehicle:{marginTop:12,height:48,borderRadius:12,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:12},vehicleIcon:{fontSize:18},vehicleText:{color:TEXT,fontSize:9,fontWeight:'900'},end:{marginTop:18,height:46,borderRadius:11,backgroundColor:'#F04438',alignItems:'center',justifyContent:'center'},endText:{color:'#FFFFFF',fontSize:10,fontWeight:'900'}
});
