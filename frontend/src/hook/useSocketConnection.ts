import {useState, useEffect, useRef} from 'react';
import {io, Socket} from 'socket.io-client';

export const useSocketConnection = (
  handleNewUserJoin: (data: any) => void,
  handleIncommingCall: (data: any) => void,
  handleCallAccepted: (data: any) => void
) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const _socket = io('https://froud-detection.onrender.com');
    setSocket(_socket);

    return () => {
      _socket.disconnect();  // Ensure proper cleanup
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('user_joined', handleNewUserJoin);
      socket.on('incomming_call', handleIncommingCall);
      socket.on('call_accepted', handleCallAccepted);

      return () => {
        socket.off('user_joined', handleNewUserJoin);
        socket.off('incomming_call', handleIncommingCall);
        socket.off('call_accepted', handleCallAccepted);
      };
    }
  }, [socket]);

  return socket;
};
