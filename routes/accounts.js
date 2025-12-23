const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
// const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const priority = require('priority-web-sdk');
const helper = require('./helper');
const os = require('os');
const html_to_pdf = require('html-pdf-node');

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
        const CUSTNAME = req.body.CUSTNAME;

        // Start procedure
        let procStepResult = await priority.procStart('ACCOUNTS', 'P', null, req.body.credentials.profile.company);
        procStepResult = await procStepResult.proc.reportOptions(1, 0);

        // -------- Date Logic --------
        const now = new Date();
        let fromDate = null;
        let toDate = null;

        const isValidDateFormat = (str) => /^\d{2}-\d{2}-\d{2}$/.test(str);

        const parseInputDate = (str) => {
            if (!isValidDateFormat(str)) return null;
            const [day, month, year] = str.split('-');
            const fullYear = parseInt(year, 10) + 2000;
            const date = new Date(`${fullYear}-${month}-${day}`);
            return isNaN(date.getTime()) ? null : date;
        };

        if (req.body.from_date && req.body.to_date) {
            const parsedFrom = parseInputDate(req.body.from_date);
            const parsedTo = parseInputDate(req.body.to_date);

            if (!parsedFrom || !parsedTo) {
                return res.status(400).send('Invalid date format. Use dd-mm-yy (e.g., 15-05-25).');
            }

            if (parsedFrom > parsedTo) {
                return res.status(400).send('Invalid date range: from_date must be before or equal to to_date.');
            }
            parsedFrom.setDate(1);
            fromDate = parsedFrom;
            toDate = parsedTo;
        } else {
            const year = req.body.YEAR || now.getFullYear();
            fromDate = new Date(year, 0, 1);
            toDate = now;
        }

        const formatDate = (d) => {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = String(d.getFullYear()).slice(2);
            return `${day}/${month}/${year}`;
        };

        const fromdateformatted = formatDate(fromDate);
        const todateformatted = formatDate(toDate);

        // -------- First screen --------
        const data1 = {
            EditFields: [
                { field: 1, op: 0, value: fromdateformatted },
                { field: 2, op: 0, value: todateformatted },
                {
                    field: 3, op: 0,
                    value: req.body.credentials.language == 1 ? 'כרטסת לקוחות' : 'A/R Ledger'
                },
                { field: 4, op: 0, value: req.body.CODE || 'ש"ח' },
                {
                    field: 5, op: 0,
                    value: req.body.credentials.language == 1 ? 'תאריך אסמכתא' : 'Transaction Date'
                },
                { field: 6, op: 0, value: '' },
                { field: 7, op: 0, value: '' }
            ]
        };

        procStepResult = await procStepResult.proc.inputFields(1, data1);

        // -------- Second screen --------
        const data2 = {
            EditFields: [
                { field: 1, op: 0, value: CUSTNAME },
                { field: 2, op: 0, value: '' },
                { field: 3, op: 0, value: '' },
                { field: 4, op: 0, value: '' }
            ]
        };

        procStepResult = await procStepResult.proc.inputFields(1, data2);

        // -------- Get report URL --------
        url = procStepResult.Urls[0].url;

        // -------- Check if PDF generation is requested --------
        // if (req.body.pdf === true || req.body.pdf === 'true') {
        //     const tmpDir = path.join(__dirname, 'tmp');
        //     const fileName = `ar_ledger_${Date.now()}.pdf`;
        //     const filePath = path.join(tmpDir, fileName);

        //     if (!fs.existsSync(tmpDir)) {
        //         fs.mkdirSync(tmpDir);
        //     }

        //     try {
        //         const isLinux = os.platform() === 'linux';

        //         const browser = await puppeteer.launch({
        //             headless: 'new',
        //             executablePath: isLinux ? '/usr/bin/google-chrome-stable' : undefined,
        //             args: ['--no-sandbox', '--disable-setuid-sandbox']
        //         });

        //         const page = await browser.newPage();
        //         await page.goto(url, { waitUntil: 'networkidle0' });

        //         await page.pdf({
        //             path: filePath,
        //             format: 'A4',
        //             printBackground: true
        //         });

        //         await browser.close();

        //         const publicUrl = `${req.protocol}://${req.get('host')}/pdfs/${fileName}`;
        //         return res.json({
        //             report_url: url,
        //             pdf_url: publicUrl
        //         });

        //     } catch (pdfError) {
        //         console.error("PDF Generation Failed", pdfError);
        //         return res.status(500).send('Failed to generate PDF from report URL');
        //     }
        // }

        if (req.body.pdf === true || req.body.pdf === 'true') {
            const tmpDir = path.join(__dirname, 'tmp');
            const fileName = `ar_ledger_${Date.now()}.pdf`;
            const filePath = path.join(tmpDir, fileName);

            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir);
            }

            try {
                const file = { url: url };
                const options = {
                    format: 'A4',
                    printBackground: true
                };

                const pdfBuffer = await html_to_pdf.generatePdf(file, options);
                fs.writeFileSync(filePath, pdfBuffer);

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
