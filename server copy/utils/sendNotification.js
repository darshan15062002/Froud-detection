const admin = require('firebase-admin');
const sendNotification = (deviceToken, data,) => {
    console.log("sending push notification");



    const message = {
        data: {
            type: 'call',
            callId: data.callId,
            callerName: data.callerName,
            callerAvatar: data.callerAvatar || '',
            isVideo: data.isVideo || 'true'
        },
        android: {
            priority: 'high',
            ttl: 0,
        },
        apns: {
            headers: {
                'apns-priority': '10'
            },
            payload: {
                aps: {
                    contentAvailable: true,
                },
            },
        },
        token: deviceToken,
    };

    admin.messaging().send(message)
        .then(response => {
            console.log('Successfully sent message:', response);
        })
        .catch(error => {
            console.log('Error sending message:', error);
        });
};

module.exports = sendNotification