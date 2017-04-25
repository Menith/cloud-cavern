
var mongoose = require('mongoose');

var Campaign = mongoose.model('Campaign');
var Player = mongoose.model('Player');

module.exports = function (io) {
  'use strict';
  var connections = [];
  io.on('connection', function (socket) {
    // Adds a socket to the specified room
    socket.on('join-room', function(roomName, playerID, characterID) {
      socket.join(roomName);
      if (playerID) {
        connections.push({
          socket: socket,
          roomName: roomName,
          playerID: playerID,
          characterID: characterID
        });
      }
    });

    socket.on('disconnect', function() {
      connections.forEach((connection, index) => {
        if (connection.socket === socket) {
          var campaignID = connection.roomName.substring(connection.roomName.indexOf('-') + 1, connection.roomName.length);

          Campaign.findById(campaignID, (err, campaign) => {
            if (err) {
              console.log(err);
            } else if (campaign) {
              // Check if the player that left is the DM
              if (connection.playerID == campaign.dm) {
                
                // If the campaign was public make is private
                if (!campaign.private) {
                  campaign.toggleOpen(true);
                  io.sockets.in('public').emit('remove-public-campaign', {campaignID: campaignID});
                }

                // If the campaign was in session mark it out of session and remove the players
                if (campaign.inSession) {
                  campaign.toggleSession(false);
                  io.sockets.in(connection.roomName).emit('campaign-session-end');
                  io.sockets.in('public').emit('campaign-session-end', {campaignID: campaignID});
                }

              }
            }
          });

          io.sockets.in(connection.roomName).emit('remove-player', connection.playerID);
          connections.splice(index, 1);
        }
      });
    });

    socket.on('request-players-t', function(roomName) {
      var players = [];
      connections.forEach((connection, index) => {
        if (connection.roomName === roomName && connection.playerID && connection.characterID) {
          players.push({playerID: connection.playerID, characterID: connection.characterID});
        }
      });

      io.sockets.connected[socket.id].emit('add-players', players);
    });

    // Socket for when a DM starts a session
    socket.on('campaign-session-start', function(roomName, data) {
      var campaignID = roomName.substring(roomName.indexOf('-') + 1, roomName.length);

      Campaign.findById(campaignID, (err, campaign) => {
        if (err) {
          console.log(err);
        } else if (campaign) {
          campaign.toggleSession(true);
          socket.broadcast.to(roomName).emit('campaign-session-start', data);
          io.sockets.in('public').emit('campaign-session-start', data);
        }
      });

    });

    // Socket for when a DM leaves a session
    socket.on('campaign-session-end', function(roomName, data) {

      io.sockets.in('public').emit('campaign-session-end', data);
    });

    // Socket for adding a new public campaign to the public campaigns list
    socket.on('add-public-campaign', function(data) {
      io.sockets.in('public').emit('add-public-campaign', data);
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
    socket.on('send-message', function (roomName, data) {
      io.sockets.in(roomName).emit('receive-message', data);
    });

    // Socket for adding a player to the player list in the campaign lobby or session
    socket.on('add-player', function(roomName, data) {
      socket.broadcast.to(roomName).emit('add-player', data);
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

    socket.on('send-object', function(roomName, data) {
      socket.broadcast.to(roomName).emit('send-object', data);
    });

    // data contains:
    // index - index of the object to change,
    // shape - the shape to change the object to
    socket.on('change-object-shape', function(roomName, data) {
      io.sockets.in(roomName).emit('change-object-shape', data);
    });

    socket.on('change-object-shape-color', function(roomName, data) {
      io.sockets.in(roomName).emit('change-object-shape-color', data);
    });

    socket.on('change-object-filled', function(roomName, data) {
      io.sockets.in(roomName).emit('change-object-filled', data);
    });

    socket.on('change-object-line-width', function(roomName, data) {
      io.sockets.in(roomName).emit('change-object-line-width', data);
    });

    socket.on('change-object-line-color', function(roomName, data) {
      io.sockets.in(roomName).emit('change-object-line-color', data);
    });

    socket.on('add-drawing-object', function(roomName, object) {
      socket.broadcast.to(roomName).emit('add-drawing-object', object);
    });

    socket.on('update-drawing-object', function(roomName, index, object) {
      socket.broadcast.to(roomName).emit('update-drawing-object', index, object);
    });

    socket.on('delete-drawing-object', function(roomName, index) {
      socket.broadcast.to(roomName).emit('delete-drawing-object', index);
    });

    // When a campaign is deleted, if a room is provided send all players
    // in that lobby home, send a message to remove that campaign from all lists
    socket.on('campaign-deleted', function(roomName, data) {
      if (roomName != null) {
        io.sockets.in(roomName).emit('send-player-home', data);
      }
      io.sockets.in('public').emit('remove-campaign', data)
    });

  });
};
