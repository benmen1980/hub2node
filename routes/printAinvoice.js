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
/* POST to retrieve priority ACCOUNTS Procedure */
router.post('/', function(req, res, next) {
    let url =  webSDK(req).then(url => {
        res.json(
        {'report_url' : url}
    );});
});
router.get('/',function(req,res){
    res.send('This slug works only with POST method, Make sure to post credentials in the below format: <br>' + JSON.stringify(helper.getCredentails()));
});
module.exports = router;
async function webSDK(req) {
    try {
        await priority.login(req.body.credentials);
        console.log("Your are in!! Enjoy!");

        // WWWSHOWAIV is for printing Sales Invoices. Other types of invoices
        // use other printout programs.
        let procedure = await priority.procStart("WWWSHOWAIV", "P", null);
        let field2 = procedure.input.EditFields[1].value;
        procedure = await procedure.proc.inputOptions(1 , 1);
        // Provide your own invoice number for testing puproses.
        // The value of field 2 (Sort) must match the language you are working in
        let IVNAME = req.body.IVNAME;
        var data = {EditFields: [
                {field: 1, op: 0, value: IVNAME},
                {field: 2, op: 0, value: field2}
            ]};

        procedure = await procedure.proc.inputFields(1 , data);
        procedure = await procedure.proc.clientContinue();
        procedure = await procedure.proc.continueProc();
        let message = await procedure.proc.message(1, function(m){console.log(m)},function(m){console.log(m)});
        console.log(procedure.Urls[0].url);
        let url = await procedure.Urls[0].url;
        await procedure.proc.cancel()
        return url;
    } catch (reason) {
        return reason;
    }
}
module.exports = router;





