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
    }
  })
  .state('campaignSession', {
    url: '/campaignSession/{id}',
    params: {id: null},
    controller: 'CampaignSessionCtrl',
    templateUrl: 'html/campaignSession.html',
    resolve: {
      campaign: ['$stateParams', 'campaigns', function($stateParams, campaigns) {
        return campaigns.get($stateParams.id);
      }]
    }
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
['$scope', '$uibModal', '$state', 'campaign', 'campaigns', 'auth', 'player', 'chatSocket',
function($scope, $uibModal, $state, campaign, campaigns, auth, player, chatSocket) {
  // Room name for socket.io
  var room = 'campaign-' + campaign._id;

  $scope.campaign = campaign;
  $scope.activePlayers = [];

  chatSocket.emit('join-room', room);
  chatSocket.emit('request-players', room, {playerID: auth.currentUserId()})
  if (auth.currentUserId() !== campaign.dm._id) {
    chatSocket.emit('add-player', room, {player: player});
  }

  $scope.isDM = (auth.currentUserId() !== campaign.dm._id);

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

  // Event for adding a player to the player list
  chatSocket.on('add-player', (data) => {
    if (data.player) {
      // Make sure that the player does not already exist.
      var playerExists = false;
      $scope.activePlayers.forEach((value) => {
        if (value._id === data.player._id) {
          playerExists = true;
        }
      });
      if (!playerExists) {
        $scope.activePlayers.push(data.player);
      }
    }
  });

  // Event for when a player requests all the players
  chatSocket.on('request-players', (data) => {
    if (data.playerID) {
      // Make sure that the DM does not send their information
      if (auth.currentUserId() !== campaign.dm._id) {
        chatSocket.emit('add-player-to-another', 'campaign-' + $scope.campaign._id, {playerID: data.playerID, player: player})
      }
    }
  });

  // Event for when a player needs to add another directly
  chatSocket.on('add-player-to-another', (data) => {
    if (data.playerID && data.player) {
      // Check if the current player is the one that should be adding this player
      if (data.playerID === auth.currentUserId()) {
        $scope.activePlayers.push(data.player);
      }
    }
  });

  // Event for removing a player from the player list
  chatSocket.on('remove-player', (data) => {
    if (data.playerID) {

    }
  });

  // Event for kicking a certain player
  chatSocket.on('kick-player', (data) => {
    if (data.playerID) {

    }
  });

}]);

//Factory for campaigns
app.factory('campaigns', ['$http', function($http) {
  var campaigns = {};


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
app.controller('PlayerCtrl', ['$scope', '$state', '$uibModal', 'auth', 'player', function($scope, $state, $uibModal, auth, player) {
  $scope.isLoggedIn = auth.isLoggedIn;

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

  $scope.campaignList = player.campaigns;

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


// Controller for the lobby list on the player homepage
app.controller('CampaignLobbyListCtrl', ['$scope', 'auth', 'campaigns', 'players', '$state', function($scope, campaigns){
  $scope.openCampaigns = []; // array to hold public campaigns
  campaigns.getPublic().then(function(res) {
    angular.copy(res.data, $scope.openCampaigns);
  }, function(error) {
    console.log(error); // prints error to console
  });

  /*$scope.joinPublicCampaignClick = function($scope, auth, campaigns, players, $state) {
    //Var to store the campaign code
    $scope.code;

    //Join Campaign function (linked to join campaign button in html)
    $scope.joinCampaign = function() {
      campaigns.getFromCode($scope.code).then(function(res) {

        //add the campaign to the players campaign list
        players.putCampaignInPlayer(auth.currentUserId(), res._id).then(function(res){
        }, function(err) {
          $scope.error = err.data;
        });

        //Add the player to the campaign player list
        campaigns.putPlayerInCampaign(res._id, auth.currentUserId()).then(function(res){
        }, function(err) {
          $scope.error = err.data;
        });

        //direct the player to the campaign lobby page
        $state.go('campaignLobby', {id: res._id});
      }, function(err){
        $scope.error = err.data;
      });
    };
  }*/
}]);

// Controller for the new character page
app.controller('NewCharacterCtrl', ['$scope', function($scope) {

}]);
