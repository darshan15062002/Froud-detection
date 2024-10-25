const Transaction = require("../model/transactionModel");
const express = require("express")
const User = require("../model/userModel");
const sendNotification = require("../utils/sendNotification");
const router = express.Router()

class FraudDetectionService {
    static async processTransaction(transactionData, user) {
        // Calculate risk score
        const riskScore = await user.calculateTransactionRisk(transactionData);
        console.log("darshan3", riskScore);

        // Create transaction record
        const transaction = new Transaction({
            userId: user._id,
            amount: transactionData.amount,
            location: transactionData.location,
            deviceInfo: transactionData.deviceInfo,
            riskScore: riskScore
        });

        // Determine if verification is needed
        if (riskScore > 0.7) {
            transaction.status = 'pending';
            transaction.verificationDetails.required = true;

            // Send notification to user"
            console.log("fraud detetcted");
            sendNotification(user.pushToken, { callId: "hello", callerName: user?.name })
            // await NotificationService.sendVerificationRequest(user, transaction);
        } else {
            transaction.status = 'completed';
            transaction.verificationDetails.method = 'none';
            console.log("no fraud detetcted");

            // Update user patterns for successful transaction
            await user.updateTransactionPatterns(transactionData);
        }

        await transaction.save();
        return transaction;
    }
}

// Notification Service for Firebase
class NotificationService {
    static async sendVerificationRequest(user, transaction) {
        if (!user.pushToken) {
            throw new Error('User push token not found');
        }

        const message = {
            notification: {
                title: 'Verification Required',
                body: `Unusual transaction of ${transaction.amount} detected. Please verify to proceed.`
            },
            data: {
                type: 'VERIFICATION_REQUIRED',
                transactionId: transaction._id.toString(),
                amount: transaction.amount.toString(),
                timestamp: new Date().toISOString()
            },
            token: user.pushToken
        };

        try {
            await admin.messaging().send(message);
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    }
}

router.post('/transaction', async (req, res) => {
    try {
        const { userId, amount, location, deviceInfo } = req.body;

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        console.log(amount, location, deviceInfo, "darshan");

        // Process transaction
        const transaction = await FraudDetectionService.processTransaction(
            { amount, location, deviceInfo },
            user
        );

        console.log(transaction, "darshan1");


        // Return appropriate response
        if (transaction.verificationDetails.required) {
            return res.status(200).json({
                status: 'verification_required',
                transactionId: transaction._id,
                message: 'Please verify your identity to complete this transaction'
            });
        }

        return res.status(200).json({
            status: 'completed',
            transactionId: transaction._id,
            message: 'Transaction processed successfully'
        });

    } catch (error) {
        console.error('Transaction error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// WebRTC Verification Endpoint
router.post('/verify-transaction/:transactionId', async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { verified, verificationMethod = 'webrtc' } = req.body;

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const user = await User.findById(transaction.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (verified) {
            transaction.status = 'completed';
            transaction.verificationDetails = {
                required: true,
                verifiedAt: new Date(),
                method: verificationMethod,
                verifiedBy: user._id
            };

            // Update user patterns after successful verification
            await user.updateTransactionPatterns({
                amount: transaction.amount,
                location: transaction.location,
                timestamp: new Date(),
                deviceId: transaction.deviceInfo.deviceId
            });
        } else {
            transaction.status = 'rejected';
        }

        await transaction.save();

        return res.status(200).json({
            status: transaction.status,
            transactionId: transaction._id,
            message: verified ?
                'Transaction verified and completed successfully' :
                'Transaction rejected'
        });

    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
