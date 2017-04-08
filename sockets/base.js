module.exports = function (io) {
  'use strict';
  var connections = [];
  io.on('connection', function (socket) {

    // Adds a socket to the specified room
    socket.on('join-room', function(roomName, playerID) {
      socket.join(roomName);
      connections.push([socket, roomName, playerID]);
    });

    socket.on('disconnect', function() {
      connections.forEach((value, index) => {
        if(value[0] === socket){
          io.sockets.in(value[1]).emit('remove-player', {playerID: value[2]});
          connections.splice(index, 1);
        }
      });
    });

    // Socket for when a DM starts a session
    socket.on('campaign-session-start', function(data) {
      io.sockets.in('public').emit('campaign-session-start', data);
    });

    // Socket for adding a new public campaign to the public campaigns list
    socket.on('new-public-campaign', function(data) {
      io.sockets.in('public').emit('new-public-campaign', data);
    });

    // Socket for removing a campaign from the public campaigns list
    socket.on('remove-public-campaign', function(data) {
      io.sockets.in('public').emit('remove-public-campaign', data);
    })

    // Socket for updating the # of people in a public campaign
    socket.on('update-public-campaign-players', function(data) {
      io.sockets.in('public').emit('update-public-campaign-players', data);
    })

    // Socket for sending messages in chat rooms
    socket.on('message', function (roomName, data) {
      io.sockets.in(roomName).emit('message', data);
    });

    // Socket for adding a player to the player list in the campaign lobby or session
    socket.on('add-player', function(roomName, data) {
      io.sockets.in(roomName).emit('add-player', data);
    });

    // Socket for requesting all the other players in a given room.
    socket.on('request-players', function(roomName, data) {
      socket.broadcast.to(roomName).emit('request-players', data);
    });

    // Socket for adding a player to a specified player list in the campaign lobby for session
    socket.on('add-player-to-another', function(roomName, data) {
      io.sockets.in(roomName).emit('add-player-to-another', data);
    });

    // Socket for removing a player from a player list in the campaign lobby or session
    socket.on('remove-player', function(roomName, data) {
      io.sockets.in(roomName).emit('remove-player', data);
    });

    // Socket for kicking a player from a campaign lobby
    socket.on('kick-player', function(roomName, data) {
      io.sockets.in(roomName).emit('kick-player', data);
    });

    // Socket for notifying a player that the DM joined a campaign
    socket.on('notify-player', function(roomName, data) {
      io.sockets.in(roomName).emit('notify-player', data);
    });

  });
};
