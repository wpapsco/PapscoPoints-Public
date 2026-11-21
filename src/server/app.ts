//import { Express } from "express"
import express = require('express');
import { Req } from '../types';
import getpage from './routes/get';
import save from './routes/save';
import twitchsignin from './routes/twitchsignin';
import path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var basicAuth = require('express-basic-auth');
var request = require('request');
var startminecraftserver = require('./routes/minecraftserver');
var bot = require('../bot/botmain').default;
var sqlhelper = require('../sqlhelper').default;

var index = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'src', 'server', 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname + "/../../express", 'public', 'favicon.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname + "/../../express", 'public')));
// app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

var dbpool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.AWS_DB_CONNECTION,
  user: process.env.AWS_DB_USER,
  password: process.env.AWS_DB_PASSWORD,
  database: 'settings',
  multipleStatements: true
});

app.use(function (req: any, res, next) {
  req.dbpool = dbpool;
  console.log('****CONNECTION INFO****');
  console.log('all connections:  ' + dbpool._allConnections.length);
  console.log('free connections: ' + dbpool._freeConnections.length);
  next();
});

const helper = new sqlhelper(dbpool);
const _bot = bot(dbpool)
app.use((req: any, res, next) => {
  req.helper = helper
  req.bot = _bot;
  next();
})

app.use('/get', getpage);
app.use('/save', save);
app.use('/test', index);
app.use('/twitchsignin', twitchsignin);
app.use('/logout', function (req, res) {
  res.clearCookie('username');
  res.clearCookie('hash');
  res.redirect('/');
});
app.use('/streamlabssignup', function (req: Req, res) { //TODO: test (should work tho I think)
  var options = {
    method: 'POST',
    url: 'https://streamlabs.com/api/v1.0/token',
    headers: {
      'postman-token': 'a88e4a21-a790-3078-041a-40e06d3604ee',
      'cache-control': 'no-cache',
      'content-type': 'application/x-www-form-urlencoded',
      client_secret: '2DYzfnKBWaCH2X4e2Isu4BXuPUd9kDC3qznG8xOb',
      client_id: 'F9HckpMwb4rG7EnnrlMFnLgt1hwuMsBwPTnJxQH4',
      grant_type: 'authorization_code'
    }, form: {
      grant_type: 'authorization_code',
      client_id: 'F9HckpMwb4rG7EnnrlMFnLgt1hwuMsBwPTnJxQH4',
      client_secret: '2DYzfnKBWaCH2X4e2Isu4BXuPUd9kDC3qznG8xOb',
      redirect_uri: "http://www.papscopoints.com/streamlabssignup",
      code: req.query.code
    }
  };
  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    var access_token = JSON.parse(body).access_token;
    var refresh_token = JSON.parse(body).refresh_token;
    var expires_in = JSON.parse(body).expires_in;
    var options2 = {
      method: 'GET',
      url: 'https://streamlabs.com/api/v1.0/user?access_token=' + access_token
    };
    console.log(body);
    if (body.error == "invalid_request") {
      return;
    }
    console.log(access_token);
    console.log(refresh_token);
    request(options2, function (err, resp, bo) {
      if (err) throw new Error(err);
      console.log(bo);
      var channel = JSON.parse(bo).twitch.name;
      const obj = {
        channel,
        code: access_token,
        refresh_token,
        expires_in,
        created_at: new Date(),
      }
      req.helper.insert(obj, 'streamlabs_keys')
        .then(() => res.redirect('/settingss'))
    });
  });
});

app.use('/minecraftserver', basicAuth({
  users: { 'pleasesir': 'canihavesomeminecraftsir' },
  challenge: true,
}), startminecraftserver);
app.use((req, res) => {
  res.sendFile(path.normalize(path.join(__dirname + "/../../express", 'public', 'index.html')))
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err: any = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  console.log(err);
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
  res.send(err);
});

module.exports = app;
