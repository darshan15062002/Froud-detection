const jwt = require('jsonwebtoken');
const User = require('../model/userModel.js');
const JWT_SECRET = "dfesfsdbjasfbskdebskfeksdfndfhsiduh"


exports.isAuthenticated = async (req, res, next) => {
    try {
        const { token } = req.cookies;



        // if (!token) return next(new ErrorHander("Not logged in", 401))

        const decodedData = jwt.verify(token, JWT_SECRET)


        req.user = await User.findById(decodedData.userId);
        next()
    } catch (error) {
        console.log("error isAuthenticated", error);
        res.status(401).json({ message: "Unauthorized" });
    }
}

