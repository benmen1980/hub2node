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
    webSDK(req).then(data => {
      //  if(data.message) res.statusCode = 409;
      res.json(
        {/*'invoice_url' : data.url,
            'message': data.message,
            'inputs' : data.inputs,
            'formats' : data.formats,
            'wordTemplates' : data.wordTemplates*/
        }
    );
    });
});
router.get('/',function(req,res){
    res.send('This service works only with POST method, Make sure to post credentials in the below format: <br>' + '"IVNUM":"IV123456",' + JSON.stringify( helper.getCredentails()));
});
module.exports = router;
async function webSDK(req) {
let filter = {
    or: 0,

    ignorecase: 1,

    QueryValues: [
        {
            field: 'IVNUM',

            fromval: 'T11',

            op: '=',

            sort: 0,

            isdesc: 0,
        },
    ],
};
/*
    priority
        .login(configuration)
        .then(() =>
            priority.formStart(
                formArgv[8] || 'AINVOICES',
                null,
                null,
                configuration.profile,
                1
            )
        )
        .then(async (form) => {
            await form.setSearchFilter(filter);
            await form.getRows(1);
            await form.setActiveRow(1);
            await form.activateStart('CLOSEANINVOICE', 'P').then(async (activateFormResponse) => {
                // console.log("activateFormResponse : ", activateFormResponse.proc);
                // await form.activateEnd(async ()=>{await console.log('test1')},async()=>{await console.log('test2')});
            }).catch(err => {
                console.log("err: ", err)
            });
            // await form.activateEnd();
            await form.endCurrentForm();

        }).catch((err) => {
        console.log('catch error ' + err + JSON.stringify(err));
    });


*/

    try {

        await priority.login(req.body.credentials);
        console.log("Your are in!! Enjoy!");
        let form = await priority.formStart("AINVOICES", (message)=>{console.log(message)}, ()=>{},'demo',0);
        await form.setSearchFilter(filter);
        await form.getRows(1);
        await form.setActiveRow(1);

        await form.activateStart('CLOSEANINVOICE', 'P').
                then((result)=>{result.proc.message(1).then((result)=>{console.log(result)})});
       await form.warningConfirm(1);

        await form.endCurrentForm();
        return;


    } catch (reason) {
        return reason;
    }


}
module.exports = router;





