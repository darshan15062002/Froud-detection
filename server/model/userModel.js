const mongoose = require('mongoose');

// Sub-schema for storing location patterns
const LocationPatternSchema = new mongoose.Schema({
    location: String,
    frequency: Number,
    lastUsed: Date
}, { _id: false });

// Sub-schema for storing time patterns
const TimePatternSchema = new mongoose.Schema({
    hourOfDay: Number, // 0-23
    frequency: Number,
    lastUsed: Date
}, { _id: false });

// Sub-schema for storing device patterns
const DevicePatternSchema = new mongoose.Schema({
    deviceId: String,
    deviceInfo: {
        type: Map,
        of: String
    },
    lastUsed: Date,
    trustScore: {
        type: Number,
        default: 0
    }
}, { _id: false });

const userSchema = new mongoose.Schema({
    // Existing fields
    name: {
        type: String,
        required: true,
        trim: true,
    },
    isSupport: {
        type: Boolean,
        default: false
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
        type: String,
        unique: true,
    },
    pushToken: {
        type: String
    },

    // New fields for fraud detection
    transactionPatterns: {
        // Amount patterns
        averageTransactionAmount: {
            type: Number,
            default: 0
        },
        maxTransactionAmount: {
            type: Number,
            default: 0
        },
        standardDeviation: {
            type: Number,
            default: 0
        },

        // Location patterns
        usualLocations: [LocationPatternSchema],

        // Time patterns
        usualTransactionTimes: [TimePatternSchema],

        // Frequency patterns
        dailyTransactionLimit: {
            type: Number,
            default: 5
        },
        averageTransactionsPerDay: {
            type: Number,
            default: 0
        },
        lastTransactionDate: Date
    },

    // Security and verification
    trustedDevices: [DevicePatternSchema],
    riskScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
    },
    securityFlags: {
        isLocked: {
            type: Boolean,
            default: false
        },
        consecutiveFailedAttempts: {
            type: Number,
            default: 0
        },
        lastFailedAttempt: Date,
        requiresVerification: {
            type: Boolean,
            default: false
        }
    },

    // Recent activity tracking
    recentTransactions: [{
        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Transaction'
        },
        amount: Number,
        timestamp: Date,
        location: String,
        deviceId: String,
        status: {
            type: String,
            enum: ['completed', 'pending', 'failed', 'flagged'],
            default: 'completed'
        }
    }],
    lastVerifiedActivity: {
        timestamp: Date,
        location: String,
        deviceId: String
    }
}, {
    timestamps: true
});

// Existing phone validation
userSchema.path('phone').validate(function validatePhone() {
    return (this.phone > 999999999);
});

// New methods for fraud detection
userSchema.methods = {
    // Update transaction patterns based on new transaction
    updateTransactionPatterns: async function (transaction) {
        const patterns = this.transactionPatterns;

        // Update average amount
        const oldAvg = patterns.averageTransactionAmount;
        const n = this.recentTransactions.length;
        patterns.averageTransactionAmount =
            (oldAvg * n + transaction.amount) / (n + 1);

        // Update max amount if necessary
        patterns.maxTransactionAmount =
            Math.max(patterns.maxTransactionAmount, transaction.amount);

        // Update location patterns
        this.updateLocationPattern(transaction.location);

        // Update time patterns
        this.updateTimePattern(new Date(transaction.timestamp));

        await this.save();
    },

    // Update location patterns
    updateLocationPattern: function (location) {
        const locationPattern = this.transactionPatterns.usualLocations
            .find(l => l.location === location);

        if (locationPattern) {
            locationPattern.frequency += 1;
            locationPattern.lastUsed = new Date();
        } else {
            this.transactionPatterns.usualLocations.push({
                location,
                frequency: 1,
                lastUsed: new Date()
            });
        }
    },

    // Update time patterns
    updateTimePattern: function (timestamp) {
        const hour = timestamp instanceof Date && !isNaN(timestamp.getTime()) ? timestamp.getHours() : null;

        if (hour !== null) {
            const timePattern = this.transactionPatterns.usualTransactionTimes
                .find(t => t.hourOfDay === hour);

            if (timePattern) {
                timePattern.frequency += 1;
                timePattern.lastUsed = new Date();
            } else {
                this.transactionPatterns.usualTransactionTimes.push({
                    hourOfDay: hour,
                    frequency: 1,
                    lastUsed: new Date()
                });
            }
        } else {
            console.warn('Invalid timestamp:', timestamp);
        }
    },


    // Calculate risk score for a new transaction
    calculateTransactionRisk: function (transaction) {
        let riskScore = 0;
        const patterns = this.transactionPatterns;

        // Amount risk (30% weight)
        if (transaction.amount > patterns.maxTransactionAmount) {
            riskScore += 0.3;
        } else if (transaction.amount > patterns.averageTransactionAmount * 2) {
            riskScore += 0.15;
        }

        // Location risk (25% weight)
        const knownLocation = patterns.usualLocations
            .find(l => l.location === transaction.location);
        if (!knownLocation) {
            riskScore += 0.25;
        }

        // Time risk (20% weight)
        const hour = new Date(transaction.timestamp).getHours();
        const knownTime = patterns.usualTransactionTimes
            .find(t => t.hourOfDay === hour);
        if (!knownTime) {
            riskScore += 0.2;
        }

        // Frequency risk (25% weight)
        const recentTransactionsCount = this.recentTransactions
            .filter(t =>
                new Date(t.timestamp) >
                new Date(Date.now() - 24 * 60 * 60 * 1000)
            ).length;

        if (recentTransactionsCount >= patterns.dailyTransactionLimit) {
            riskScore += 0.25;
        }

        return Math.min(riskScore, 1);
    },

    // Add a new trusted device
    addTrustedDevice: function (deviceInfo) {
        const device = {
            deviceId: deviceInfo.deviceId,
            deviceInfo: new Map(Object.entries(deviceInfo)),
            lastUsed: new Date(),
            trustScore: 0.5 // Initial trust score
        };

        this.trustedDevices.push(device);
    }
};

const User = mongoose.model('User', userSchema);

module.exports = User;