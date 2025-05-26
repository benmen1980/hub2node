const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const priority = require('priority-web-sdk');
const helper = require('./helper');
const os = require('os');

// Body parsers
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// POST route
router.post('/', async function (req, res) {
    try {
        // Login to Priority
        await priority.login(req.body.credentials);
    } catch (error) {
        res.status(400).send(
            'Priority module failed to start\n' + error.message +
            '\n Make sure to post credentials in the below format\n' +
            JSON.stringify(helper.getCredentails())
        );
        return;
    }

    try {
        let url = '';
        const AGENTCODE = req.body.AGENTCODE;
        const CUSTNAME = req.body.CUSTNAME;

        // Start procedure
        let procStepResult = await priority.procStart('AGENT_AGEDEBTCUST', 'P', null, req.body.credentials.profile.company);
        procStepResult = await procStepResult.proc.reportOptions(1, 0);

        // parameters 1
        const data = {
            EditFields: [
                { field: 1, op: 0, value:  procStepResult.input.EditFields[0].value}

            ]
        };

        procStepResult = await procStepResult.proc.inputFields(1, data);

        // -------- Second screen --------
        const data2 = {
            EditFields: [
                { field: 1, op: 0, value: procStepResult.input.EditFields[0].value },
                { field: 2, op: 0, value: procStepResult.input.EditFields[1].value }
                /*,
                { field: 3, op: 0, value: '' },
                { field: 4, op: 0, value: AGENTCODE } */
            ]
        };

        procStepResult = await procStepResult.proc.inputFields(1, data2);


        // -------- Third screen --------
        const data3 = {
            EditFields: [
                { field: 1, op: 0, value: CUSTNAME },
                { field: 2, op: 0, value: '' },
                { field: 3, op: 0, value: '' },
                { field: 4, op: 0, value: AGENTCODE }
            ]
        };

        procStepResult = await procStepResult.proc.inputFields(1, data3);


        // -------- Get report URL --------
        url = procStepResult.Urls[0].url;

        // -------- Check if PDF generation is requested --------
        if (req.body.pdf === true || req.body.pdf === 'true') {
            const tmpDir = path.join(__dirname, 'tmp');
            const fileName = `ar_ledger_${Date.now()}.pdf`;
            const filePath = path.join(tmpDir, fileName);

            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir);
            }

            try {
                const isLinux = os.platform() === 'linux';

                const browser = await puppeteer.launch({
                    headless: 'new',
                    executablePath: isLinux ? '/usr/bin/google-chrome-stable' : undefined,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });

                const page = await browser.newPage();
                await page.goto(url, { waitUntil: 'networkidle0' });

                await page.pdf({
                    path: filePath,
                    format: 'A4',
                    printBackground: true
                });

                await browser.close();

                const publicUrl = `${req.protocol}://${req.get('host')}/pdfs/${fileName}`;
                return res.json({
                    report_url: url,
                    pdf_url: publicUrl
                });

            } catch (pdfError) {
                console.error("PDF Generation Failed", pdfError);
                return res.status(500).send('Failed to generate PDF from report URL');
            }
        }

        // -------- Return report URL only --------
        res.json({ report_url: url });

    } catch (error) {
        console.error("Error in /accounts:", error);
        res.status(400).send('app.post.accounts\n' + error.message);
    }
});

// Help page for GET
router.get('/', function (req, res) {
    res.send('This slug works only with POST method. Post credentials in the format:<br>' +
        JSON.stringify(helper.getCredentails()));
});

module.exports = router;
