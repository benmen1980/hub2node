var express = require('express');
var router = express.Router();
let bodyParser = require('body-parser');
// create application/json parser
let jsonParser = bodyParser.json();
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })
// Priority and utils
const priority = require('priority-web-sdk');
const helper = require('./helper');
const s3Service = require('../services/s3.service');
const priorityPdfFetcher = require('../utils/priorityPdfFetcher');

/* POST to retrieve priority ACCOUNTS Procedure */
router.post('/', function (req, res, next) {
    webSDK(req).then(data => {
        //  if(data.message) res.statusCode = 409;
        res.json(
            {
                'order_url': data.url,
                's3_url': data.s3_url,
                'message': data.message,
                'inputs': data.inputs,
                'formats': data.formats,
                'wordTemplates': data.wordTemplates
            }
        );
    });
});
router.get('/', function (req, res) {
    res.send('This service works only with POST method, Make sure to post credentials in the below format(the FORMAT is optioanl): <br>' + '"ORDNAME":"IV123456","FORMAT":"-7,"' + JSON.stringify(helper.getCredentails()));
});
module.exports = router;
async function webSDK(req) {
    try {
        const loginResponse = await priority.login(req.body.credentials);
        console.log("Your are in!! Enjoy!");

        // WWWSHOWAIV is for printing Sales Invoices. Other types of invoices
        // use other printout programs.
        let procedure = await priority.procStart("WWWSHOWORDER", "P", null);
        let procInput = procedure.input;
        let procWordTemplate;
        //procedure = await procedure.proc.inputOptions(1 , 1);
        // Provide your own invoice number for testing puproses.
        // The value of field 2 (Sort) must match the language you are working in
        let ORDNAME = req.body.ORDNAME;
        let field2 = procedure.input.EditFields[1].value;
        var data = {
            EditFields: [
                { field: 1, op: 0, value: ORDNAME },
                { field: 2, op: 0, value: field2 }
            ]
        };

        procedure = await procedure.proc.inputFields(1, data);
        let procFormats = procedure.formats;
        procedure = await procedure.proc.documentOptions(1, req.body.FORMAT || -4, { pdf: 1, word: false, mode: 'display' });
        if (procedure.messagetype == 'error') {
            return { 'message': procedure.message, 'formats': procFormats, 'wordTemplates': procWordTemplate };
        }
        let url = procedure?.Urls?.[0]?.url ?? '';
        if(!url) return {'message' : 'something went wrong...url is empty'};
        let s3Url = '';
        try {
            console.log('Attempting to fetch PDF with new login flow...');
            const pdfBuffer = await priorityPdfFetcher.fetchPriorityPdf(
                url,
                req.body.credentials.username,
                req.body.credentials.password
            );
            s3Url = await s3Service.uploadPdfBuffer(pdfBuffer, `SalesOrder_${ORDNAME}_${Date.now()}`, 'pdfs');
        } catch (e) {
            console.log('PDF fetch/upload failed:', e.message);
        }
        return { 'url': url, 's3_url': s3Url, 'formats': procFormats, 'wordTemplates': procWordTemplate };
    } catch (reason) {
        return reason;
    }
}
module.exports = router;





