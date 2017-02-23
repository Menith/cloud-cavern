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
    url: '/campaignLobby',
    params: {id: null},
    templateUrl: 'html/campaignLobby.html',
    controller: 'CampaignLobbyCtrl',
    resolve: {
      campaign: ['$stateParams', 'campaigns', function($stateParams, campaigns) {
        return campaigns.get($stateParams.id);
      }]
    }
  });
  $urlRouterProvider.otherwise('home');
}]);

app.controller('MainCtrl', ['$scope', 'auth', function($scope, auth) {
  $scope.isLoggedIn = auth.isLoggedIn;
}]);

app.controller('CampaignLobbyCtrl', ['$scope', '$uibModal', '$state', 'campaign', 'campaigns', 'auth', 'players', function($scope, $uibModal, $state, campaign, campaigns, auth, players) {
  $scope.campaign = campaign;

  $scope.isDM = (auth.currentUserId() !== campaign.dm._id);
  console.log((auth.currentUserId() !== campaign.dm._id));

  $scope.deleteCampaign = function(){
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
      },function(error){

      });
    });
  };

}]);

app.factory('campaigns', ['$http', function($http) {
  var campaigns = {};

  campaigns.get = function(id) {
    return $http.get('/campaigns/' + id).then(function(res) {
      return res.data;
    });
  };

  campaigns.getFromCode = function(code) {
    return $http.get('/campaignByCode/' + code).then(function(res) {
      return res.data;
    });
  };

  campaigns.putPlayerInCampaign = function(campaign, player) {
    return $http.put('/addPlayerToCampaign/'+campaign, {player: player}).then(function(res) {
      return res.data;
    });
  };

  campaigns.create = function(campaign) {
    return $http.post('/campaigns', campaign).then(function(res) {
      return res.data;
    });
  };

  campaigns.delete = function(id){
    return $http.put('/delete/campaign', {id:id});
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

    var modalInstance = $uibModal.open({
      templateUrl: '/html/confirmModal.html',
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      size: 'sm',
      keyboard: true,
      scope: $scope
    });

    modalInstance.result.then(() => {
      auth.logOut();
      $state.go('home');
    });

  }

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

app.controller('PlayerCtrl', ['$scope', 'auth', 'campaigns', '$uibModal', 'player', function($scope, auth, campaigns, $uibModal, player) {
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

  $scope.showJoinCampaignCodeModal = function() {
    $uibModal.open({
      templateUrl: '/html/joinCampaignCodeModal.html',
      controller: 'JoinCampaignCodeCtrl',
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      keyboard: true
    });
  };

}]);
