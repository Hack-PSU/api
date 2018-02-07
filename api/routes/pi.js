const express = require('express');
const database = require('../helpers/database');
const router = express.Router();
const ws = require('express-ws')(router);

router.use(function (req, res, next) {
  console.log('middleware');
  req.testing = 'testing';
  return next();
});

router.get('/', function(req, res, next){
  console.log('get route', req.testing);
  res.end();
});

router.ws('/', function(ws, req) {
  ws.on('message', function(msg) {
    console.log(msg);
    ws.send(msg);
  });
  console.log('socket', req.testing);
});

module.exports = router;
