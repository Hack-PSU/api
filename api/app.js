/* eslint-disable import/no-unresolved,no-logger,global-require */
if (process.env.NODE_ENV === 'production') {
  require('@google-cloud/trace-agent').start();
  require('@google-cloud/debug-agent').start();
}
require('dotenv').config();
const http = require('http');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
const { logger } = require('./services/logging');
const { UowFactory } = require('./services/factories/uow_factory');

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

/** ************ EXPRESS APP ************ */

const app = express();

app.set('trust proxy', true);
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
  UowFactory.create().then((uow) => {
    req.uow = uow;
    next();
  }).catch((err) => {
    next(err);
  });
});

app.use((req, res, next) => {
  UowFactory.createRTDB().then((uow) => {
    req.rtdb = uow;
    next();
  }).catch(next);
});

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || '5000');
app.set('port', port);

const whitelist = /^((https:\/\/)?((.*)\.)?hackpsu.(com|org))|(http:\/\/localhost:?\d*)$/;
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.test(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
};

const index = require('./routes/index');
const users = require('./routes/users');
const register = require('./routes/register');
const admin = require('./routes/admin');
const hw = require('./routes/hw');
const live = require('./routes/live');
const internal = require('./routes/internal');

app.use(helmet());
app.use(helmet.hidePoweredBy());

app.use(cors(corsOptions));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
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
app.use(['/v1/pi', '/v1/hw'], hw); // Deprecated
app.use('/v1/live', live);
app.use('/v1/internal', internal);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    logger.error(err);
    if (err.body) {
      logger.error(err.body);
    }
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
