// Main angular app
var app = angular.module('dungeonManager', ['ui.router', 'ui.bootstrap', 'ngAnimate', 'ngTouch', 'ngSanitize', 'ngResource', 'btford.socket-io']);

// Routes for the app
app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
  $stateProvider.state('home', {
    url: '/home',
    templateUrl: '/html/home.html',
    controller: 'MainCtrl',
    onEnter: ['$state', 'auth', function($state, auth) {
      if (auth.isLoggedIn()) {
        $state.go('player');
      }
    }]
  })
  .state('player', {
    url: '/player',
    templateUrl: 'html/playerHome.html',
    controller: 'PlayerCtrl',
    resolve: {
      player: ['auth', 'players', function (auth, players) {
        return players.get(auth.currentUserId());
      }]
    },
    onEnter: ['$state', 'auth', function($state, auth) {
      if (!auth.isLoggedIn()) {
        $state.go('home');
      }
    }]
  })
  .state('campaignLobby', {
    url: '/campaignLobby/{id}',
    params: {id: null},
    templateUrl: 'html/campaignLobby.html',
    controller: 'CampaignLobbyCtrl',
    resolve: {
      campaign: ['$stateParams', 'campaigns', function($stateParams, campaigns) {
        return campaigns.get($stateParams.id);
      }],
      player: ['auth', 'players', function(auth, players) {
        return players.get(auth.currentUserId());
      }]
    },
    onExit: ['$stateParams', 'chatSocket', 'auth', 'campaigns', function($stateParams, chatSocket, auth, campaigns) {
      chatSocket.removePlayer(auth.currentUserId());
      // Check to see if the user is exiting because of a deleted campaign
      // Set the campaign to private if the user leaving is the dungeon master
      campaigns.get($stateParams.id).then((campaign) => {
        if (campaign.dm._id == auth.currentUserId() && !campaign.private) {
          campaigns.toggleOpen($stateParams.id);
        }
      }, (err) => {
        console.error(err);
      });
    }]
  })
  .state('campaignSession', {
    url: '/campaignSession/{id}',
    params: {id: null},
    controller: 'CampaignSessionCtrl',
    templateUrl: 'html/campaignSession/campaignSession.html',
    resolve: {
      campaign: ['$stateParams', 'campaigns', function($stateParams, campaigns) {
        return campaigns.get($stateParams.id);
      }],
      player: ['auth', 'players', function(auth, players) {
        return players.get(auth.currentUserId());
      }]
    },
    onExit: ['$stateParams', 'chatSocket', 'auth', 'campaigns', function($stateParams, chatSocket, auth, campaigns) {
      chatSocket.removePlayer(auth.currentUserId());

      campaigns.get($stateParams.id).then( (res) => {
        if (res.dm._id == auth.currentUserId()) {
          chatSocket.endSession();

          campaigns.toggleSession($stateParams.id, false);
        }
      });


    }]
  })
  .state('newCharacter', {
    url: '/new/character',
    templateUrl: 'html/charCreationTest.html',
    controller: 'CharCtrl'
  });
  $urlRouterProvider.otherwise('home');
}]);

// Controller for the home page
app.controller('MainCtrl', ['$scope', 'auth', function($scope, auth) {
  $scope.isLoggedIn = auth.isLoggedIn;
}]);

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

//Service For the players campaign list, allows updating of the list outside the player controller
app.service('playerCampaignList', function () {
    //Make an empty object to store the players campaign list into, set in PlayerCtrl
    return {};
});

//Factory for campaigns
app.factory('campaigns', ['$http', 'socketFactory', function($http, socketFactory) {
  var campaigns = {};

  var socket = socketFactory();

  // Get all public campaigns
  campaigns.getPublic = function() {
    return $http.get('/publicCampaigns').then((res) => {
      return res.data;
    });
  };

  //Get a campaign by its ID
  campaigns.get = function(campaignID) {
    return $http.get(`/campaigns/${campaignID}`).then((res) => {
      return res.data;
    });
  };

  //Get a campaign by its code
  campaigns.getFromCode = function(code) {
    return $http.get(`/campaignByCode/${code}`).then((res) => {
      return res.data;
    });
  };

  //put a player into a campaigns player list
  campaigns.putPlayerInCampaign = function(campaignID, playerID) {
    return $http.put(`/addPlayerToCampaign/${campaignID}`, {player: playerID}).then((res) => {
      return res.data;
    });
  };

  campaigns.removePlayerFromCampaign = function(campaign, player) {
    return $http.put('/removePlayerFromCampaign/'+campaign, {player: player}).then(function(res) {
      return res.data;
    });
  }

  //Create a campaign (put it into the database)
  campaigns.create = function(campaign) {
    return $http.post('/campaigns/new', campaign).then((res) => {
      // If the campaign was public, remove it from the public campaigns list
      if (!res.data.private) {
        socket.emit('add-public-campaign', {campaignID: res.data._id});
      }
      return res.data;
    });
  };

  //Delete a campaign
  campaigns.delete = function(campaignID) {
    return $http.delete(`/delete/campaign/${campaignID}`).then((res) => {
      // Tell the sockets that a campaign was deleted
      socket.emit('campaign-deleted', `campaign-${campaignID}`, {campaignID: campaignID});

      // If the campaign was public, remove it from the public campaigns list.
      if (!res.data.private) {
        socket.emit('remove-public-campaign', {campaignID: campaignID});
      }

      // Return the response data
      return res.data;
    });
  };

  campaigns.toggleOpen = function(campaignID) {
    return $http.post(`/campaign/toggleOpen/${campaignID}`).then((res) => {
      // Add or remove the campaign from the public campaigns list
      if (res.data.value) {
        socket.emit('remove-public-campaign', {campaignID: campaignID});
      } else {
        socket.emit('add-public-campaign', {campaignID: campaignID});
      }
      return res.data;
    });
  };

  campaigns.toggleSession = function(campaignID, isLive) {
    return $http.put('/toggleCampaignSession/'+campaignID, {isLive:isLive});
  };

  // Get a specific campaign
  campaigns.getPublicCampaign = function(campaignID) {
    return $http.get(`/campaigns/public/${campaignID}`).then((res) => {
      return res.data;
    });
  };

  campaigns.addPlayerToBlacklist = function(campaign, player){
    return $http.put('/addPlayerToBlacklist/'+campaign, {player:player});
  };

  campaigns.removePlayerFromBlacklist = function(campaign, player){
    return $http.put('/removePlayerFromBlacklist/'+campaign, {player:player});
  };

  return campaigns;
}]);

app.factory('players', ['$http', function($http) {
  var players = {};

  players.get = function(id) {
    return $http.get('/players/' + id).then(function(res) {
      return res.data;
    });
  };

  players.putCampaignInPlayer = function(player, campaign) {
    return $http.put('/addCampaignToPlayer/'+player, {campaign: campaign}).then(function(res) {
      return res.data;
    });
  };

  players.removeCampaignFromPlayer = function(player, campaign) {
    return $http.put('/removeCampaignFromPlayer/'+player, {campaign: campaign}).then(function(res) {
      return res.data;
    });
  };

  players.getPlayerName = function(playerID) {
    return $http.get('/player/name/' + playerID).then((res) => {
      return res.data;
    });
  };

  return players;
}]);

app.factory('auth', ['$http', '$window', function($http, $window) {
  var auth = {};

  auth.saveToken = function (token) {
    $window.localStorage['dungeon-manager-token'] = token;
  };

  auth.getToken = function () {
    return $window.localStorage['dungeon-manager-token'];
  };

  auth.isLoggedIn = function() {
    var token = auth.getToken();

    if (token) {
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.exp > Date.now() / 1000;
    } else {
      return false;
    }
  };

  auth.currentUser = function() {
    if (auth.isLoggedIn()) {
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));
      return payload.name;
    }
  };

  auth.currentUserId = function() {
    if (auth.isLoggedIn()) {
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));
      return payload._id;
    }
  };

  auth.register = function(player) {
    return $http.post('/register', player).then(function(res) {
      auth.saveToken(res.data.token);
    });
  };

  auth.logIn = function(player) {
    return $http.post('/login', player).then(function(res) {
      auth.saveToken(res.data.token);
    });
  };

  auth.logOut = function() {
    $window.localStorage.removeItem('dungeon-manager-token');
  };

  auth.getPlayer = function(playerEmail) {
    return $http.get('/player/' + playerEmail).then(function(res) {
      return res.data;
    });
  }

  return auth;
}]);


// Controller for the navigation bar
app.controller('NavCtrl', ['$scope', '$state', 'auth', '$uibModal', function($scope, $state, auth, $uibModal) {
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;

  // Logs the user out
  $scope.logOutPrompt = function() {

    // Set the modals information
    $scope.modalInfo = {
      message: 'Are you sure you want to log out?',
      button: 'Log Out'
    };

    // Open the confirmation modal
    var modalInstance = $uibModal.open({
      templateUrl: '/html/confirmModal.html',
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      size: 'sm',
      keyboard: true,
      scope: $scope
    });

    // Wait for the user to respond
    modalInstance.result.then(() => {
      auth.logOut();
      $state.go('home');
    });

  };

  // Opens up the register modal
  $scope.showRegister = function() {
    $uibModal.open({
      templateUrl: '/html/register.html',
      controller: 'RegisterCtrl',
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      keyboard: true
    });
  };

  // Opens up the login modal
  $scope.showLogin = function() {
    $uibModal.open({
      templateUrl: '/html/login.html',
      controller: 'LoginCtrl',
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      keyboard: true
    });
  };
}]);

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
           }
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
app.controller('CharacterListCtrl', ['$scope', function($scope) {
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
