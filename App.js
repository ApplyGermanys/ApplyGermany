/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Text,
  PermissionsAndroid,
  View,
  Button,
  StyleSheet,
  TouchableHighlight,
  ActivityIndicator,
} from 'react-native';
import { io } from 'socket.io-client';
const MICROPHONE = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
import {RTCPeerConnection,RTCSessionDescription,mediaDevices} from 'react-native-webrtc';
const wait = t => new Promise(resolve=>setTimeout(resolve,t));
const premissions = async sets => {
  try {
    const request = await PermissionsAndroid.request(MICROPHONE,{
        title: 'Microphone',
        message: 'Microphone need for call',
        buttonPositive: 'Accept',
        buttonNegative: 'Deny',
        buttonNeutral: 'Cancel',
      },
    );
    if (request === PermissionsAndroid.RESULTS.GRANTED) {
      sets(1);
    } else {
      sets(0);
    }
  } catch (er) {
    sets(er);
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
const MainApp = () => {
  const [premited, setPremited] = React.useState(null);
  const [isPremited,setIsPremited] = React.useState("Premission not set");
  useEffect(()=>{
    async function check_premission(){
      let premission = await PermissionsAndroid.check(MICROPHONE);
      if (premission){
        setPremited(1);
        setIsPremited("Premission set successfuly");
      } else {
        setPremited(0);
      }
    }
    check_premission();
  },[]);
  return (
    <SafeAreaView style={styles.activity}>
      <View style={styles.activity}>
        <Button style={{textAlign:"center"}} title="درخواست تماس"/>
      </View>
    </SafeAreaView>
  );
};
const App = () => {
  const [connect,setConnect] = useState(0);
  var options = {
    secure:true,
    transports:["websocket","polling"],path:"/rtc",
    withCredentials:true,
    auth: {
      token: "faketoken"
    }
  }
  const socket = io("https://call.applygermany.net",options); 
  socket.once("connect",()=>{
    setConnect(1);
  });
  socket.on("reconnect",() => {
    setConnect(1);
  });
  socket.on("disconnect",()=>{
    setConnect(0);
  });
  return (
    <SafeAreaView style={styles.activity}>
      {
        connect ? <MainApp /> : 
        <View>
          <ActivityIndicator />
          <Text>اتصال دوباره</Text>
        </View>
      }
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  activity:{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default App;
