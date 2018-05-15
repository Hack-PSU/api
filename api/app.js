/* eslint-disable import/no-unresolved,no-console */
const http = require('http');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const firebase = require('firebase-admin');
const fs = require('fs');
const nodecipher = require('node-cipher');
const cors = require('cors');
const redisAdapter = require('socket.io-redis');

/**
 * Normalize a port into a number, string, or false.
 * @param val {number | string} The port
 * @return {string | number | boolean}
 */
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

const app = express();
/**
 * Create HTTP server.
 */
const server = http.createServer(app);

// TODO: Decide if we need this
/**
 * Socket IO listener
 */
const io = require('socket.io').listen(server, {
  origin: 'http://localhost:*',
  path: '/v1/live',
  handlePreflightRequest(req, res) {
    const headers = {
      'Access-Control-Allow-Headers': 'Content-Type, idtoken',
      'Access-Control-Allow-Origin': req.headers.origin,
      'Access-Control-Allow-Credentials': true,
    };
    res.writeHead(200, headers);
    res.end();
  },
});

io.adapter(redisAdapter({
  host: 'redis-17891.c44.us-east-1-2.ec2.cloud.redislabs.com',
  port: 17891,
  password: process.env.PKEY_PASS,
})); // TODO: Update
require('./routes/sockets')(io);

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || '5000');
app.set('port', port);


const whitelist = /^((https:\/\/)?((.*)\.)?hackpsu.(com|org))$/;
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all cross-origin requests for now
    }
  },
};

app.options('/', (req, res, next) => {
  next();
});

const index = require('./routes/index');
const users = require('./routes/users');
const register = require('./routes/register');
const admin = require('./routes/admin');
const pi = require('./routes/pi'); // Deprecated
const live = require('./routes/live');

nodecipher.decryptSync({
  input: 'privatekey.aes',
  output: 'config.json',
  password: process.env.PKEY_PASS,
  algorithm: 'aes-256-cbc-hmac-sha256',
});

const serviceAccount = require('./config.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: 'https://hackpsu18.firebaseio.com',
});

fs.unlinkSync('./config.json');
app.use(helmet());
app.use(helmet.hidePoweredBy());

app.use(cors(corsOptions));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// don't show the log when it is test
if (process.env.NODE_ENV !== 'test') {
  // use morgan to log at command line
  app.use(logger('combined')); // 'combined' outputs the Apache style LOGs
}
app.use(bodyParser.json({
  limit: '10mb',
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/v1/users', users);
app.use('/v1/register', register);
app.use('/v1/doc', express.static(path.join(__dirname, 'doc')));
app.use('/v1/admin', admin);
app.use('/v1/pi', pi); // Deprecated
app.use('/v1/live', live);


// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  if (err.body) {
    res.send(err.body);
  } else {
    res.render('error');
  }
});


module.exports = server;
