const express = require('express');
const request = require('request'); // Import the request library
const router = express.Router();

// Environment variables or fallback values
const API_URL = process.env.API_URL || 'https://prioritydev4.simplyct.co.il/odata/Priority/tabula.ini,2/demo/CHNGDOCUMENTS_D';
const API_USER = process.env.API_USER || 'API';
const API_PASSWORD = process.env.API_PASSWORD || '1234567';
const AUTH_HEADER = `Basic ${Buffer.from(`${API_USER}:${API_PASSWORD}`).toString('base64')}`;

// GET request for /ws/cargo
router.get('/', (req, res) => {
    res.send('This is the /ws/cargo endpoint!');
});

// POST request for /ws/cargo
router.post('/', (req, res) => {
    const clientData = req.body; // Access the parsed JSON body
    console.log('Received JSON:', clientData);


    // Check if shipment_id and status_code exist in clientData
    if (!clientData.shipment_id || !clientData.status_code) {
        console.error('Error: Missing required fields in client data.');
        return res.status(400).json({
            error: 'Missing required fields: shipment_id and status_code must be provided.'
        });
    }

    // Create options for the PATCH request
    const options = {
        method: 'PATCH',
        url: API_URL,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': AUTH_HEADER
        },
        body: JSON.stringify({
            ROYY_CARGOSHIPMENTID: clientData.shipment_id || '12345', // Use client data or default
            ROYY_CARGOSTATIS: parseInt(clientData.status_code, 10) || 7 // Use client data or default
        })
    };

    // Make the PATCH request
    request(options, function (error, response) {
        if (error) {
            console.error('Error making PATCH request:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }

        console.log('Response from external API:', response.body);

        // Send response back to the client
        res.status(response.statusCode).json({
            message: 'Data sent to external API successfully',
            externalApiResponse: JSON.parse(response.body)
        });
    });
});

module.exports = router;
