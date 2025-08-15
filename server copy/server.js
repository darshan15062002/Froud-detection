const express = require('express')
const admin = require('firebase-admin');

require('dotenv').config()
const bodyParser = require("body-parser")
const { default: mongoose } = require('mongoose')
const app = express()
const cors = require('cors')
const cookieParser = require('cookie-parser');
const server = app.listen(process.env.PORT || 8000)
var io = require('socket.io')(server);
// var serviceAccount = require("./videocall-webrtc-d5695-firebase-adminsdk-9oe9c-ae76e2b487.json");

var serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Replace \n with actual newline characters
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: "googleapis.com"
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


mongoose.connect("mongodb+srv://darshan:$$dar$$123@cluster0.ohxhu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB:', err);
});


app.use(bodyParser.json())

app.use(express.json())
app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:3000', "https://crystal-concept-a928f.web.app"], // specify the exact origin for requests with credentials
    credentials: true,
}));



const emailToSocketMapping = new Map()
const socketToEmailMapping = new Map()
const onlineUsers = new Map();


io.on('connection', (socket) => {
    console.log("socketConnected");

    // socket.on('set-status',(data)=>{

    // })

    socket.on("join_room", async (data) => {


        const { room_id, email_id, self } = data;
        console.log("userjoin", email_id, room_id, self);


        // const user = await User.findOne({ code: room_id });
        // if (!user) return
        // console.log("founded User", user);

        const userRef = admin.firestore().collection("users").doc(email_id);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.log("Target user not found in Firestore");
            return;
        }

        const targetUser = userDoc.data();
        console.log(targetUser.pushToken, "Target user from Firestore:", targetUser.name);


        targetUser.pushToken && !self && sendNotification(targetUser.pushToken, { callId: room_id, callerName: targetUser?.name })

        socket.join(room_id)
        emailToSocketMapping.set(email_id, socket.id)
        socketToEmailMapping.set(socket.id, email_id)

        socket.emit("joined_room", { room_id })
        socket.broadcast.to(room_id).emit("user_joined", { email_id })
    })
    socket.on("call_user", data => {
        const { email_id, offer } = data
        const fromEmail = socketToEmailMapping.get(socket.id)
        const socketId = emailToSocketMapping.get(email_id)

        console.log(fromEmail, "fromEmail");
        socket.to(socketId).emit("incomming_call", { fromEmail, offer })
    })

    socket.on('call_accepted', ({ email_id, ans }) => {
        console.log("on server call Accepted recived send to", email_id);
        const socketId = emailToSocketMapping.get(email_id)
        socket.to(socketId).emit("call_accepted", { ans })
    })


    socket.on("end-call", ({ room_id }) => {
        console.log("call end", room_id);



        if (room_id) {
            console.log("call_ended end", room_id);
            socket.broadcast.to(room_id).emit("call_ended", { message: "Call has ended." });
        }
    });

    // **Add ICE Candidate Exchange Handling Here**
    socket.on('ice_candidate', ({ email_id, candidate }) => {
        console.log('ICE candidate received from:', socket.id, 'for:', email_id);
        const socketId = emailToSocketMapping.get(email_id);
        if (socketId) {
            socket.to(socketId).emit('ice_candidate', { candidate });
            console.log('ICE candidate sent to:', email_id);
        }
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
        const email_id = socketToEmailMapping.get(socket.id);
        console.log('Client disconnected:', socket.id, 'Email:', email_id);

        emailToSocketMapping.delete(email_id);
        socketToEmailMapping.delete(socket.id);
    });
})

const authRoute = require("./router/authRoute.js");
const User = require('./model/userModel.js');
const sendNotification = require('./utils/sendNotification.js');

app.use("/api/v1/", authRoute)



app.get("/", (req, res) => {
    res.send("hello ")
})

app.post("/send-notification", async (req, res) => {
    const { room_id } = req.body
    console.log("send-notification", room_id);
    try {
        const user = await User.findOne({ code: room_id });
        if (!user) return
        console.log("founded User", user);

        user.pushToken && sendNotification(user.pushToken, { callId: "hello", callerName: user?.name })
        res.status(200).json({ success: true, })
    } catch (error) {
        console.log("error in sending notification", error);
        res.status(500).json({ success: false, error })
    }
})





// app.listen(PORT, () => {
//     console.log("server is running on port 9000");
// })
// io.listen(9001, () => {
//     console.log("server is running on port 9001")
// })