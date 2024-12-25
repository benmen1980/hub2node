const express = require('express');
const request = require('request'); // Import the request library
const router = express.Router();

// POST request for /ws/cargo
router.post('/', (req, res) => {
    const clientData = req.body; // Access the parsed JSON body
    console.log('Received JSON:', clientData);

    // Create options for the PATCH request
    const options = {
        method: 'PATCH',
        url: process.env.API_URL || 'https://prioritydev4.simplyct.co.il/odata/Priority/tabula.ini,2/demo/CHNGDOCUMENTS_D',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${process.env.API_USER || 'API'}:${process.env.API_PASSWORD || '1234567'}`).toString('base64')}`
        },
        body: JSON.stringify({
            ROYY_CARGOSHIPMENTID: clientData.shipment_id || '12345',
            ROYY_CARGOSTATIS: parseInt(clientData.status_code, 10) || 7
        })
    };

    // Make the PATCH request
    request(options, (error, response, body) => {
        if (error) {
            console.error('Error making PATCH request:', error);
            return res.status(500).json({
                error: 'Internal server error',
                details: error.message || 'An unexpected error occurred'
            });
        }

        // Handle specific HTTP status codes
        const statusCode = response.statusCode;

        if (statusCode === 401) {
            console.warn('Authorization error during PATCH request:', body);
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication failed for the external API',
                details: body
            });
        } else if (statusCode >= 400) {
            console.warn(`External API error with status ${statusCode}:`, body);
            return res.status(statusCode).json({
                error: `External API Error (Status ${statusCode})`,
                message: body || 'Unknown error occurred with the external API'
            });
        }

        // Attempt to parse the API response
        let apiResponse;
        try {
            apiResponse = JSON.parse(body);
        } catch (parseError) {
            console.error('Error parsing response:', parseError);
            return res.status(500).json({
                error: 'Invalid response from external API',
                details: body || 'Response body was not valid JSON'
            });
        }

        console.log('Response from external API:', apiResponse);

        // Send response back to the client
        res.status(200).json({
            message: 'Data sent to external API successfully',
            externalApiResponse: apiResponse
        });
    });
});

module.exports = router;
