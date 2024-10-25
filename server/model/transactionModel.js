const { default: mongoose } = require("mongoose");

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    deviceInfo: {
        deviceId: String,
        deviceType: String,
        browser: String,
        os: String
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'completed'],
        default: 'pending'
    },
    riskScore: {
        type: Number,
        default: 0
    },
    verificationDetails: {
        required: {
            type: Boolean,
            default: false
        },
        verifiedAt: Date,
        verifiedBy: String,
        method: {
            type: String,
            enum: ['webrtc', 'otp', 'none'],
            default: 'none'
        }
    }
}, {
    timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;