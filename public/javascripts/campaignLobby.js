//Controller for the campaign lobby page
app.controller('CampaignLobbyCtrl',
['$scope', '$uibModal', '$state', 'campaign', 'campaigns', 'auth', 'player', 'players', 'confirm', 'campaignSocket', 'character',
function($scope, $uibModal, $state, campaign, campaigns, auth, player, players, confirm, campaignSocket, character) {

  // Active campaign
  $scope.campaign = campaign;

  console.log(character);

  // PLayers on the campaign lobby page
  $scope.activePlayers = [];

  $scope.$on('add-player', (event, data) => {
    console.log(data);
    if (data.player._id !== campaign.dm._id) {
      $scope.activePlayers.push(data);

      if ($scope.activePlayers.length === 1) {
        data.player.selected = true;
      }
    }
  });

  $scope.$on('remove-player', (event, playerID) => {
    var index = $scope.activePlayers.findIndex((data) => {
      return (playerID === data.player._id);
    });
    if (index !== -1) {
      $scope.activePlayers.splice(index, 1);
    }
  });

  campaignSocket.initialize();

  // Only add the player to the chat if they are not the DM
  if (auth.currentUserId() !== campaign.dm._id) {
    campaignSocket.addPlayer(player, character);
  }

  // Variable used for hiding elements that players should not see
  $scope.isDM = (auth.currentUserId() == campaign.dm._id);

  // Labels for the buttons and status text
  $scope.toggleButtonText = ($scope.campaign.private) ? 'Open Lobby' : 'Close Lobby';
  $scope.lobbyStatus = ($scope.campaign.private) ? 'Private' : 'Public';

  // Function for the delete button
  $scope.deleteCampaign = function() {
    $scope.modalInfo = {
      message: 'Are you sure you want to dissolve campaign?',
      button: 'Yes'
    };

    // Show a confirmation modal
    var modalInstance = $uibModal.open({
      templateUrl: '/html/confirmModal.html',
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      size: 'sm',
      keyboard: true,
      scope: $scope
    });

    // Delete the campaign if the DM confirms the modal
    modalInstance.result.then(() => {
      campaignSocket.campaignDeleted = true;
      campaigns.delete(campaign._id).then((res) => {

      });
    }, (err) => {
      // Show an error if there was a problem closing the modal
      console.log(err);
    });
  };

  // Toggles between a public and private campaign
  $scope.toggleOpen = function() {
    campaigns.toggleOpen($scope.campaign._id).then((res) => {

      $scope.campaign.private = !$scope.campaign.private;
      $scope.toggleButtonText = ($scope.campaign.private) ? 'Open Lobby' : 'Close Lobby';
      $scope.lobbyStatus = ($scope.campaign.private) ? 'Private' : 'Public';
    });
  };

  $scope.startSession = function() {
    campaignSocket.startSession();

    //Set the campaign inSession to true
    campaigns.toggleSession($scope.campaign._id, true);

    $state.go('campaignSession', {campaignID: campaign._id, characterID: character._id});

  };

  $scope.openBlacklist = function() {
    var modalInstance = $uibModal.open({
      templateUrl: '/html/blacklistModal.html',
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      controller: 'CampaignBlacklist',
      resolve: {
        campaign: function() {
          return $scope.campaign;
        },
        activePlayers: function() {
          return $scope.activePlayers;
        }
      },
      size: 'sm',
      keyboard: true,
      scope: $scope
    });

    modalInstance.result.then(() => {}, (err) => {
      console.log(err);
    })
  };

  $scope.kickPlayer = function(index) {
    //Get the player object based on the index in activePlayers
    var player = $scope.activePlayers[index].player;

    var modalInstance = confirm.openModal($scope, {
      size: 'sm',
      message: `Are you sure you want to kick ${player.username}?`,
      button: 'Kick'
    });

    modalInstance.result.then(() => {
      //Add player to campaign blacklist
      campaigns.addPlayerToBlacklist($scope.campaign._id, player._id);

      // Remove player from campaign player list
      campaigns.removePlayerFromCampaign($scope.campaign._id, player._id);

      // Remove campaign from player campaign list
      players.removeCampaignFromPlayer(player._id, $scope.campaign._id);

      // Kick player back to their home page
      campaignSocket.kickPlayer(player._id);

      $scope.campaign.blacklist.push(player);
    }, (err) => {
      console.log(err);
    });
  };

}]);
