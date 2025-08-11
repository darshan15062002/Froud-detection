const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: Number,
        required: [true, "please enter phone no"],
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    code: {
        type: String, // This can be used for user identification or room codes
        unique: true,
    },
    pushToken: {
        type: String
    }
}, {
    timestamps: true
});

userSchema.path('phone').validate(function validatePhone() {
    return (this.phone > 999999999);
});


const User = mongoose.model('User', userSchema);

module.exports = User;
