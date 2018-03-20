var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var passport = require('passport');
var session      = require('express-session');
var cookieParser = require('cookie-parser');
var cons = require('consolidate');
var mysql = require('mysql');
var flash    = require('connect-flash');
// view engine setup


app.engine('html', cons.swig)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: false} ));
app.use(bodyParser.json());

require('./config/passport')(passport);

app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: 'user3100',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true } }));
   // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());



require('./routes/routes.js')(app, passport);
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
// error handler

app.listen(3000);
module.exports = app;
