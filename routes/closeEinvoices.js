var express = require('express');
var router = express.Router();
const priority = require('priority-web-sdk');
let bodyParser = require('body-parser');

// Middleware for parsing JSON
const jsonParser = bodyParser.json();

// Debug middleware
router.use((req, res, next) => {
    console.log('--- Debug Middleware ---');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Body:', req.body); // Note: this may need `body-parser` or `express.json` to run first
    console.log('------------------------');
    next();
});

/* POST request handler */
router.post('/', jsonParser, async (req, res) => {
    try {
        // Call the webSDK function and handle its response
        const data = await   webSDK(req);
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

let capturedMessage = null;

async function onShowMessageFunc(message){
    console.log('Priority Message:', message.message);
    //message.form.warningConfirm(1);
    message.form.infoMsgConfirm();
    capturedMessage = message.message;
    return {
        error: {
            type: 'Priority Error',
            code: '',
            message: message.message || 'An unknown error occurred.',
        }
    };
};
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
        ignorecase:1,
        QueryValues: [
            {
                field: 'IVNUM',
                fromval: IVNUM,
                toval: null,
                op: '=',
                sort: 0,
                isdesc: 0
            },
        ],
    };
    try {
        console.log('Attempting to log in...');
        await priority.login(req.body.credentials);
        console.log("Your are in!! Enjoy!");
        // Starting the form interaction
        const form = await priority.formStart("EINVOICES", onShowMessageFunc, () => {
        }, req.body.credentials.profile.company, 0);
        // Setting filter and retrieving data
        await form.setSearchFilter(filter);
        let rowsResult = await form.getRows(1);
        // **Added Error Handling for Empty Rows Result**
        if (
            !rowsResult ||
            !rowsResult.EINVOICES ||
            (typeof rowsResult.EINVOICES === 'object' && Object.keys(rowsResult.EINVOICES).length === 0)
        ) {
            throw new Error(`Error: There is no invoice with IVNUM "${IVNUM}" to close.`);
        }
        const activeRowResult = await form.setActiveRow(1);
        // Activating form procedure
        const activateResult = await form.activateStart('CLOSEANINVOICE', 'P');
        const activateEnd = await form.activateEnd();
        rowsResult = await form.getRows(1);
        // Confirming any warning
        const procMessage = await form.warningConfirm(1);
        //const procMessage = await activateResult.proc.message(1);

        // Ending the form session
        await form.endCurrentForm();

        // Return the result as a plain object (no circular references)
        return {
            message: capturedMessage || 'Form interaction completed successfully.',
            ivnum : rowsResult.EINVOICES["1"].IVNUM,
            procMessage,
            inputs: activateResult.proc.inputs,
            formats: activateResult.proc.formats,
            wordTemplates: activateResult.proc.wordTemplates,
        };
    } catch (error) {
        // Return structured error response from Priority SDK
        if (error?.type === 'apiError') {
            return {error};
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

