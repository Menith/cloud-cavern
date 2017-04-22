// Controller for the player homepage
app.controller('PlayerCtrl',
['$scope', '$state', '$uibModal', 'auth', 'player', 'players', 'playerCampaignList',
function($scope, $state, $uibModal, auth, player, players, playerCampaignList) {

  $scope.isLoggedIn = auth.isLoggedIn;

  // Load the dm information
  player.campaigns.forEach((campaign) => {
    players.getPlayerName(campaign.dm).then((dmDetails) => {
      campaign.dm = dmDetails;
    });
    campaign.dm.name = '';
  });

  //Set the playerCampaignList service equal to the campaign list stored in player
  playerCampaignList.playerCampaignList = player.campaigns;

  //Set the campaignList equal to the serices list. This will auto update when the services data is changed
  $scope.campaignList = playerCampaignList.playerCampaignList;

}]);

//Controller for the CampaignList div on the playerHome html page
app.controller('PlayerCampaignListCtrl',
['$scope', '$state', '$uibModal', 'auth', 'playerCampaignList', 'socketFactory',
function($scope, $state, $uibModal, auth, playerCampaignList, socketFactory) {

  //variable that holds the campaign clicked on by the user
  $scope.currentCampaign;

  //When the document is ready, edit the campaign list
  angular.element(document).ready(() => {
    //Apply class to active session campaigns on page load
    playerCampaignList.playerCampaignList.forEach((campaign, i) => {
      if (campaign.inSession) {
        $('#playerCampaignList tr').eq(i).addClass('activeCampaignSession');
      }
    });
  });

  //Function called when a player clicks on the join button on the players campaign list
  $scope.openJoinCampaignModal = function(index) {
    //Get the campaign the player clicked on by its index in the ng-repeat
    $scope.currentCampaign = playerCampaignList.playerCampaignList[index];
    //Player that clicked the campaign is the DM
    if (auth.currentUserId() == $scope.currentCampaign.dm._id) {

      var modalInstance = $uibModal.open({
        templateUrl: '/html/dmJoinLobbyModal.html',
        controller: 'DmClickCtrl',
        resolve: {
           clickedCampaign: function() {
             return $scope.currentCampaign;
           }
        },
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        keyboard: true
      });

      modalInstance.result.then(() => {}, (err) => {
        // Throw an error if there was a problem resolving the modal.
        console.log(err);
      });

    } else { //Player that clicked the campaign is not the DM

      var modalInstance = $uibModal.open({
        templateUrl: '/html/selectCharacterModal.html',
        controller: 'SelectCharacterCtrl',
        resolve: {
           clickedCampaign: function () {
             return $scope.currentCampaign;
           },
           characterList: ['characters', function(characters) {
             return characters.getAll(auth.currentUserId());
           }]
        },
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        keyboard: true
      });

      modalInstance.result.then(() => {}, (err) => {
        // Throw an error if there was a problem resolving the modal.
        console.log(err);
      });
    }
  };

    // Opens up the createCampaignModal modal
    $scope.showCreateCampaignModal = function() {
      var modalInstance = $uibModal.open({
        templateUrl: '/html/createCampaignModal.html',
        controller: 'CreateCampaignCtrl',
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        keyboard: true
      });

      modalInstance.result.then(() => {}, (err) => {
        // Throw an error if there was a problem resolving the modal.
        console.log(err);
      });

    };

    //opens up the joinCampaignCodeModal
    $scope.showJoinCampaignCodeModal = function() {
      var modalInstance = $uibModal.open({
        templateUrl: '/html/joinCampaignCodeModal.html',
        controller: 'JoinCampaignCodeCtrl',
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        keyboard: true
      });

      modalInstance.result.then(() => {}, (err) => {
        // Throw an error if there was a problem resolving the modal.
        console.log(err);
      });
    };

    var socket = socketFactory();
    socket.emit('join-room', 'public');

    // Removes a campaign from the players local list
    socket.on('remove-campaign', (data) => {
      if (data.campaignID) {
        var index = -1;
        // Find the campaign that needs to be removed
        playerCampaignList.playerCampaignList.forEach((campaign, i) => {
          if (campaign._id == data.campaignID) {
            index = i;
          }
        });
        if (index != -1) {
          // Remove the campaign from the list
          playerCampaignList.playerCampaignList.splice(index, 1);
        }
      }
    });

    // Light up a campaign when the session starts
    socket.on('campaign-session-start', (data) => {
      if (data.campaignID) {
        var index = -1;
        // Find the campaign that needs to be highlighted
        playerCampaignList.playerCampaignList.forEach((campaign, i) => {
          if (campaign._id == data.campaignID) {
            index = i;
          }
        });
        if (index != -1) {
          // Highlight the campaign
          $('#playerCampaignList tr').eq(index).addClass('activeCampaignSession');
        }
      }
    });

    // Remove the highlight from a campaign that is now not in session
    socket.on('campaign-session-end', (data) => {
      console.log(data);
      if (data.campaignID) {
        var index = -1;
        // Find the campaign to edit
        playerCampaignList.playerCampaignList.forEach((campaign, i) => {
          if (campaign._id == data.campaignID) {
            index = i;
          }
        });
        if (index != -1) {
          // Remove the highlighting
          $('#playerCampaignList tr').eq(index).removeClass('activeCampaignSession');
        }
      }
    });

}]);

// Controller for the character list on the player homepage
app.controller('CharacterListCtrl',
['$scope', '$uibModal', 'auth', 'characters',
function($scope, $uibModal, auth, characters) {

  $scope.characterList = []; // List of a players characters

  // Populate the players characters
  characters.getAll(auth.currentUserId()).then((characterList) => {
    $scope.characterList = characterList;
  });

  $scope.newCharacter = function() {
    var modalInstance = $uibModal.open({
      templateUrl: '/html/characterCreateModal.html',
      controller: 'CreateCharCtrl',
      ariaLablelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      keyboard: true
    });

    modalInstance.result.then(() => {}, (err) => {
      // Throw an error if there was a problem resolving the modal.
      console.log(err);
    });
  };

}]);

// Controller for the lobby list on the player homepage
app.controller('CampaignLobbyListCtrl',
['$scope', '$uibModal', '$state', 'auth', 'campaigns', 'players', 'publicCampaignList', 'socketFactory',
function($scope, $uibModal, $state, auth, campaigns, players, publicCampaignList, socketFactory) {

  $scope.openCampaigns = []; // array to hold public campaigns

  // Populate the public campaigns list
  campaigns.getPublic().then((publicCampaigns) => {

    // Filter the campaigns that the current player is blacklisted on
    publicCampaignList.openCampaigns = publicCampaigns.filter((campaign) => {
      // Check if the user is part of the blacklist
      var index = campaign.blacklist.indexOf(auth.currentUserId());
      // Check if the user is already in the campaign
      var index2 = campaign.players.indexOf(auth.currentUserId());

      //if not on the blacklist and not on the player list, show the campaign
      return (index == -1 && index2 == -1);
    });

    $scope.openCampaigns = publicCampaignList.openCampaigns;

  }, (err) => {
    console.log(err);

  });



  $scope.joinPublicCampaignClick = function(index) {

    //add the campaign to the players campaign list
    players.putCampaignInPlayer(auth.currentUserId(), $scope.openCampaigns[index]._id).then(function(res){
    }, function(err) {
      $scope.error = err.data;
    });

    //Add the player to the campaign player list
    campaigns.putPlayerInCampaign($scope.openCampaigns[index]._id, auth.currentUserId()).then(function(res){
    }, function(err) {
      $scope.error = err.data;
    });

    //Let player choose character
    var modalInstance = $uibModal.open({
      templateUrl: '/html/selectCharacterModal.html',
      controller: 'SelectCharacterCtrl',
      resolve: {
         clickedCampaign: function () {
           return $scope.openCampaigns[index];
         },
         characterList: ['characters', function(characters) {
           return characters.getAll(auth.currentUserId());
         }]
      },
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      keyboard: true
    });

    modalInstance.result.then(() => {}, (err) => {
      // Throw an error if there was a problem resolving the modal.
      console.log(err);
    });

  }

  var socket = socketFactory();
  socket.emit('join-room', 'public');

  socket.on('add-public-campaign', (data) => {
    if (data.campaignID) {
      campaigns.getPublicCampaign(data.campaignID).then((resData) => {
        $scope.openCampaigns.push(resData);
      });
    }
  });

  socket.on('remove-public-campaign', (data) => {
    if (data.campaignID) {
      var index = -1;
      $scope.openCampaigns.forEach((campaign, i) => {
        if (campaign._id == data.campaignID) {
          index = i;
        }
      });
      if (index != -1) {
        $scope.openCampaigns.splice(index, 1);
      }
    }
  });

}]);
