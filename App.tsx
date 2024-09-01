/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useRef, useState} from 'react';

import {
  ActivityIndicator,
  Button,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCView,
} from 'react-native-webrtc';
import {io, Socket} from 'socket.io-client';
import {loadUser, loadUserList, login} from './src/hook/api';
import LocalNotification from './src/localNotification/LocalNotification';
import RemoteNotification from './src/remoteNotification/RemoteNotification';

interface RoomJoinedData {
  room_id: any;
}

function App(): React.JSX.Element {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomJoin, setRoomJoin] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteEmailId, setRemoteEmailId] = useState<String>();
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [EventMessage, setEventMessage] = useState<String>('');
  const [localMicOn, setlocalMicOn] = useState(true);
  const [localWebcamOn, setlocalWebcamOn] = useState(true);
  const [password, setPassword] = useState();
  const [phone, setPhone] = useState();
  const [me, setMe] = useState({});
  const [loading, setLoading] = useState(false);
  const [userList, setUserList] = useState([]);
  // const [email, setEmail] = useState<string>(''); // State for storing the user-entered email
  // const [roomId, setRoomId] = useState<string>('');
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const generateRandomString = (length = 8) => {
    return Math.random()
      .toString(36)
      .substring(2, 2 + length);
  };

  // create socket connection and emit with email and code
  const handleMakeConnection = (email, roomId) => {
    try {
      console.log(email, roomId);

      if (socket) {
        // const roomId = generateRandomString(10);
        // const email = `user${generateRandomString(5)}@example.com`;

        setEventMessage('Connecting...');

        console.log('click');
        socket.emit('join_room', {room_id: roomId, email_id: email});
        console.log('click');
      }
    } catch (error) {
      console.log(error);
    }
  };

  // --------------------------------------------------------------------------------
  // when there is new user with same code on server this even trigger
  // we create offer and send buy socket newly arrived user
  const createOffer = async () => {
    try {
      const offer = await peerConnection.current.createOffer({});
      await peerConnection.current.setLocalDescription(offer);
      console.log('offer send to peer');
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      // Handle error appropriately
    }
  };

  const handleNewUserJoin = async ({email_id}: any) => {
    if (socket) {
      const offer = await createOffer();
      console.log('new USer Arrive ');
      socket.emit('call_user', {email_id, offer});
      setRemoteEmailId(email_id);
    }
  };
  // --------------------------------------------------------------------------------------

  // --------------------------------------------------------------------------------------
  // when  newly arrive user receive offer he create ans
  // and send back to user who start calling
  const createAns = async (offer: any) => {
    try {
      // console.log('offer recived to peer', offer);
      const offerDescription = new RTCSessionDescription(offer);
      await peerConnection.current.setRemoteDescription(offerDescription);
      const answerDescription = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answerDescription);
      console.log('answer send to peer');
      return answerDescription;
    } catch (error) {
      console.error('Error creating ans:', error);
    }
  };
  const handleIncommingCall = async (data: any) => {
    if (socket) {
      const {fromEmail, offer} = data;
      const ans = await createAns(offer);

      socket.emit('call_accepted', {email_id: fromEmail, ans});
      setRemoteEmailId(fromEmail);
    }
  };
  // --------------------------------------------------------------------------------------

  // --------------------------------------------------------------------------------------
  // when call accepted user Receive the ans of offer
  // set to there remote description
  const handleCallAccepted = async ({ans}: any) => {
    if (peerConnection.current) {
      try {
        console.log('answer recived from peer');

        const answerDescription = new RTCSessionDescription(ans);
        await peerConnection.current.setRemoteDescription(answerDescription);
      } catch (error) {
        console.error('Error setting setRemoteDescription:', error);
      }
    }
  };
  // --------------------------------------------------------------------------------------

  // --------------------------------------------------------------------------------------
  // when user get connected  with socket by  code and email
  // we get joined_room Event
  // than we start camera and set Room join
  useEffect(() => {
    if (socket) {
      const startStream = async () => {
        try {
          const _stream = await mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
            },
            audio: true,
          });

          setStream(_stream);

          // Add each track from the local stream to the peer connection
          _stream.getTracks().forEach(track => {
            peerConnection.current.addTrack(track, _stream);
          });

          // Set the stream to be shown locally in the RTCView
          console.log('Local stream added:', _stream);
        } catch (error) {
          console.error('Error accessing media devices.', error);
        }
      };

      const handleRoomJoined = (data: RoomJoinedData) => {
        setRoomJoin(data.room_id);
        setEventMessage('');
        startStream();
      };

      socket.on('joined_room', handleRoomJoined);

      return () => {
        socket.off('joined_room', handleRoomJoined);
        socket.disconnect(); // Ensure proper disconnection
      };
    }
  }, [socket]);
  // --------------------------------------------------------------------------------------

  useEffect(() => {
    if (socket) {
      socket.on('user_joined', handleNewUserJoin);
      socket.on('incomming_call', handleIncommingCall);
      socket.on('call_accepted', handleCallAccepted);
      socket.on('ice_candidate', async ({candidate}) => {
        try {
          if (candidate) {
            console.log('Received ICE candidate:', candidate);
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(candidate),
            );
          }
        } catch (error) {
          console.error('Error adding received ICE candidate', error);
        }
      });

      return () => {
        socket.off('user_joined', handleNewUserJoin);
        socket.off('incomming_call', handleIncommingCall);
        socket.off('call_accepted', handleCallAccepted);
        socket.on('ice_candidate', async ({candidate}) => {
          console.log('Received ICE candidate:', candidate);
          try {
            if (candidate) {
              console.log('Received ICE candidate:', candidate);
              await peerConnection.current.addIceCandidate(
                new RTCIceCandidate(candidate),
              );
            }
          } catch (error) {
            console.error('Error adding received ICE candidate', error);
          }
        });
      };
    }
  }, [socket]);

  useEffect(() => {
    if (socket && peerConnection.current) {
      peerConnection.current.onicecandidate = event => {
        console.log('ice candidate sended', event, remoteEmailId);
        if (event.candidate && remoteEmailId) {
          socket.emit('ice_candidate', {
            email_id: remoteEmailId,
            candidate: event.candidate,
          });
        }
      };

      peerConnection.current.ontrack = event => {
        console.log('Track received:', event.streams);
        const [remoteStream] = event.streams;

        if (remoteStream) {
          console.log('Setting remote stream:', remoteStream);
          setRemoteStream(remoteStream);
        }
      };

      peerConnection.current.onconnectionstatechange = () => {
        const connectionState = peerConnection.current.connectionState;
        console.log('Connection State:', connectionState);
        if (connectionState === 'connected') {
          console.log('Peers connected');
        } else if (
          connectionState === 'disconnected' ||
          connectionState === 'failed'
        ) {
          console.log('Connection failed or disconnected');
        }
      };
    }
  }, [socket, peerConnection, remoteEmailId]);

  useEffect(() => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302',
        },
        {
          urls: 'stun:stun1.l.google.com:19302',
        },
        {
          urls: 'stun:stun2.l.google.com:19302',
        },
      ],
    });

    const _socket = io('https://ice-server-socket.onrender.com');
    // const _socket = io('http://10.0.2.2:8000');
    // _socket.emit('set-status', {code});
    setSocket(_socket);
  }, []);

  const handleLogin = async () => {
    if (!phone && !password) return;
    setLoading(true);
    const res = await login(phone, password);
    console.log(res, 'darsha');
    setLoading(false);
  };

  useEffect(() => {
    const unsub = async () => {
      setLoading(true);
      const data = await loadUser();

      setMe(data?.user);
      if (data?.user) {
        const {users} = await loadUserList();

        setUserList(users);
      }
      setLoading(false);
    };
    unsub();
  }, []);

  const handleHagout = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      setStream(null);
      setRemoteStream(null);
      setRoomJoin('');
    }
  };

  function toggleMic() {
    if (stream) {
      setlocalMicOn(prev => !prev);
      stream.getAudioTracks().forEach(track => {
        localMicOn ? (track.enabled = false) : (track.enabled = true);
      });
    }
  }

  // Switch Camera
  // function switchCamera() {
  //   localStream.getVideoTracks().forEach((track) => {
  //     track._switchCamera();
  //   });
  // }

  // Enable/Disable Camera
  function toggleCamera() {
    if (stream) {
      setlocalWebcamOn(prev => !prev);
      stream.getVideoTracks().forEach(track => {
        localWebcamOn ? (track.enabled = false) : (track.enabled = true);
      });
    }
  }

  function switchCamera() {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track._switchCamera();
      });
    }
  }

  useEffect(() => {
    const handleOpenURL = event => {
      const url = event.url;
      // Parse the URL to get parameters
      const {code, phone} = new URL(url).searchParams;

      if (code && phone) {
        // Navigate to the room or handle the logic to join the room
        handleMakeConnection(phone, code);
      }
    };

    Linking.addEventListener('url', handleOpenURL);

    // Check if the app was opened via a link
    Linking.getInitialURL().then(url => {
      if (url) {
        handleOpenURL({url});
      }
    });

    return () => {
      // Linking.removeAllListener('url', handleOpenURL);
    };
  }, []);
  if (loading)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: 'black',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {/* <Button title={'Click Here'} onPress={LocalNotification} /> */}
        <ActivityIndicator size="large" color="#00ff00" />
      </View>
    );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: 'black',
      }}>
      {EventMessage && (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{color: 'white'}}>{EventMessage}</Text>
        </View>
      )}

      {!remoteStream && localWebcamOn && stream && (
        <RTCView
          style={{flex: 1}}
          streamURL={stream?.toURL() || ''}
          objectFit={'cover'}
        />
      )}
      {remoteStream && (
        <>
          <RTCView
            streamURL={remoteStream?.toURL() || ''}
            style={{flex: 1}}
            objectFit={'cover'}
            mirror={true}
          />
          {stream && localWebcamOn && (
            <RTCView
              streamURL={stream?.toURL() || ''}
              style={{
                height: 150,
                width: 100,
                position: 'absolute',
                top: 20,
                right: 20,
              }}
              objectFit="cover"
              mirror={true}
            />
          )}
        </>
      )}

      {(remoteStream || stream) && (
        <View
          style={{
            height: 100,
            width: '100%',
            position: 'absolute',
            bottom: 0,
            backgroundColor: 'black',
            opacity: 0.7, // Slightly increased for better visibility
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around', // Space the buttons evenly
            paddingHorizontal: 20,
          }}>
          {/* Mic Toggle Button */}
          <TouchableOpacity onPress={toggleMic}>
            <Icon
              name={localMicOn ? 'microphone' : 'microphone-slash'}
              size={30}
              color="white"
            />
          </TouchableOpacity>

          {/* Speaker Toggle Button */}
          <TouchableOpacity onPress={toggleCamera}>
            <Icon name={'camera'} size={30} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}}>
            <Icon name={'share-alt'} size={30} color="white" />
          </TouchableOpacity>

          {/* Call End Button */}
          <TouchableOpacity
            onPress={handleHagout}
            style={{
              backgroundColor: 'red',
              borderRadius: 50,
              paddingVertical: 10,
              paddingHorizontal: 15,
            }}>
            <Icon name="phone" size={30} color="white" />
          </TouchableOpacity>

          {/* Three Dots Menu Button */}
          <TouchableOpacity onPress={() => {}}>
            <Icon name="ellipsis-v" size={30} color="white" />
          </TouchableOpacity>
        </View>
      )}
      {userList && !roomJoin && (
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-start',
            marginTop: 20,
          }}>
          {!EventMessage &&
            userList.map(item => (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: 'gray',
                  borderRadius: 10,
                  marginHorizontal: 10,
                  alignItems: 'center',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
                key={item?.phone}>
                <Text style={{color: 'white'}}>{item?.name}</Text>
                <TouchableOpacity
                  onPress={() => handleMakeConnection(item?.phone, item?.code)}
                  style={{
                    backgroundColor: 'green',
                    borderRadius: 50,
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                  }}>
                  <Icon name="phone" size={30} color="white" />
                </TouchableOpacity>
              </View>
            ))}
        </View>
      )}
      <RemoteNotification />
      {/* <Button title={'Click Here'} onPress={LocalNotification} /> */}
      {!me && !EventMessage && (
        <View
          style={{
            width: '100%',
            position: 'absolute',
            bottom: 40,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <TextInput
            style={styles.input}
            placeholder="Enter your Phone no"
            placeholderTextColor="#888"
            onChangeText={setPhone}
            value={phone}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#888"
            onChangeText={setPassword}
            value={password}
          />

          <Button title="Login" onPress={handleLogin} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    padding: 20,
  },
  input: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    width: '70%',
    paddingHorizontal: 10,
    color: 'white',
  },
});

export default App;
