/**
 * @format
 */

import { AppRegistry, DeviceEventEmitter, Linking } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import { showIncomingCallNotification } from './src/localNotification/LocalNotification';
import RNNotificationCall from 'react-native-full-screen-notification-incoming-call';
import { loadUser } from './src/hook/api';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';


let code = null
notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.ACTION_PRESS) {
        if (detail.pressAction.id === 'answer') {
            // Handle answering the call
            console.log('User answered the call');
            const userData = await loadUser();
            console.log(userData?.user?.phone, userData?.user?.code);

            if (userData?.user) {
                const phone = userData.user.phone;
                const roomId = userData.user.code;
                console.log(code, "code ---------------------------------------", roomId);

                const link = `videocall://video-call/${phone}/${code || roomId}`;
                console.log(link);

                // Open the deep link
                Linking.openURL(link)
                    .catch(err => console.error('Failed to open URL:', err));

                console.log("Call connection successful");

            }
        } else if (detail.pressAction.id === 'decline') {
            // Handle declining the call
            console.log('User declined the call');
        }
    }
});


messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Message handled in the background!', remoteMessage);

    const { data } = remoteMessage;
    console.log("darshan remote", data);
    if (data && data.type === 'call') {  // Ensure it's a call notification
        console.log('Displaying incoming call:', data);

        code = data.code
        showIncomingCallNotification()




    }
});




// Register the main application component
AppRegistry.registerComponent(appName, () => App);




