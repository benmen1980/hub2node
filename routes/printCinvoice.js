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

router.post('/', function(req, res, next) {
    webSDK(req).then(data => {
        //  if(data.message) res.statusCode = 409;
        res.json(
            {'invoice_url' : data.url,
                'message': data.message,
                'inputs' : data.inputs,
                'formats' : data.formats,
                'wordTemplates' : data.wordTemplates
            }
        );});
});
router.get('/',function(req,res){
    res.send('This service works only with POST method, Make sure to post credentials in the below format: <br>' + '"IVNUM":"IV123456",' + JSON.stringify( helper.getCredentails()));
});
module.exports = router;
async function webSDK(req) {
    try {
        await priority.login(req.body.credentials);
        console.log("Your are in!! Enjoy!");

        // WWWSHOWAIV is for printing Sales Invoices. Other types of invoices
        // use other printout programs.
        let procFormats ;
        let procWordTemplate ;
        let procedure = await priority.procStart("WWWSHOWCIV", "P", null);
        let ChooseProps = {};
        ChooseProps.ChooseFields = [];
        ChooseProps.ChooseFields[0] = {
            field: 1,
            value: ""
        };
        const procChoose = await procedure.proc.choose(3, '', ChooseProps);
        let procInput = procedure.input;
        let field2 = procedure.input.EditFields[1].value;
        let field3 = procChoose.Search.ChooseLine[0].retval;
        procedure = await procedure.proc.inputOptions(1 , 1);
        // Provide your own invoice number for testing puproses.
        // The value of field 2 (Sort) must match the language you are working in
        let IVNUM = req.body.IVNUM;
        var data = {EditFields: [
                {field: 1, op: 0, value: IVNUM},
                {field: 2, op: 0, value: ''},
                {field: 3, op: 0, value: field3}
            ]};

        procedure = await procedure.proc.inputFields(1 , data);
        if(procedure.messagetype == 'error'){
            return {'message' : procedure.message,'inputs': procInput ,'formats' : procFormats, 'wordTemplates' : procWordTemplate};
        }
        procedure = await procedure.proc.clientContinue();
        procFormats =  procedure.formats;
        procedure = await procedure.proc.documentOptions(1, -4,{pdf : 1,word :  false, mode: 'display'});
        procWordTemplate = procedure.wordTemplates;
        console.log(procedure.Urls[0].url);
        let url = await procedure.Urls[0].url;
        procedure = await procedure.proc.continueProc();
        await procedure.proc.cancel()
        return {'url' : url,'inputs': procInput ,'formats' : procFormats, 'wordTemplates' : procWordTemplate};
    } catch (reason) {
        return reason;
    }
}
module.exports = router;





