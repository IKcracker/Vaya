import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createDriverVehicle } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN='#10B981'; const BG='#F7F9F8'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

export default function AddVehicleScreen(){
  const router=useRouter();
  const {session}=usePassengerAuth();
  const [make,setMake]=useState('');
  const [model,setModel]=useState('');
  const [year,setYear]=useState('');
  const [registration,setRegistration]=useState('');
  const [color,setColor]=useState('');
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState<string|null>(null);

  const parsedYear=Number(year);
  const valid=make.trim().length>=2&&model.trim().length>=1&&registration.trim().length>=2&&color.trim().length>=2&&Number.isInteger(parsedYear)&&parsedYear>=1980&&parsedYear<=2100;

  async function submit(){
    if(!session||!valid||saving)return;
    setSaving(true); setError(null);
    try{
      const response=await createDriverVehicle(session,{
        vehicleMake:make.trim(),
        vehicleModel:model.trim(),
        vehicleYear:parsedYear,
        vehicleRegistration:registration.trim().toUpperCase(),
        vehicleColor:color.trim(),
      });
      router.replace({pathname:'/driver-verification',params:{vehicleId:response.vehicle.id}});
    }catch(reason){
      setError(reason instanceof Error?reason.message:'Unable to add vehicle');
    }finally{setSaving(false);}
  }

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><Text style={styles.title}>Add Vehicle</Text><View style={{width:38}}/></View>

    <View style={styles.stepper}>
      {[1,2,3].map((step,index)=><View key={step} style={styles.stepItem}><View style={[styles.stepCircle,step===1&&styles.stepCircleActive]}><Text style={[styles.stepText,step===1&&styles.stepTextActive]}>{step}</Text></View>{index<2?<View style={styles.stepLine}/>:null}</View>)}
    </View>

    <Text style={styles.sectionTitle}>Vehicle Details</Text>
    <View style={styles.card}>
      <Field label="Make"><TextInput value={make} onChangeText={setMake} style={styles.input} placeholder="Toyota" placeholderTextColor="#98A2B3"/></Field>
      <Field label="Model"><TextInput value={model} onChangeText={setModel} style={styles.input} placeholder="Prado" placeholderTextColor="#98A2B3"/></Field>
      <Field label="Year"><TextInput value={year} onChangeText={(v)=>setYear(v.replace(/\D/g,'').slice(0,4))} keyboardType="number-pad" style={styles.input} placeholder="2020" placeholderTextColor="#98A2B3"/></Field>
      <Field label="Registration Number"><TextInput value={registration} onChangeText={setRegistration} autoCapitalize="characters" style={styles.input} placeholder="KCN 123A" placeholderTextColor="#98A2B3"/></Field>
      <Field label="Colour"><TextInput value={color} onChangeText={setColor} style={styles.input} placeholder="White" placeholderTextColor="#98A2B3"/></Field>
    </View>

    <Text style={styles.sectionTitle}>Verification</Text>
    <View style={styles.info}>
      <Text style={styles.infoTitle}>Documents are verified per vehicle</Text>
      <Text style={styles.infoText}>After saving, upload the registration, roadworthy certificate and optional insurance for this vehicle.</Text>
    </View>

    {error?<View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>:null}

    <Pressable disabled={!valid||saving} onPress={()=>void submit()} style={[styles.primary,(!valid||saving)&&styles.disabled]}>
      {saving?<ActivityIndicator color="#FFFFFF"/>:<Text style={styles.primaryText}>Continue to Verification</Text>}
    </Pressable>
  </ScrollView></SafeAreaView>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:BG},page:{padding:16,paddingBottom:40},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{width:38,height:38,borderRadius:11,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center'},backText:{color:TEXT,fontSize:29,lineHeight:29,marginTop:-3},title:{color:TEXT,fontSize:18,fontWeight:'900'},
  stepper:{flexDirection:'row',alignItems:'center',marginTop:18,paddingHorizontal:6},stepItem:{flex:1,flexDirection:'row',alignItems:'center'},stepCircle:{width:28,height:28,borderRadius:14,backgroundColor:'#EEF2F0',alignItems:'center',justifyContent:'center'},stepCircleActive:{backgroundColor:GREEN},stepText:{color:MUTED,fontSize:9,fontWeight:'900'},stepTextActive:{color:'#FFFFFF'},stepLine:{flex:1,height:2,backgroundColor:'#DDE5E2',marginHorizontal:6},
  sectionTitle:{color:TEXT,fontSize:13,fontWeight:'900',marginTop:22,marginBottom:8},card:{backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,borderRadius:15,padding:13,gap:12},field:{gap:5},label:{color:MUTED,fontSize:8.5,fontWeight:'800'},input:{height:43,borderWidth:1,borderColor:LINE,borderRadius:10,backgroundColor:'#F9FAFB',paddingHorizontal:11,color:TEXT,fontSize:11,fontWeight:'700'},info:{backgroundColor:'#E9F9F3',borderRadius:13,padding:13},infoTitle:{color:'#087F5B',fontSize:10,fontWeight:'900'},infoText:{color:'#087F5B',fontSize:8.5,lineHeight:14,marginTop:3},error:{marginTop:12,borderRadius:11,backgroundColor:'#FFF1F0',padding:11},errorText:{color:'#B42318',fontSize:9},primary:{marginTop:18,height:46,borderRadius:11,backgroundColor:GREEN,alignItems:'center',justifyContent:'center'},primaryText:{color:'#FFFFFF',fontSize:10,fontWeight:'900'},disabled:{opacity:.45}
});
