var express = require('express');
var router = express.Router();
/* GET home page. */
router.get('/', function(req, res, next) {
    var year = 2013;
    var date = new Date(year, 0, 1);
    console.log(date.toLocaleDateString());
  res.render('index', { title: 'Priority Node service by SImplyCT',
                                      version: process.env.npm_package_version });
});

module.exports = router;
