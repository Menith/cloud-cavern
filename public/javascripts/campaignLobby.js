//Controller for the campaign lobby page
app.controller('CampaignLobbyCtrl',
['$scope', '$uibModal', '$state', 'campaign', 'campaigns', 'auth', 'player', 'players', 'chatSocket', 'socketFactory',
function($scope, $uibModal, $state, campaign, campaigns, auth, player, players, chatSocket, socketFactory) {

  // Active campaign
  $scope.campaign = campaign;

  // PLayers on the campaign lobby page
  $scope.activePlayers = [];

  // Socket to send to our chatSocket factory
  var socket = socketFactory();

  // Set up the chat socket
  chatSocket.initialize(socket, 'campaign-' + campaign._id, player, $scope.activePlayers, campaign._id, campaign.dm._id);

  // Only add the player to the chat if they are not the DM
  if (auth.currentUserId() !== campaign.dm._id) {
    chatSocket.addPlayer(player);
  }

  // Variable used for hiding elements that players should not see
  $scope.isDM = (auth.currentUserId() !== campaign.dm._id);

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
      campaigns.delete(campaign._id).then((res) => {

      });
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
    chatSocket.startSession();

    //Set the campaign inSession to true
    campaigns.toggleSession($scope.campaign._id, true);

    $state.go('campaignSession', {id: campaign._id});

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
  };

  $scope.kickPlayer = function(index) {
    //Get the player object based on the index in activePlayers
    var player = $scope.activePlayers[index];

    //Add player to campaign blacklist
    campaigns.addPlayerToBlacklist($scope.campaign._id, player._id);

    // Remove player from campaign player list
    campaigns.removePlayerFromCampaign($scope.campaign._id, player._id);

    // Remove campaign from player campaign list
    players.removeCampaignFromPlayer(player._id, $scope.campaign._id);

    // Kick player back to their home page
    chatSocket.kickPlayer(player._id);
  };

}]);
