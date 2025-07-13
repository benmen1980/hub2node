// routes/updateOrder.js
const express = require('express');
const router = express.Router();
const { getSecretByToken } = require('../services/aws.service');
const { updatePriorityOrder } = require('../services/priority.service');

// GET /updateOrder?customer=xyz&token=abc123&orderId=SO25000299
router.get('/', async (req, res) => {
    const { customer, token, orderId , orderStatus } = req.query;

    if (!customer || !token || !orderId) {
        return res.status(400).json({ message: 'customer, token, and orderId are required' });
    }

    try {
        // customer and token will be created manually in AWS Secrets Manager
        const userToken = `${customer}_${token}`;
        const creds = await getSecretByToken(userToken);

        if (!creds || !creds.username || !creds.password) {
            return res.status(404).json({ message: 'Token not verified' });
        }

        const result = await updatePriorityOrder(creds.username, creds.password, orderId, orderStatus);

        res.json({
            message: 'Priority order updated successfully',
            result
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
