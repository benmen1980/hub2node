const express = require('express');
const router = express.Router();
const priority = require('priority-web-sdk');
const bodyParser = require('body-parser');

// Middleware for parsing JSON
const jsonParser = bodyParser.json();

/* POST request handler */
router.post('/', jsonParser, async (req, res) => {
    try {
        // Call the webSDK function and handle its response
        const data = await webSDK(req);
        if (data?.error) {
            return res.status(409).json(data.error);
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/* GET request handler (for testing purposes) */
router.get('/', (req, res) => {
    res.send(
        'This service works only with POST method. Make sure to post credentials in the format: <br>' +
        '"IVNUM": "IV123456", "credentials": { "username": "user", "password": "pass", "environment": "env" }'
    );
});

module.exports = router;

async function webSDK(req) {
    // Extract IVNUM from the request body
    const IVNUM = req.body.IVNUM;

    // Check if IVNUM is provided
    if (!IVNUM) {
        return {
            error: {
                type: 'apiError',
                code: 'missingParameter',
                message: 'IVNUM is required in the request body.',
            },
        };
    }

    // Define the search filter using IVNUM from the request body
    const filter = {
        or: 0,
        ignorecase: 1,
        QueryValues: [
            {
                field: 'IVNUM',
                fromval: IVNUM,
                op: '=',
                sort: 0,
                isdesc: 0,
            },
        ],
    };

    try {
        // Attempt to log in to Priority with credentials from the request body
        await priority.login(req.body.credentials);

        // Starting the form interaction
        const form = await priority.formStart("TINVOICES", () => {}, () => {}, 'demo', 0);

        // Setting filter and retrieving data
        await form.setSearchFilter(filter);
        await form.getRows(1);
        await form.setActiveRow(1);

        // Activating form procedure
        const activateResult = await form.activateStart('CLOSETIV', 'P');
        const procMessage = await activateResult.proc.message(1);

        // Confirming any warning
        await form.warningConfirm(1);

        // Ending the form session
        await form.endCurrentForm();

        // Return the result as a plain object (no circular references)
        return {
            message: 'Form interaction completed successfully.',
            procMessage,
            inputs: activateResult.proc.inputs,
            formats: activateResult.proc.formats,
            wordTemplates: activateResult.proc.wordTemplates,
        };
    } catch (error) {
        // Return structured error response from Priority SDK
        if (error?.type === 'apiError') {
            return { error };
        }

        // Return any other general errors
        return {
            error: {
                type: 'apiError',
                code: 'unknownError',
                message: error.message || 'An unknown error occurred.',
            },
        };
    }
}

