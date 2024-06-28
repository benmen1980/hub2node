var express = require('express');
const pjson = require("../package.json");
var router = express.Router();
/* GET home page. */
router.get('/', function(req, res, next) {
    var year = 2013;
    var date = new Date(year, 0, 1);
    console.log(date.toLocaleDateString());

  res.render('index', { title: 'Priority Node service by SImplyCT',
                                      version: pjson.version });
});

module.exports = router;
