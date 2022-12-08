var express = require('express');
var router = express.Router();
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Priority Node service by SImplyCT',
                                      version: process.env.npm_package_version });
});

module.exports = router;
