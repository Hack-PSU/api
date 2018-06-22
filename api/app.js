/* eslint-disable import/no-unresolved,no-console */
const http = require('http');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const fs = require('fs');
const cors = require('cors');
const UnitOfWork = require('./assets/helpers/database/uow_factory');

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

app.use((req, res, next) => {
  function complete() {
    if (req.uow) {
      req.uow.complete();
    }
  }
  res.on('finish', complete);
  res.on('close', complete);
  next();
});

app.use((req, res, next) => {
  UnitOfWork.create().then((uow) => {
    req.uow = uow;
    next();
  }).catch((err) => {
    next(err);
  });
});

app.use((req, res, next) => {
  UnitOfWork.createRTDB().then((uow) => {
    req.rtdb = uow;
    next();
  }).catch(next);
});

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

// TODO: Decide if we need this
// /**
//  * Socket IO listener
//  */
// const io = require('socket.io').listen(server, {
//   origin: 'http://localhost:*',
//   path: '/v1/live',
//   handlePreflightRequest(req, res) {
//     const headers = {
//       'Access-Control-Allow-Headers': 'Content-Type, idtoken',
//       'Access-Control-Allow-Origin': req.headers.origin,
//       'Access-Control-Allow-Credentials': true,
//     };
//     res.writeHead(200, headers);
//     res.end();
//   },
// });
//
// io.adapter(redisAdapter({
//   host: 'redis-17891.c44.us-east-1-2.ec2.cloud.redislabs.com',
//   port: 17891,
//   password: process.env.PKEY_PASS,
// })); // TODO: Update
// require('./routes/sockets')(io);

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

// TODO: Fix CORS
app.options('/', (req, res, next) => {
  next();
});

const index = require('./routes/index');
const users = require('./routes/users');
const register = require('./routes/register');
const admin = require('./routes/admin');
const pi = require('./routes/pi');
const live = require('./routes/live');

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
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));
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
