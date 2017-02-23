//Controller for the player list page
cms.controller('PlayerListCtrl', ['$scope', '$state', 'players', 'playerList', 'confirm', function($scope, $state, players, playerList, confirm) {
  $scope.players = playerList;

  // redirect the player to the edit player page
  $scope.editPlayer = function(index) {
    $state.go('home.playerEdit', {id: $scope.players[index]._id});
  };

  // Function to delete a player
  $scope.deletePlayer = function(index) {
    $scope.success = null;
    $scope.error = null;

    // Open a confirmation modal
    var modalInstance = confirm.openModal($scope, {
      size: 'md',
      message: 'Are you sure you want to delete the player ' + $scope.players[index].username + '?',
      button: 'Delete'
    });

    // Wait for the user to respond
    modalInstance.result.then(() => {
      // Go out to the database and delete the player
      players.delete($scope.players[index]._id).then((result) => {
        // Remove the player from the local list and show a confirmation
        $scope.players.splice(index, 1);
        $scope.success = {message: 'Successfuly delete player'};
      }, (error) => {
        // Show an error if there was a problem with deleting the player
        $scope.error = error.data;
      });
    });
  };

}]);



// Controller for the player edit page
cms.controller('PlayerEditCtrl', ['$scope', '$state', 'player', 'players', 'campaigns', 'confirm', function($scope, $state, player, players, campaigns, confirm) {
  $scope.player = player;

  // Save the current player
  $scope.savePlayer = function() {
    // Go out to the database and update the palyer
    players.update($scope.player).then((res) => {
      // Show a message if it was successfull
      $scope.success = {message: 'Successfuly updated the player'};
    }, (error) => {
      // Show an error if there was a problem updating the player
      $scope.error = error;
    });
  };

  // Delete the current player
  $scope.deletePlayer = function() {
    $scope.success = null;
    $scope.error = null;

    // Open up a confirmation modal
    var modalInstance = confirm.openModal($scope, {
      size: 'md',
      message: 'Are you sure you want to delete this player?',
      button: 'Delete'
    });

    // Wait for the user to respond
    modalInstance.result.then(() => {
      // Go out to the database and delete the player
      players.delete($scope.player._id).then((res) => {
        // Redirect the moderator to the player list
        $state.go('home.playerList');
      }, (error) => {
        // Show an error if there was a problem deleting the player
        $scope.error = error;
      });
    });
  };

  // Remove the given campaign
  $scope.removeCampaign = function(index) {
    $scope.success = null;
    $scope.error = null;

    // Open up a confirmation modal
    var modalInstance = confirm.openModal($scope, {
      size: 'md',
      message: 'Are you sure you want to remove campaign ' + $scope.player.campaigns[index].name + ' from this player?',
      button: 'Remove'
    });

    // Wait for the user to respond
    modalInstance.result.then(() => {
      // Go out to the database and remove the campaign from the player
      players.removeCampaign($scope.player._id, $scope.player.campaigns[index]._id).then((res) => {
        // Go out to the database and remove the player from the campaign
        campaigns.removePlayer($scope.player.campaigns[index]._id, $scope.player._id).then((res) => {
          // Remove the campaign from the local list
          $scope.player.campaigns.splice(index, 1);
        }, (error) => {
          // Show an error if there was a problem removing the player from the campaigns player list
          $scope.error = error;
        });
      }, (error) => {
        // Show an error if there was a problem removing the campaign from the players campaign list
        $scope.error = error;
      });
    });
  };

}]);
