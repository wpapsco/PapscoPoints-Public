var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var basicAuth = require('express-basic-auth');
var request = require('request');
var functions = require('./routes/functions');
var { spawn, exec, execFile } = require('child_process');
var startminecraftserver = require('./routes/minecraftserver');
var bot = require('./bot/botmain');
var sqlhelper = require('./sqlhelper');

var save = require('./routes/save');
var index = require('./routes/index');
var getpage = require('./routes/get');
var twitchsignin = require('./routes/twitchsignin');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
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

// function startBot() {
//   var child = execFile("java", ["-jar", "PapscoPointsBot.jar"], function (error) {
//     if (error) throw error;
//   });
//   child.on('exit', function (code, signal) {
//     startBot();
//   });
// }

// startBot();

// dbpool.getConnection(function (err, connection) {
//   if (err) throw err;
//   var sql = "SELECT * FROM channel_settings WHERE is_running = 1;"
//   connection.query(sql, function (err, rows) {
//     for (var i = 0; i < rows.length; i++) {
//       var req = { dbpool, cookies: { username: channel } }
//       var channel = rows[i].channel;
//       functions.setBotRunning(req, true);
//       var child = execFile("java", ["-jar", "PapscoPoints.jar", channel], function (error) {
//         if (error) throw error;
//       });
//       child.on('exit', function (code, signal) {
//         functions.setBotRunning(req, false);
//       });
//     }
//     connection.release();
//   });
// });

app.use(function (req, res, next) {
  req.dbpool = dbpool;
  console.log('****CONNECTION INFO****');
  console.log('all connections:  ' + dbpool._allConnections.length);
  console.log('free connections: ' + dbpool._freeConnections.length);
  next();
});

app.use((req, res, next) => {
  req.helper = sqlhelper.gethelper(req.dbpool);
  req.bot = bot.start(req.dbpool);
  next();
})

app.use('/get', getpage);
app.use('/test', index);
app.use('/save', save);
app.use('/twitchsignin', twitchsignin);
app.use('/logout', function (req, res) {
  res.clearCookie('username');
  res.clearCookie('hash');
  res.redirect('/');
});
app.use('/streamlabssignup', function (req, res) { //TODO: test (should work tho I think)
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
    });
  });
});

app.use('/minecraftserver', basicAuth({
  users: { 'pleasesir': 'canihavesomeminecraftsir' },
  challenge: true,
}), startminecraftserver);

app.use((req, res) => res.sendFile(`${__dirname}/public/index.html`));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
