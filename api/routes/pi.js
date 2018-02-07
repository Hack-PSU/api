const express = require('express');
const database = require('../helpers/database');
const io = require('socket.io')();

io.on('connection', (socket) => {
  socket.on('scan', (data) => {
    socket.emit('hear-me', data);
  })
});

module.exports = express.Router();