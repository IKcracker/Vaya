import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchMobileConversation, MobileMessage, sendMobileMessage } from '@/lib/auth';
import { usePassengerAuth } from '@/providers/passenger-auth-provider';

const GREEN='#10B981'; const BG='#F7F9F8'; const SURFACE='#FFFFFF'; const TEXT='#101828'; const MUTED='#667085'; const LINE='#E4E7EC';

function timeLabel(value:string){return new Intl.DateTimeFormat('en-ZA',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));}

export default function ConversationScreen(){
  const router=useRouter();
  const params=useLocalSearchParams<{email?:string}>();
  const {session,user}=usePassengerAuth();
  const recipientEmail=typeof params.email==='string'?params.email:'';
  const [name,setName]=useState(recipientEmail);
  const [route,setRoute]=useState('');
  const [messages,setMessages]=useState<MobileMessage[]>([]);
  const [body,setBody]=useState('');
  const [loading,setLoading]=useState(Boolean(session&&recipientEmail));
  const [sending,setSending]=useState(false);
  const [error,setError]=useState<string|null>(null);

  const myEmail=(user?.email??'').toLowerCase();
  const canSend=body.trim().length>0&&!sending;

  useEffect(()=>{
    if(!session||!recipientEmail)return;
    let active=true;
    fetchMobileConversation(session,recipientEmail)
      .then((response)=>{
        if(!active)return;
        setName(response.conversation.participant.name);
        setRoute(response.conversation.participant.route);
        setMessages(response.conversation.messages);
      })
      .catch((reason:unknown)=>{if(active)setError(reason instanceof Error?reason.message:'Unable to load conversation');})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[recipientEmail,session]);

  const ordered=useMemo(()=>messages,[messages]);

  async function submit(){
    if(!session||!canSend)return;
    setSending(true); setError(null);
    try{
      const response=await sendMobileMessage(session,{recipientEmail,body:body.trim()});
      setMessages((current)=>[...current,response.message]);
      setBody('');
    }catch(reason){setError(reason instanceof Error?reason.message:'Unable to send message');}
    finally{setSending(false);}
  }

  return <SafeAreaView style={styles.safe}>
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={()=>router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
        <View style={{flex:1}}><Text style={styles.title}>{name}</Text><Text style={styles.route}>{route}</Text></View>
      </View>

      {loading?<View style={styles.center}><ActivityIndicator color={GREEN}/></View>:
      <ScrollView style={{flex:1}} contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
        {ordered.length?ordered.map((message)=>{
          const mine=message.senderEmail.toLowerCase()===myEmail;
          return <View key={message.id} style={[styles.bubbleRow,mine&&styles.bubbleRowMine]}>
            <View style={[styles.bubble,mine?styles.bubbleMine:styles.bubbleOther]}>
              <Text style={[styles.body,mine&&styles.bodyMine]}>{message.body}</Text>
              <Text style={[styles.time,mine&&styles.timeMine]}>{timeLabel(message.sentAt)}</Text>
            </View>
          </View>;
        }):<View style={styles.empty}><Text style={styles.emptyTitle}>Start the conversation</Text><Text style={styles.emptyText}>You are connected because of a shared Vaya trip.</Text></View>}
      </ScrollView>}

      {error?<View style={styles.error}><Text style={styles.errorText}>{error}</Text></View>:null}

      <View style={styles.composer}>
        <TextInput value={body} onChangeText={setBody} placeholder="Write a message..." placeholderTextColor="#98A2B3" style={styles.input} multiline maxLength={2000}/>
        <Pressable disabled={!canSend} onPress={()=>void submit()} style={[styles.send,!canSend&&styles.disabled]}>{sending?<ActivityIndicator color="#FFFFFF"/>:<Text style={styles.sendText}>↑</Text>}</Pressable>
      </View>
    </View>
  </SafeAreaView>;
}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:BG},page:{flex:1,paddingHorizontal:14,paddingTop:8,paddingBottom:8},header:{flexDirection:'row',alignItems:'center',gap:10,paddingBottom:10,borderBottomWidth:1,borderBottomColor:LINE},back:{width:38,height:38,borderRadius:11,backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,alignItems:'center',justifyContent:'center'},backText:{color:TEXT,fontSize:29,lineHeight:29,marginTop:-3},title:{color:TEXT,fontSize:14,fontWeight:'900'},route:{color:'#087F5B',fontSize:8,marginTop:2,fontWeight:'800'},
 center:{flex:1,alignItems:'center',justifyContent:'center'},messages:{paddingVertical:14,gap:8},bubbleRow:{alignItems:'flex-start'},bubbleRowMine:{alignItems:'flex-end'},bubble:{maxWidth:'80%',borderRadius:14,paddingHorizontal:11,paddingVertical:8},bubbleMine:{backgroundColor:GREEN,borderBottomRightRadius:4},bubbleOther:{backgroundColor:SURFACE,borderWidth:1,borderColor:LINE,borderBottomLeftRadius:4},body:{color:TEXT,fontSize:10,lineHeight:15},bodyMine:{color:'#FFFFFF'},time:{color:MUTED,fontSize:7,marginTop:4,alignSelf:'flex-end'},timeMine:{color:'#D7F5E8'},empty:{minHeight:180,alignItems:'center',justifyContent:'center',padding:20},emptyTitle:{color:TEXT,fontSize:12,fontWeight:'900'},emptyText:{color:MUTED,fontSize:9,marginTop:4,textAlign:'center'},
 composer:{flexDirection:'row',alignItems:'flex-end',gap:8,paddingTop:8,borderTopWidth:1,borderTopColor:LINE},input:{flex:1,maxHeight:110,minHeight:44,borderWidth:1,borderColor:LINE,borderRadius:14,backgroundColor:SURFACE,paddingHorizontal:12,paddingVertical:10,color:TEXT,fontSize:10},send:{width:44,height:44,borderRadius:22,backgroundColor:GREEN,alignItems:'center',justifyContent:'center'},sendText:{color:'#FFFFFF',fontSize:20,fontWeight:'900'},disabled:{opacity:.45},error:{marginBottom:7,borderRadius:10,backgroundColor:'#FFF1F0',padding:9},errorText:{color:'#B42318',fontSize:8.5}
});
