//Controller for the campaign lobby page
app.controller('CampaignLobbyCtrl',
['$scope', '$uibModal', '$state', 'campaign', 'campaigns', 'auth', 'player', 'players', 'chatSocket', 'socketFactory', 'confirm',
function($scope, $uibModal, $state, campaign, campaigns, auth, player, players, chatSocket, socketFactory, confirm) {

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
      chatSocket.campaignDeleted = true;
      campaigns.delete(campaign._id).then((res) => {

      });
    }, (err) => {
      // Show an error if there was a problem closing the modal
      console.log(err);
    });
  };

  // Toggles between a public and private campaign
  $scope.toggleOpen = function() {
    //Pass the campaign and the the wanted isPrivate boolean to the route
    campaigns.toggleOpen($scope.campaign._id, !$scope.campaign.private).then((res) => {
      //Flip the private local var
      $scope.campaign.private = !$scope.campaign.private;
      //change the button text based on the state of the lobby (public vs private)
      $scope.toggleButtonText = ($scope.campaign.private) ? 'Open Lobby' : 'Close Lobby';
      //change the lobby status to private or public based on what the campaign is currently
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

    modalInstance.result.then(() => {}, (err) => {
      console.log(err);
    })
  };

  $scope.kickPlayer = function(index) {
    //Get the player object based on the index in activePlayers
    var player = $scope.activePlayers[index];

    var modalInstance = confirm.openModal($scope, {
      size: 'sm',
      message: `Are you sure you want to kick ${player.username}?`,
      button: 'Kick'
    });

    modalInstance.result.then(() => {
      //Add player to campaign blacklist
      // (route removes player from campaign, campaign from player and adds player to the campaign blacklist)
      campaigns.addPlayerToBlacklist($scope.campaign._id, player._id);

      // Kick player back to their home page
      chatSocket.kickPlayer(player._id);

      //add player to local campaign object
      $scope.campaign.blacklist.push(player);
    }, (err) => {
      console.log(err);
    });
  };

}]);
