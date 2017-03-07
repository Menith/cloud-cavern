module.exports = function (io) {
  'use strict';
  io.on('connection', function (socket) {
    socket.broadcast.emit('user connected');

    socket.on('message', function (eventName, from, msg) {

      io.sockets.emit(eventName, {
        payload: msg,
        source: from
      });
      
    });
  });
};
