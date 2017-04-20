app.factory('campaignSocket', [
'$rootScope', '$state', '$stateParams', 'auth', 'campaigns', 'players', 'socketFactory',
function($rootScope, $state, $stateParams, auth, campaigns, players, socketFactory) {

  var campaignSocket = {};

  campaignSocket.initialize = function() {
    this.socket = socketFactory();
    this.campaign = $stateParams.id;
    this.room = `campaign-${$stateParams.id}`;
    this.player = auth.currentUserId();
    this.playerList = [];
    this.campaignDeleted = false;

    this.socket.emit('join-room', this.room, this.player);
    this.socket.emit('request-players-t', this.room, this.campaign);

    // Listen for a player to be added to the socket
    this.socket.on('add-player', (data) => {
      // Ensure that a player was sent
      if (data.player) {
        // Check to see if the player is already in the list
        var found = this.playerList.find((player) => {
          return (player._id === data.player._id);
        });

        // If the player was not found, add them to the list,
        // and let the controller know
        if (!found) {
          this.playerList.push(data.player);
          $rootScope.$broadcast('add-player', data.player);
        }
      }
    }); // End 'add-player' event

    // Event to add a list of players to the socket
    this.socket.on('add-players', (newPlayers) => {
      newPlayers.forEach((playerID) => {
        players.get(playerID).then((player) => {
          this.playerList.push(player);
          $rootScope.$broadcast('add-player', player);
        });
      });
    }); // End 'add-players' event

    // Listen for a player to be removed from the socket
    this.socket.on('remove-player', (playerID) => {
      // Ensure that a player ID was sent
      if (playerID) {
        // Find the index of the player
        var index = this.playerList.findIndex((player) => {
          return (player._id === playerID);
        });
        // If a player was found, remove from the list
        // and notify the controller
        if (index !== -1) {
          this.playerList.splice(index, 1);
          $rootScope.$broadcast('remove-player', playerID);
        }
      }
    }); // End 'remove-player' event

    this.socket.on('kick-player', (data) => {
      if (data.playerID == this.player) {
        $state.go('player');
      }
    });

    this.socket.on('campaign-session-end', (data) => {

    });

    this.socket.on('receive-message', (data) => {
      $rootScope.$broadcast('receive-message', data);
    });

    this.socket.on('send-player-home', (data) => {
      $state.go('player');
    });

    this.socket.on('campaign-session-start', () => {
      $state.go('campaignSession', {id: this.campaign});
    });

  }; // End initialize function

  campaignSocket.addPlayer = function(player, campaignID) {
    this.socket.emit('add-player', this.room, {player: player, character: null});
  };

  campaignSocket.removePlayer = function() {
    this.socket.disconnect();
  };

  campaignSocket.kickPlayer = function(id) {
    this.socket.emit('kick-player', this.room, {playerID: id});
  };

  campaignSocket.startSession = function() {
    this.socket.emit('campaign-session-start', this.room, {campaignID: this.campaign});
  }

  campaignSocket.sendMessage = function(messageData){
    //Goes to the server and distribues the message
    this.socket.emit('send-message', this.room, messageData);
  };

  campaignSocket.endSession = function() {
    this.socket.emit('campaign-session-end', this.room, {campaignID: this.campaign});
  };

  return campaignSocket;
}]);
