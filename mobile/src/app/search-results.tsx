import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BLUE = '#1877F2';
const BG = '#F5F7FA';
const SURFACE = '#FFFFFF';
const TEXT = '#101828';
const MUTED = '#667085';
const LINE = '#E4E7EC';

const rides = [
  { driver: 'Lebo Mokoena', rating: '4.9', trips: 28, time: '06:30', fare: 'R280', car: 'Toyota Corolla', seats: '3 seats', luggage: 'Medium luggage', pickup: 'Park Station' },
  { driver: 'Thabo Ndlovu', rating: '4.8', trips: 41, time: '08:00', fare: 'R260', car: 'VW Polo', seats: '2 seats', luggage: 'Small luggage', pickup: 'Midrand' },
  { driver: 'Precious Maseko', rating: '4.9', trips: 19, time: '14:30', fare: 'R300', car: 'Toyota Starlet', seats: '1 seat', luggage: 'Large luggage', pickup: 'Sandton' },
];

export default function SearchResultsScreen() {
  const params = useLocalSearchParams<{ from?: string; to?: string }>();
  const from = typeof params.from === 'string' && params.from ? params.from : 'Johannesburg';
  const to = typeof params.to === 'string' && params.to ? params.to : 'Durban';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>AVAILABLE RIDES</Text>
            <Text style={styles.title}>{from} → {to}</Text>
          </View>
        </View>

        <View style={styles.summary}>
          <View><Text style={styles.summaryLabel}>Date</Text><Text style={styles.summaryValue}>Fri, 09 Oct</Text></View>
          <View><Text style={styles.summaryLabel}>Passengers</Text><Text style={styles.summaryValue}>1</Text></View>
          <Pressable style={({ pressed }) => [styles.modify, pressed && styles.pressed]}><Text style={styles.modifyText}>Modify</Text></Pressable>
        </View>

        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>{rides.length} rides found</Text>
          <Text style={styles.resultSort}>Best match</Text>
        </View>

        {rides.map((ride, index) => (
          <Pressable key={ride.driver} style={({ pressed }) => [styles.rideCard, pressed && styles.cardPressed]}>
            <View style={styles.rideTop}>
              <View style={styles.driverAvatar}><Text style={styles.driverAvatarText}>{ride.driver.split(' ').map((x) => x[0]).join('')}</Text></View>
              <View style={{ flex: 1 }}>
                <View style={styles.driverNameRow}><Text style={styles.driverName}>{ride.driver}</Text><View style={styles.verified}><Text style={styles.verifiedText}>✓</Text></View></View>
                <Text style={styles.driverMeta}>★ {ride.rating} · {ride.trips} trips</Text>
              </View>
              <View style={styles.priceBox}><Text style={styles.price}>{ride.fare}</Text><Text style={styles.priceMeta}>per seat</Text></View>
            </View>

            <View style={styles.routeLine}>
              <View><Text style={styles.time}>{ride.time}</Text><Text style={styles.place}>{from}</Text></View>
              <View style={styles.routeTrack}><View style={styles.dot}/><View style={styles.track}/><View style={[styles.dot,{backgroundColor:BLUE}]}/></View>
              <View style={{ alignItems: 'flex-end' }}><Text style={styles.time}>+5h 30</Text><Text style={styles.place}>{to}</Text></View>
            </View>

            <View style={styles.tags}>
              <View style={styles.tag}><Text style={styles.tagText}>{ride.car}</Text></View>
              <View style={styles.tag}><Text style={styles.tagText}>{ride.seats}</Text></View>
              <View style={styles.tag}><Text style={styles.tagText}>{ride.luggage}</Text></View>
            </View>

            <View style={styles.pickupRow}>
              <View><Text style={styles.pickupLabel}>Pickup</Text><Text style={styles.pickupValue}>{ride.pickup}</Text></View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>
        ))}

        <View style={styles.tip}>
          <Text style={styles.tipTitle}>Choose based on more than price</Text>
          <Text style={styles.tipText}>Compare pickup points, luggage space, departure time and driver history before booking.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:BG},
  page:{paddingHorizontal:18,paddingTop:10,paddingBottom:40},
  pressed:{opacity:.7},
  header:{flexDirection:'row',alignItems:'center',gap:12},
  back:{width:40,height:40,borderRadius:12,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center'},
  backText:{color:TEXT,fontSize:30,lineHeight:30,marginTop:-3},
  eyebrow:{color:BLUE,fontSize:9,fontWeight:'900',letterSpacing:1.1},
  title:{color:TEXT,fontSize:20,fontWeight:'900',marginTop:3,letterSpacing:-.3},
  summary:{marginTop:18,backgroundColor:SURFACE,borderRadius:14,borderWidth:1,borderColor:LINE,padding:13,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  summaryLabel:{color:MUTED,fontSize:9,fontWeight:'700'},
  summaryValue:{color:TEXT,fontSize:11,fontWeight:'900',marginTop:3},
  modify:{paddingHorizontal:11,paddingVertical:8,borderRadius:9,backgroundColor:'#E7F3FF'},
  modifyText:{color:BLUE,fontSize:10,fontWeight:'900'},
  resultHeader:{marginTop:24,marginBottom:10,flexDirection:'row',justifyContent:'space-between'},
  resultTitle:{color:TEXT,fontSize:16,fontWeight:'900'},
  resultSort:{color:MUTED,fontSize:10,fontWeight:'800'},
  rideCard:{backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,borderRadius:18,padding:15,marginBottom:12},
  cardPressed:{opacity:.78,transform:[{scale:.995}]},
  rideTop:{flexDirection:'row',alignItems:'center',gap:10},
  driverAvatar:{width:42,height:42,borderRadius:21,backgroundColor:'#E7F3FF',alignItems:'center',justifyContent:'center'},
  driverAvatarText:{color:BLUE,fontSize:11,fontWeight:'900'},
  driverNameRow:{flexDirection:'row',alignItems:'center',gap:6},
  driverName:{color:TEXT,fontSize:13,fontWeight:'900'},
  verified:{width:15,height:15,borderRadius:8,backgroundColor:BLUE,alignItems:'center',justifyContent:'center'},
  verifiedText:{color:'#FFF',fontSize:9,fontWeight:'900'},
  driverMeta:{color:MUTED,fontSize:10,marginTop:4},
  priceBox:{alignItems:'flex-end'},
  price:{color:TEXT,fontSize:17,fontWeight:'900'},
  priceMeta:{color:MUTED,fontSize:8,marginTop:2},
  routeLine:{marginTop:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  time:{color:TEXT,fontSize:12,fontWeight:'900'},
  place:{color:MUTED,fontSize:9,marginTop:3,maxWidth:90},
  routeTrack:{flex:1,marginHorizontal:12,flexDirection:'row',alignItems:'center'},
  dot:{width:7,height:7,borderRadius:4,backgroundColor:'#98A2B3'},
  track:{height:1,backgroundColor:'#D0D5DD',flex:1},
  tags:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:16},
  tag:{backgroundColor:'#F2F4F7',paddingHorizontal:8,paddingVertical:6,borderRadius:8},
  tagText:{color:'#475467',fontSize:9,fontWeight:'800'},
  pickupRow:{marginTop:14,paddingTop:13,borderTopWidth:1,borderTopColor:LINE,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  pickupLabel:{color:MUTED,fontSize:9,fontWeight:'700'},
  pickupValue:{color:TEXT,fontSize:11,fontWeight:'900',marginTop:3},
  chevron:{color:'#98A2B3',fontSize:23},
  tip:{marginTop:10,backgroundColor:'#EEF5FF',borderRadius:15,padding:14},
  tipTitle:{color:TEXT,fontSize:11,fontWeight:'900'},
  tipText:{color:MUTED,fontSize:10,lineHeight:16,marginTop:4},
});
