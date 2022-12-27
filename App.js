/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import {
  SafeAreaView,
  Text,
  PermissionsAndroid,
  View,
  Button,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Alert,
  TextInput,
  ToastAndroid,
} from 'react-native';
import { RTCPeerConnection,RTCSessionDescription,mediaDevices } from 'react-native-webrtc';
import { io } from 'socket.io-client';
import { getUniqueId } from 'react-native-device-info';
import { Tab,ListItem, Avatar } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import crypt from './helpers';
import config from './config.json';
import axios from 'axios';
const MICROPHONE = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
const premissions = async () => {
  try {
    const request = await PermissionsAndroid.request(MICROPHONE,{
        title: 'Microphone',
        message: 'Microphone need for call',
        buttonPositive: 'Accept',
        buttonNegative: 'Deny',
        buttonNeutral: 'Cancel',
      },
    );
    if (request != PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert("دسترسی مردود شد","از بخش تنظیمات دسترسی میکرفون را فعال کنید",[
        {text:"لغو",onPress:()=>{},style:"cancel"},
        {text:"تنظیمات",onPress:()=>Linking.openSettings()}
      ]);
    }
  } catch (err) {
    Alert.alert("دسترسی مردود شد","از بخش تنظیمات دسترسی میکرفون را فعال کنید",[
      {text:"لغو",onPress:()=>{},style:"cancel"},
      {text:"تنظیمات",onPress:()=>Linking.openSettings()}
    ]);
  }
};
const streamer = async () => {
  let remoteCandidate = [];
  let ices = new RTCPeerConnection({
    iceServers : [
      { urls: "stun:call.applygermany.net:3478"},
    ],
    iceCandidatePoolSize: 10,
  });
  ices.addEventListener("connectionstatechange",event=>{
    console.log("state change : ",event,ices.connectionState); // close event occures
  });
  ices.addEventListener("icecandidate",event=>{
    if (!event.candidate){
      event = new RTCIceCandidate(event.candidate);
      if (ices.remoteDescription == null){
        remoteCandidate.push(event);
      } else {
        ices.addIceCandidate(event);
      }
    }
  });
  ices.addEventListener("iceconnectionstatechange",event=>{
    console.log("ice state : ",event,ices.iceConnectionState); // connected,completed
  });
  ices.addEventListener("icecandidateerror",event=>{
    console.log("ice state : ",event);
  });
  ices.addEventListener("negotiationneeded",event=>{
    console.log("nego state : ",event);
  });
  ices.addEventListener("signalingstatechange",state=>{
    console.log("signal state : ",ices.signalingState); // closed
  });
  ices.addEventListener("addstream",event=>{
    console.log("added stream : ",event.stream);
  });
  mediaDevices.getUserMedia({audio:true}).then((stream)=>{
    let videoTrack = stream.getVideoTracks()[ 0 ];
    if (videoTrack) {
      videoTrack.enabled = false;
    }
    stream.getTracks().forEach(track => {
      ices.addTrack(track,stream);
    });
  }).catch((err)=>{
    console.log("error :",err);
  });
  let offer = await ices.createOffer({mandatory:{ // send it 
    OfferToReceiveAudio:true
  }});
  await ices.setLocalDescription(offer);



  // received 
  let answergiven  = new RTCSessionDescription(answer);
  await ices.setRemoteDescription(answergiven);

  // send offer on other side
  let offerDescriptions = new RTCSessionDescription(offer);
  await ices.setRemoteDescription(offerDescriptions);
  let answer = await ices.createAnswer({mandatory:{ // send it 
    OfferToReceiveAudio:true
  }});
  await ices.setLocalDescription(answer);
  if ( remoteCandidate.length > 1 ) { // use both side 
    remoteCandidate.map( candidate => ices.addIceCandidate( candidate ) );
	  remoteCandidate = [];
  };
  let test2 = new RTCSessionDescription(test1);
  await ices.setRemoteDescription(test2);
}
const Login = ({socket}) => {
  const [user,setUser] = React.useState(0);
  const [pass,setPass] = React.useState(0);
  const [disable,setDisable] = React.useState(false);
  const login = () => {
    setDisable(true);
    if (pass.length > 0 && user.length > 0){
      axios.post(config.api.login,{"mobile":user,"password":pass})
        .catch((err)=>{
          setDisable(false);
          ToastAndroid.show("مشکلی رخ داده است",ToastAndroid.SHORT)
        })
        .then((response)=>{
          if (response.data.status){
            AsyncStorage.setItem("login",
            JSON.stringify({"user":user,"pass":pass,"token":response.data.token}));
            return <MainApp socket={socket}/>
          } else {
            setDisable(false);
            ToastAndroid.show(response.data.msg,ToastAndroid.SHORT)
          }
        });
    } else {
      setDisable(false);
      ToastAndroid.show("تمام فیلد ها را پر کنید",ToastAndroid.SHORT)
    }
  };
  return (
    <SafeAreaView style={styles.activity}>
      <View>
        <TextInput style={styles.input} placeholder="ایمیل" onChangeText={setUser} value={user}/>
        <TextInput style={styles.input} secureTextEntry={true} placeholder="پسورد" onChangeText={setPass} value={pass}/>
        {disable ? <ActivityIndicator /> : <Button disabled={disable} style={{textAlign:"center"}} title="ورود" onPress={login}/>}
      </View>
    </SafeAreaView>
  );
}
function CallScreen({socket}){
  const last_calls = React.useRef(0);
  socket.current.emit("get_last_calls");
  socket.current.on("get_last_calls",(data)=>{
    last_calls.current = data;
  });
  const list = [
    {
      name: 'Amy Farha',
      avatar_url: 'https://s3.amazonaws.com/uifaces/faces/twitter/ladylexy/128.jpg',
      subtitle: 'Vice President'
    },
    {
      name: 'Chris Jackson',
      avatar_url: 'https://s3.amazonaws.com/uifaces/faces/twitter/adhamdannaway/128.jpg',
      subtitle: 'Vice Chairman'
    },
  ];
  return (
  <View>
    { last_calls.current.length > 0 ? 
      list.map((l, i) => (
        <ListItem key={i} bottomDivider>
          <Avatar source={{uri: l.avatar_url}} />
          <ListItem.Content>
            <ListItem.Title>{l.name}</ListItem.Title>
            <ListItem.Subtitle>{l.subtitle}</ListItem.Subtitle>
          </ListItem.Content>
        </ListItem>
      ))
      :
      <View>
        <Text style={{textAlign:"center",alignItems:"center",justifyContent:"center"}}>لیست خالی می باشد</Text>
      </View>
    }
  </View> );
};
function ProfileScreen({socket}){
  const [id,setId] = React.useState(0);
  const request_call = () => {
    if (String(id).length < 2){
      ToastAndroid.show("ایدی کاربر خالی می باشد",ToastAndroid.SHORT);
      return;
    }
    socket.current.emit("validate_id",id);
    socket.current.on("validate_id",(result)=>{
      if (result == 0){
        ToastAndroid.show("چنین کاربری وجود ندارد");
        return;
      }
    });
  };
  return (
    <View style={styles.activity}>
      <TextInput placeholder='ایدی کاربر' style={styles.input} onChange={setId}/>
      <Button title="تماس" onPress={request_call}/>
    </View>
  );
}
const MainApp = ({socket}) => {
  React.useEffect(()=>{
    async function check_premission(){
      let premission = await PermissionsAndroid.check(MICROPHONE);
      if (!premission){
        await premissions();
        Alert.alert("دسترسی مردود شد","از بخش تنظیمات دسترسی میکرفون را فعال کنید",[
          {text:"لغو",onPress:()=>{},style:"cancel"},
          {text:"تنظیمات",onPress:()=>Linking.openSettings()}
        ]);
      }
    }
    check_premission();
  },[]);
  const [index,setIndex] = React.useState(0);
  return (
    <>
      <Tab value={index} onChange={setIndex}>
        <Tab.Item>لیست</Tab.Item>
        <Tab.Item>خانه</Tab.Item>
      </Tab>
      { !index ? <CallScreen socket={socket }/>: <ProfileScreen socket={socket} />}
    </>
  );
};
const App = () => {
  const [connect,setConnect] = React.useState(0);
  const [login,setLogin] = React.useState(0);
  const [id,setId] = React.useState(0);
  React.useEffect(()=>{
    async function getInfos(){
      var loginInfo = await AsyncStorage.getItem("login");
      if (loginInfo !== null){
        setLogin(loginInfo);
      }
      setId(await getUniqueId());
    }
    getInfos();
  },[]);
  var options = {
    secure:true,
    transports:["websocket","polling"],path:"/rtc",
    withCredentials:true,
    auth: {
      token: crypt.encrypt(id+"@@applygermany@@rtc@@"+new Date().getTime(),"uid"),
      check: crypt.encrypt(id+"@@validate-token@@rtc@@"+new Date().getTime(),"uid_checker"),
    }
  }
  const socket = React.useRef(0);
  socket.current = io("https://call.applygermany.net",options); 
  socket.current.on("connect",()=>{
    setConnect(1);
  });
  socket.current.on("reconnect",() => {
    setConnect(1);
  });
  socket.current.on("disconnect",()=>{
    setConnect(0);
  });
  return (
    <>
      {
        connect ? login ? <MainApp socket={socket}/> : <Login socket={socket}/> : 
        <View style={styles.activity}>
          <ActivityIndicator />
          <Text>در حال اتصال</Text>
        </View>
      }
    </>
  );
};

const styles = StyleSheet.create({
  activity:{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding:10,
    paddingLeft:100
  },
});
export default App;
