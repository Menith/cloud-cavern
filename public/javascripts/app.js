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
    url: '/campaignLobby/{campaignID}/{characterID}',
    params: {campaignID: null, characterID: null},
    templateUrl: 'html/campaignLobby.html',
    controller: 'CampaignLobbyCtrl',
    resolve: {
      campaign: ['$stateParams', 'campaigns', function($stateParams, campaigns) {
        return campaigns.get($stateParams.campaignID);
      }],
      player: ['auth', 'players', function(auth, players) {
        return players.get(auth.currentUserId());
      }],
      character: ['$stateParams', 'characters', function($stateParams, characters) {
        return characters.get($stateParams.characterID);
      }]
    },
    onExit: ['$stateParams', 'campaignSocket', function($stateParams, campaignSocket) {
      campaignSocket.removePlayer();
      // Set the campaign to private if the user leaving is the dungeon master
      // Will do in base.js
    }]
  })
  .state('campaignSession', {
    url: '/campaignSession/{campaignID}/{characterID}',
    params: {campaignID: null, characterID: null},
    controller: 'CampaignSessionCtrl',
    templateUrl: 'html/campaignSession/campaignSession.html',
    resolve: {
      campaign: ['$stateParams', 'campaigns', function($stateParams, campaigns) {
        return campaigns.get($stateParams.campaignID);
      }],
      player: ['auth', 'players', function(auth, players) {
        return players.get(auth.currentUserId());
      }],
      character: ['$stateParams', 'characters', function($stateParams, characters) {
        return characters.get($stateParams.characterID);
      }]
    },
    onExit: ['$stateParams', 'campaignSocket', function($stateParams, campaignSocket) {
      campaignSocket.removePlayer();
    }]
  })
  .state('newCharacter', {
    url: '/new/character',
    templateUrl: 'html/charCreationTest.html',
    controller: 'CharCtrl'
  })
  .state('help', {
    url: '/help',
    templateUrl: 'html/help.html',
    controller: 'HelpCtrl'
  });
  $urlRouterProvider.otherwise('home');
}]);

// Controller for the home page
app.controller('MainCtrl', ['$scope', 'auth', function($scope, auth) {
  $scope.isLoggedIn = auth.isLoggedIn;
}]);

// Controller for the navigation bar
app.controller('NavCtrl',
['$scope', '$state', '$uibModal', 'auth',
function($scope, $state, $uibModal, auth) {

  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;

  // Function for log out button
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
      // Log the user out
      auth.logOut();
      // Send them to the home page
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

app.controller('HelpCtrl', ['$scope', function($scope) {
  $scope.accordion = {
    registration: false,
    character: false,
    joinCampaign: false,
    edition: false,
    editCharacter: false,
    characterAmount: false,
    campaignAmount: false,
    startCampaign: false
  }
  $scope.toggleRegistration = function() {
    console.log("In toggleRegistration")
    $scope.accordion.registration = !$scope.accordion.registration
  }
}]);
