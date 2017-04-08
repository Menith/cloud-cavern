app.factory('chatSocket', ['$state', function($state) {
  var chatSocket = {};
  chatSocket.initialize = function(socket, room, currentPlayer, activePlayers, currentCampaignId, campaignDmId) {
    this.socket = socket;
    this.room = room;
    this.currentPlayer = currentPlayer;
    this.activePlayers = activePlayers;
    this.currentCampaignId = currentCampaignId;
    this.campaignDmId = campaignDmId;

    // Event for adding a player to the player list
    chatSocket.socket.on('add-player', (data) => {
      if (data.player) {
        // Make sure that the player does not already exist.
        var playerExists = false;
        chatSocket.activePlayers.forEach((value) => {
          if (value._id === data.player._id) {
            playerExists = true;
          }
        });
        if (!playerExists) {
          chatSocket.activePlayers.push(data.player);
        }
      }
    });

    // Event for when a player requests all the players
    chatSocket.socket.on('request-players', (data) => {
      if (data.playerID) {
        // Make sure that the DM does not send their information
        if (chatSocket.currentPlayer._id !== chatSocket.campaignDmId) {
          chatSocket.socket.emit('add-player-to-another', chatSocket.room, {playerID: data.playerID, player: chatSocket.currentPlayer})
        }
      }
    });

    // Event for when a player needs to add another directly
    chatSocket.socket.on('add-player-to-another', (data) => {
      if (data.playerID && data.player) {
        // Check if the current player is the one that should be adding this player
        if (data.playerID === chatSocket.currentPlayer._id) {
          chatSocket.activePlayers.push(data.player);
        }
      }
    });

    // Event for removing a player from the player list
    chatSocket.socket.on('remove-player', (data) => {
      if (data.playerID) {
        chatSocket.activePlayers.forEach((player, index) => {
          if(player._id == data.playerID){
            chatSocket.activePlayers.splice(index, 1);
          }
        });
      }
    });

    // Event for kicking a certain player
    chatSocket.socket.on('kick-player', (data) => {
      if (data.playerID) {

      }
    });

    this.socket.on('send-player-home', (data) => {
      $state.go('player');
    });

    this.socket.on('campaign-session-start', () => {
      $state.go('campaignSession', {id: this.currentCampaignId});
    });

    chatSocket.socket.emit("join-room", room, currentPlayer._id);
    chatSocket.socket.emit('request-players', room, {playerID: currentPlayer._id});

  };

  chatSocket.addPlayer = function(player) {
    chatSocket.socket.emit('add-player', this.room, {player: player});
  };

  chatSocket.removePlayer = function(id) {
    chatSocket.socket.disconnect();
  };

  chatSocket.startSession = function() {
    this.socket.emit('campaign-session-start', this.room);
  };

  return chatSocket;
}]);
