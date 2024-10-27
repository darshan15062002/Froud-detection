import { useEffect } from "react";
import messaging from '@react-native-firebase/messaging';
import { sendTokenToServer } from "../hook/api";

import { showIncomingCallNotification } from "../localNotification/LocalNotification";
import { useUser } from "../hook/useUser";

const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
    if (enabled) {
      console.log('Authorization status:', authStatus);
    } else {
      console.warn('Notification permission not granted.');
    }
  };
const RemoteNotification = () => {
  const {setCode} = useUser()
    useEffect(() => {
      // Request permission for notifications
      requestUserPermission();
  
      // Get FCM token
      const getFCMToken = async () => {
        const token = await messaging().getToken();
        if (token) {
          console.log('FCM Token:', token);
          await sendTokenToServer(token); // Send token to your server
        }
      };
  
      // Register FCM token
      getFCMToken();
  
      // Handle foreground messages
      const unsubscribe = messaging().onMessage(async (remoteMessage) => {
        console.log('A new FCM message arrived!', remoteMessage);
      
        const { data } = remoteMessage;
        setCode(data?.code)
        console.log(data?.code, "code ---------------------------------------", );
        console.log("darshan remote",data);
        

        if (remoteMessage.data.type === 'call') {
          showIncomingCallNotification()
        }

      });

      
  
      // Clean up the listener on unmount
      return unsubscribe;
    }, []);
  
    return null;
  };
  export default RemoteNotification;
  
