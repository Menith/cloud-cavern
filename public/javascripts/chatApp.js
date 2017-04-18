app.factory('chatSocket', ['$state', function($state) {
  var chatSocket = {};

  chatSocket.initialize = function(socket, room, currentPlayer, activePlayers, currentCampaignId, campaignDmId) {
    this.socket = socket;
    this.room = room;
    this.currentPlayer = currentPlayer;
    this.activePlayers = activePlayers;
    this.currentCampaignId = currentCampaignId;
    this.campaignDmId = campaignDmId;
    this.campaignDeleted = false;

    // Event for adding a player to the player list
    this.socket.on('add-player', (data) => {
      if (data.player) {
        // Make sure that the player does not already exist.
        var playerExists = false;
        this.activePlayers.forEach((value) => {
          if (value._id === data.player._id) {
            playerExists = true;
          }
        });
        if (!playerExists) {
          this.activePlayers.push(data.player);
        }
      }
    });

    // Event for when a player requests all the players
    this.socket.on('request-players', (data) => {
      if (data.playerID) {
        // Make sure that the DM does not send their information
        if (this.currentPlayer._id !== this.campaignDmId) {
          this.socket.emit('add-player-to-another', this.room, {playerID: data.playerID, player: this.currentPlayer})
        }
      }
    });

    // Event for when a player needs to add another directly
    this.socket.on('add-player-to-another', (data) => {
      if (data.playerID && data.player) {
        // Check if the current player is the one that should be adding this player
        if (data.playerID === this.currentPlayer._id) {
          this.activePlayers.push(data.player);
        }
      }
    });

    // Event for removing a player from the player list
    this.socket.on('remove-player', (data) => {
      if (data.playerID) {
        this.activePlayers.forEach((player, index) => {
          if(player._id == data.playerID){
            this.activePlayers.splice(index, 1);
          }
        });
      }
    });

    // Event for kicking a certain player
    this.socket.on('kick-player', (data) => {
      if (data.playerID == chatSocket.currentPlayer._id) {
          $state.go('player');
      }
    });

    // Event for notifying a player that the session has ended
    this.socket.on('campaign-session-end', (data) => {
      //TODO: Move the player to the player home state
    });

    // Event for when a player recieves a message
    this.socket.on('receive-message', (data) => {
      this.receiveMessage(data);
    });

    // Event to move the current player back to the player home page
    this.socket.on('send-player-home', (data) => {
      $state.go('player');
    });

    // Event for when the campaign session starts, moves the player to the campaign session screen
    this.socket.on('campaign-session-start', () => {
      $state.go('campaignSession', {id: this.currentCampaignId});
    });

    // Join the room and request all players in the room
    this.socket.emit("join-room", room, currentPlayer._id);
    this.socket.emit('request-players', room, {playerID: currentPlayer._id});

  };

  chatSocket.addPlayer = function(player) {
    this.socket.emit('add-player', this.room, {player: player});
  };

  chatSocket.removePlayer = function(id) {
    this.socket.disconnect();
  };

  chatSocket.kickPlayer = function(id) {
    this.socket.emit('kick-player', this.room, {playerID: id});
  };

  chatSocket.startSession = function() {
    this.socket.emit('campaign-session-start', this.room, {campaignID: this.currentCampaignId});
  }

  chatSocket.sendMessage = function(messageData){
    //Goes to the server and distribues the message
    this.socket.emit('send-message', this.room, messageData);
  };

  chatSocket.receiveMessage = function(messageData){
    // This method will be overriden
  };

  chatSocket.startSession = function() {
    this.socket.emit('campaign-session-start', this.room, {campaignID: this.currentCampaignId});
  };

  chatSocket.endSession = function() {
    this.socket.emit('campaign-session-end', this.room, {campaignID: this.currentCampaignId});
  };

  return chatSocket;
}]);
