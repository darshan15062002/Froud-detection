const express = require("express")
const User = require("../model/userModel.js");
const { isAuthenticated } = require("../middleware/auth.js");
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken');
const sendNotification = require("../utils/sendNotification.js");


const router = express.Router()

const JWT_SECRET = "dfesfsdbjasfbskdebskfeksdfndfhsiduh"

router.post("/login", async (req, res) => {
    const { phone, password } = req.body;
    console.log(phone, password);

    try {
        // Check if the user exists
        let user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Check the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '15d' });

        // Store JWT in cookies
        res.cookie('token', token, { httpOnly: true });
        res.status(201).json({ token, msg: 'Login successful' });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).send('Server error');
    }
})


router.post("/register", async (req, res) => {
    const { name, phone, password, code, transactionPatterns, isSupport, trustedDevices, riskScore, securityFlags, recentTransactions, lastVerifiedActivity, } = req.body;

    try {
        // Check if the user already exists
        let user = await User.findOne({ phone });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        user = new User({
            name,
            phone,
            password: hashedPassword,
            code, transactionPatterns, isSupport, trustedDevices, riskScore, securityFlags, recentTransactions, lastVerifiedActivity

        });

        await user.save();

        res.status(201).json({ msg: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Server error');
    }
})

router.get("/user-list", isAuthenticated, async (req, res, next) => {
    try {

        const users = await User.find({ _id: { $ne: req.user._id } });


        res.status(201).json({ users });




    } catch (err) {
        console.log("ERROR in user list");
        res.status(500).send("server Error")

    }
})

router.get("/me", isAuthenticated, async (req, res, next) => {
    try {

        console.log("load user");

        if (req.user) {
            res.status(201).json({ user: req.user });
        }
        else {
            res.status(401).json({ message: "Unauthorized" });
        }







    } catch (err) {
        console.log("ERROR in user list");
        res.status(500).send("server Error")

    }
})

router.post('/save-token', isAuthenticated, async (req, res) => {
    try {
        const { token } = req.body;

        // token && sendNotification(token, { callId: "hello", callerName: "hello" })

        if (!token) {
            return res.status(400).send('Device token is required');
        }

        if (req?.user?.pushToken !== token) {
            req.user.pushToken = token
            await req.user.save()
            res.status(200).send('Device token saved successfully');
        }



        res.status(200).send('already have same token');

    } catch (error) {
        console.log("errro", error);

    }

});




module.exports = router

