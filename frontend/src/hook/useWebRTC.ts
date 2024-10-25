import {useEffect, useRef, useState} from 'react';
import {mediaDevices, RTCPeerConnection, MediaStream} from 'react-native-webrtc';
import { Socket } from 'socket.io-client';

export const useWebRTC = (socket: Socket | null) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection>(
    new RTCPeerConnection({
      iceServers: [
        {urls: 'stun:stun.l.google.com:19302'},
        {urls: 'stun:stun1.l.google.com:19302'},
      ],
    })
  );

  useEffect(() => {
    const startStream = async () => {
      const _stream = await mediaDevices.getUserMedia({
        video: {facingMode: 'user'},
        audio: true,
      });
      setStream(_stream);
      _stream.getTracks().forEach(track => peerConnection.current.addTrack(track, _stream));
    };

    socket?.on('joined_room', () => startStream());
  }, [socket]);

  return {stream, remoteStream, peerConnection, setRemoteStream};
};
