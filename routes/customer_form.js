var express = require('express');
var router = express.Router();

// serve your css as static
router.use(express.static(__dirname));
/* GET  listing. */
router.get('/', function(req, res, next) {
    let appRoot = process.env.PWD;
    res.sendFile('views/customer_form.html',{root: '.'});
});

module.exports = router;