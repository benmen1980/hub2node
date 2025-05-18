var createError = require('http-errors');
var https = require('https');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var pjson = require('./package.json');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var accountsRouter = require('./routes/accounts');
var agent_debtRouter = require('./routes/agent_debt');
var printAinvoiceRouter = require('./routes/printAinvoice');
var printEinvoiceRouter = require('./routes/printEinvoice');
var printCinvoiceRouter = require('./routes/printCinvoice');
var printSalesOrderRouter = require('./routes/printSalesOrder');
var printPriceQuoteRouter = require('./routes/printPriceQuote');
var closeAinvoicesRouter = require('./routes/closeAinvoices');
const closeTinvoicesRouter = require('./routes/closeTinvoices');
var customer_formRouter = require('./routes/customer_form');
var wsCargo = require('./routes/ws/cargo');
//var sheferRouter = require('./routes/shefer/app');

var app = express();

// Fetch the public IP

function fetchPublicIP(callback) {
  https.get('https://checkip.amazonaws.com/', (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      callback(null, data.trim());
    });
  }).on('error', (err) => {
    callback(err, null);
  });
}

// Middleware to add public IP to locals

app.use((req, res, next) => {
  fetchPublicIP((err, publicIP) => {
    if (err) {
      console.error('Error fetching public IP:', err);
      res.locals.publicIP = 'Unable to fetch IP';
    } else {
      res.locals.publicIP = publicIP;
    }
    next();
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/accounts', accountsRouter);
app.use('/agent_debt', agent_debtRouter);
app.use('/printAinvoice', printAinvoiceRouter);
app.use('/printEinvoice', printEinvoiceRouter);
app.use('/printCinvoice', printCinvoiceRouter);
app.use('/printSalesOrder', printSalesOrderRouter);
app.use('/printPriceQuote', printPriceQuoteRouter);
app.use('/closeAinvoices', closeAinvoicesRouter);
app.use('/closeTinvoices', closeTinvoicesRouter);
app.use('/customer_form', customer_formRouter);
app.use('/ws/cargo',wsCargo);
//app.use('/shefer/app',sheferRouter);

// Static route for generated PDFs

app.use('/pdfs', express.static(path.join(__dirname, 'routes', 'tmp')));


// catch 404 and forward to error handler

app.use(function(req, res, next) {
  console.log("Reached 404 middleware - route not matched.");
  next(createError(404));
});

// error handler

app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
