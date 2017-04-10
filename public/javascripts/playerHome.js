// Controller for the player homepage
app.controller('PlayerCtrl', ['$scope', '$state', '$uibModal', 'auth', 'player', 'players', 'playerCampaignList',
  function($scope, $state, $uibModal, auth, player, players, playerCampaignList) {

  $scope.isLoggedIn = auth.isLoggedIn;


  player.campaigns.forEach((campaign) => {
    players.getPlayerName(campaign.dm).then((resData) => {
      campaign.dm = resData;
    });
    campaign.dm = '';
  });

  //Set the playerCampaignList service equal to the campaign list stored in player
  playerCampaignList.playerCampaignList = player.campaigns;

  //Set the campaignList equal to the serices list. This will auto update when the services data is changed
  $scope.campaignList = playerCampaignList.playerCampaignList;

}]);

//Controller for the CampaignList div on the playerHome html page
app.controller('PlayerCampaignListCtrl',
['$scope', '$state', '$uibModal', 'auth', 'campaigns', 'players', 'playerCampaignList', 'socketFactory',
function($scope, $state, $uibModal, auth, campaigns, players, playerCampaignList, socketFactory) {

  $scope.currentPlayer = players.get(auth.currentUserId());
  //variable that holds the campaign clicked on by the user
  $scope.currentCampaign;

  //When the document is ready, edit the campaign list
  angular.element(document).ready(function () {
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

      $uibModal.open({
        templateUrl: '/html/dmJoinLobbyModal.html',
        controller: 'DmClickCtrl',
        resolve: {
           clickedCampaign: function () {
             return $scope.currentCampaign;
           }
        },
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        keyboard: true
      });
    }
    //Player that clicked the campaign is not the DM
    else {

      $uibModal.open({
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
      };
    };

    // Opens up the createCampaignModal modal
    $scope.showCreateCampaignModal = function() {
      $uibModal.open({
        templateUrl: '/html/createCampaignModal.html',
        controller: 'CreateCampaignCtrl',
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        keyboard: true
      });

    };

    //opens up the joinCampaignCodeModal
    $scope.showJoinCampaignCodeModal = function() {
      $uibModal.open({
        templateUrl: '/html/joinCampaignCodeModal.html',
        controller: 'JoinCampaignCodeCtrl',
        ariaLabelledBy: 'modal-title',
        ariaDescribedBy: 'modal-body',
        keyboard: true
      });
    };

    var socket = socketFactory();
    socket.emit('join-room', 'public');

    socket.on('remove-campaign', (data) => {
      // Ensure that a campaignID is provided
      if (data.campaignID) {
        var index = -1;
        playerCampaignList.playerCampaignList.forEach((campaign, i) => {
          if (campaign._id == data.campaignID) {
            index = i;
          }
        });
        if (index != -1) {
           playerCampaignList.playerCampaignList.splice(index, 1);
        }
      }
    });

    socket.on('campaign-session-start', (data) => {

      if (data.campaignID) {
        var index = -1;
        playerCampaignList.playerCampaignList.forEach((campaign, i) => {
          if (campaign._id == data.campaignID) {
            index = i;
          }
        });
        if (index != -1) {
          $('#playerCampaignList tr').eq(index).addClass('activeCampaignSession');
        }
      }
    });

    socket.on('campaign-session-end', (data) => {

      if (data.campaignID) {
        var index = -1;
        playerCampaignList.playerCampaignList.forEach((campaign, i) => {
          if (campaign._id == data.campaignID) {
            index = i;
          }
        });
        if (index != -1) {
          $('#playerCampaignList tr').eq(index).removeClass('activeCampaignSession');
        }
      }
    });

}]);


// Controller for the character list on the player homepage
app.controller('CharacterListCtrl',
['$scope', '$uibModal', 'auth', 'characters',
function($scope, $uibModal, auth, characters) {

  $scope.characterList = [];
  characters.getAll(auth.currentUserId()).then((characterList) => {
    $scope.characterList = characterList;
  });

  $scope.newCharacter = function() {
    $uibModal.open({
      templateUrl: '/html/characterCreateModal.html',
      controller: 'CreateCharCtrl',
      ariaLablelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      keyboard: true
    });
  };
}]);

// Controller for the lobby list on the player homepage
app.controller('CampaignLobbyListCtrl',
['$scope', 'auth', 'campaigns', 'players', '$state', 'socketFactory',
function($scope, auth, campaigns, players, $state, socketFactory) {
  // array to hold public campaigns
  $scope.openCampaigns = [];

  campaigns.getPublic().then(function(res) {

    $scope.openCampaigns = res.filter(function(campaign) {
      var index = campaign.blacklist.indexOf(auth.currentUserId());

      return index == -1;

    });
  }, function(error) {
    console.log(error);

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

    //direct the player to the campaign lobby page
    $state.go('campaignLobby', {id: $scope.openCampaigns[index]._id});
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
