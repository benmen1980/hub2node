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
    (async () => {
        try{
           // let loginResp = await priority.login(helper.getCredentails()); // req.body.credentials
            let loginResp = await priority.login(req.body.credentials); //
        }catch(error){
            res.statusCode = 400;
            console.log(req.body.credentials);
            res.send(
                'Priority module failed to start\n' + error.message + '\n Make sure to post credentials in the below format\n' + JSON.stringify(helper.getCredentails())
            );
            return;
        }
        try {
            let url = '';
            let CUSTNAME = '999';
            // כרטסת
            let procStepResult = await priority.procStart('ACCOUNTS', 'P', null, 'demo');
            //console.log(procStepResult.input);
            // get the select values
            let ChooseProps = {};
            ChooseProps.ChooseFields = [];
            ChooseProps.ChooseFields[0] = {
                field: 3,
                value: ""
            };
            const procChoose = await procStepResult.proc.choose(5, '', ChooseProps);
            // The returned object can contain either search or choose results - your code should support both
            if(procChoose.Search.SearchLine === undefined){
                //  console.log(procChoose.Search.ChooseLine)
            } else {
                //   console.log(procChoose.Search.SearchLine)
            }
            /**/
            var data = {EditFields: [
                    {field: 1, op: 0, value: '01/01/21'},
                    {field: 2, op: 0, value: '31/12/22'},
                    {field: 3, op: 0, value: 'A/R Ledger'},
                    {field: 4, op: 0, value: 'ILS'},   // need to get the base currency of the system somehow...
                    {field: 5, op: 0, value: 'Transaction Date'},
                    {field: 6, op: 0, value: ''},
                    {field: 7, op: 0, value: ''}
                ]};
            procStepResult = await procStepResult.proc.inputFields(1, data);
            // second input step
            //console.log(procStepResult.input);
            var data = {EditFields: [
                    {field: 1, op: 0, value: CUSTNAME},
                    {field: 2, op: 0, value: ''},
                    {field: 3, op: 0, value: ''},
                    {field: 4, op: 0, value: ''}
                ]};
            procStepResult = await procStepResult.proc.inputFields(1, data);
            url = procStepResult.Urls[0].url;
            res.json(
                {'report_url' : url}
            );
        }catch(error){
            res.statusCode = 400;
            res.send(
                'app.post.accounts\n' + error.message
            );
        }
    })();
});
module.exports = router;


