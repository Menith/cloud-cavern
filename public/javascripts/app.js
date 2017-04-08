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
    onExit: ['chatSocket', 'auth', function(chatSocket, auth) {
      chatSocket.removePlayer(auth.currentUserId());
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
    onExit: ['chatSocket', 'auth', function(chatSocket, auth) {
      chatSocket.removePlayer(auth.currentUserId());
    }]
  })
  .state('newCharacter', {
    url: '/new/character',
    templateUrl: 'html/charCreationTest.html',
    controller: 'NewCharacterCtrl'
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

  //store the campaign into the scope variable
  $scope.campaign = campaign;

  $scope.activePlayers = [];

  var socket = socketFactory();
  chatSocket.initialize(socket, 'campaign-' + campaign._id, player, $scope.activePlayers, campaign._id, campaign.dm._id);

  if (auth.currentUserId() !== campaign.dm._id) {
    chatSocket.addPlayer(player);
  }

  $scope.isDM = (auth.currentUserId() == campaign.dm._id);

  $scope.toggleButtonText = ($scope.campaign.private) ? 'Open Lobby' : 'Close Lobby';
  $scope.lobbyStatus = ($scope.campaign.private) ? 'Private' : 'Public';

  $scope.deleteCampaign = function() {
    $scope.modalInfo = {
      message: 'Are you sure you want to dissolve campaign?',
      button: 'Yes'
    };

    var modalInstance = $uibModal.open({
      templateUrl: '/html/confirmModal.html',
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      size: 'sm',
      keyboard: true,
      scope: $scope
    });

    modalInstance.result.then(() => {
      campaigns.delete(campaign._id).then(function(res){
        $state.go('player');
      });
    });
  };

  // Toggles between a public and private campaign
  $scope.toggleOpen = function() {
    campaigns.toggleOpen($scope.campaign._id).then((res) => {

      $scope.campaign.private = !$scope.campaign.private;
      $scope.toggleButtonText = ($scope.campaign.private) ? 'Open Lobby' : 'Close Lobby';
      $scope.lobbyStatus = ($scope.campaign.private) ? 'Private' : 'Public';

    }, (error) => {

    });
  };

  $scope.startSession = function() {
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
app.factory('campaigns', ['$http', function($http) {
  var campaigns = {};

  //Get all public campaigns
  campaigns.getPublic = function(){
    return $http.get("/publicCampaigns");
  };

  //Get a campaign by its ID
  campaigns.get = function(id) {
    return $http.get('/campaigns/' + id).then(function(res) {
      return res.data;
    });
  };

  //Get a campaign by its code
  campaigns.getFromCode = function(code) {
    return $http.get('/campaignByCode/' + code).then(function(res) {
      return res.data;
    });
  };

  //put a player into a campaigns player list
  campaigns.putPlayerInCampaign = function(campaign, player) {
    return $http.put('/addPlayerToCampaign/'+campaign, {player: player}).then(function(res) {
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
    return $http.post('/campaigns', campaign).then(function(res) {
      return res.data;
    });
  };

  //Delete a campaign
  campaigns.delete = function(id){
    return $http.put('/delete/campaign', {id:id});
  };

  campaigns.toggleOpen = function(id){
    return $http.put('/campaign/toggleOpen', {id:id});
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
app.controller('PlayerCtrl', ['$scope', '$state', '$uibModal', 'auth', 'player', 'playerCampaignList',
  function($scope, $state, $uibModal, auth, player, playerCampaignList) {

  $scope.isLoggedIn = auth.isLoggedIn;

  //Set the playerCampaignList service equal to the campaign list stored in player
  playerCampaignList.playerCampaignList = player.campaigns;

  //Set the campaignList equal to the serices list. This will auto update when the services data is changed
  $scope.campaignList = playerCampaignList.playerCampaignList;

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

  $scope.newCharacter = function() {
    $state.go('newCharacter');
  };

}]);

//Controller for the CampaignList div on the playerHome html page
app.controller('PlayerCampaignListCtrl',
['$scope', '$state', '$uibModal', 'auth', 'campaigns', 'players', 'playerCampaignList',
function($scope, $state, $uibModal, auth, campaigns, players, playerCampaignList) {

  //variable that holds the campaign clicked on by the user
  $scope.currentCampaign;

  //Function called when a player clicks on the join button on the players campaign list
  $scope.openJoinCampaignModal = function(index) {

    //Get the campaign the player clicked on by its index in the ng-repeat
    $scope.currentCampaign = playerCampaignList.playerCampaignList[index];

    //Player that clicked the campaign is the DM
    if (auth.currentUserId() === $scope.currentCampaign.dm) {

      //Open the modal with options for the dungeon master
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
    }

}]);

// Controller for the lobby list on the player homepage
app.controller('CampaignLobbyListCtrl', ['$scope', 'auth', 'campaigns', 'players', '$state', function($scope, auth, campaigns, players, $state) {

   // array to hold public campaigns
  $scope.openCampaigns = [];

  campaigns.getPublic().then(function(res) {
    //TODO: use map, cut out blacklist stuff

    $scope.openCampaigns = res.data.filter(function(campaign) {
      var index = campaign.blacklist.indexOf(auth.currentUserId());

      return index == -1;

    });
    /*
    angular.copy(res.data, $scope.openCampaigns);
  }, function(error) {
    console.log(error); // prints error to console */
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
}]);

// Controller for the new character page
app.controller('NewCharacterCtrl', ['$scope', function($scope) {

}]);
