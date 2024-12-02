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
            let CUSTNAME = req.body.CUSTNAME;
            // כרטסת
            let procStepResult = await priority.procStart('ACCOUNTS', 'P', null, req.body.credentials.profile.company);
            procStepResult = await procStepResult.proc.reportOptions(1,0);
            // get the select values
            /*
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
*/

            /**/
            var year = new Date().getFullYear();
            year = req.body.YEAR || year;
            var fromdate = new Date(year, 0, 1);
            // returns the month (from 0 to 11)
            var month = fromdate.getMonth() + 1;
            if (month < 10) month = "0" + month;
            // returns the day of the month (from 1 to 31)
            var day = fromdate.getDate();
            if (day < 10) day = "0" + day;
            // returns the year (four digits)
            var year =  fromdate.getFullYear();

            var fromdateformatted = day+"/"+month+"/"+ year.toString().substring(2,4);
            var todate = new Date();
            // returns the month (from 0 to 11)
            var month = todate.getMonth() + 1;
            if (month < 10) month = "0" + month;
            // returns the day of the month (from 1 to 31)
            var day = todate.getDate();
            if (day < 10) day = "0" + day;
            // returns the year (four digits)
            var year =  todate.getFullYear();
            var todateformatted = day+"/"+month+"/"+ year.toString().substring(2,4);
            var data = {EditFields: [
                    {field: 1, op: 0, value: fromdateformatted},
                    {field: 2, op: 0, value: todateformatted},
                    {field: 3, op: 0, value: req.body.credentials.language == 1 ? 'כרטסת לקוחות'  :  'A/R Ledger' },       //'A/R Ledger'},
                    {field: 4, op: 0, value: req.body.CODE || 'ש"ח'},   // need to get the base currency of the system somehow...
                    {field: 5, op: 0, value: req.body.credentials.language == 1 ? 'תאריך אסמכתא' : 'Transaction Date' }, //'Transaction Date'},
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
router.get('/',function(resq,res){
    res.send('This slug works only with POST method, Make sure to post credentials in the below format: <br>' + JSON.stringify(helper.getCredentails()));
});
module.exports = router;


