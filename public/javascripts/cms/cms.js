var cms = angular.module('dungeonModerator', ['ui.router', 'ui.bootstrap', 'ngAnimate', 'ngTouch']);

// Set up the CMS angular app's configuration. Mostly used for routing.
cms.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
  // Define all of the routes for the app
  $stateProvider.state('login', {
    url: '/login',
    templateUrl: '/html/cms/moderatorLogin.html',
    controller: 'ModLoginCtrl',
    onEnter: ['$state', 'auth', function($state, auth) {
      if (auth.isLoggedIn()) {
        $state.go('home.moderator');
      }
    }]
  })
  .state('home', {
    templateUrl: '/html/cms/cmsHome.html',
    onEnter: ['$state', 'auth', function($state, auth) {
      if (!auth.isLoggedIn()) {
        $state.go('login');
      }
    }]
  })
  .state('home.moderator', {
    url: '/cms/moderator',
    templateUrl: '/html/cms/moderatorHome.html'
  })
  .state('home.newModerator', {
    url: '/cms/new/moderator',
    templateUrl: '/html/cms/newMod.html',
    controller: 'NewModCtrl'
  })
  .state('home.moderatorList', {
    url: '/cms/moderator/list',
    templateUrl: '/html/cms/moderatorList.html',
    controller: 'ModeratorListCtrl',
    resolve: {
      moderatorList: ['moderators', function(moderators) {
        return moderators.getAll();
      }]
    }
  })
  .state('home.modSettings', {
    url: '/cms/moderator/settings',
    templateUrl: '/html/cms/modSettings.html',
    controller: 'ModSettingsCtrl'
  })
  .state('home.campaignList', {
    url: '/cms/campaign/list',
    templateUrl: '/html/cms/campaignsList.html',
    controller: 'CampaignListCtrl',
    resolve: {
      campaignList: ['campaigns', function(campaigns) {
        return campaigns.getAllWithDetail();
      }]
    }
  })
  .state('home.campaignEdit', {
    url: '/cms/campaign/edit/{id}',
    params: {id: null},
    templateUrl: '/html/cms/campaignEdit.html',
    controller: 'CampaignEditCtrl',
    resolve: {
      campaign: ['$stateParams', 'campaigns', function($stateParams, campaigns) {
        return campaigns.get($stateParams.id);
      }]
    }
  })
  .state('home.playerList', {
    url: '/cms/player/list',
    templateUrl: '/html/cms/playersList.html',
    controller: 'PlayerListCtrl',
    resolve: {
      playerList: ['players', function(players) {
        return players.getAllWithDetail();
      }]
    }
  })
  .state('home.playerEdit', {
    url: '/cms/player/edit/{id}',
    templateUrl: '/html/cms/playerEdit.html',
    controller: 'PlayerEditCtrl',
    resolve: {
      player: ['$stateParams', 'players', function($stateParams, players) {
        return players.get($stateParams.id);
      }]
    }
  });
  $urlRouterProvider.otherwise('login');
}]);

// Login controller
cms.controller('ModLoginCtrl', ['$scope', '$state', 'auth', function($scope, $state, auth) {
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.moderator = {};

  // Attempts to log the user in with the given credentials
  $scope.logIn = function() {
    // Clear all alerts
    $scope.error = null;

    // Check to ensure that the user has filled out all fields
    if (!$scope.moderator.username || !$scope.moderator.password) {
      $scope.error = {message: 'Please fill out all fields'};
      return;
    }

    auth.logIn($scope.moderator).then((res) => {
      // Login was successfull, send moderator to the home page
      $state.go('home.moderator');
    }, (error) => {
      // There was an error loggin in, display the error
      $scope.error = error.data;
    });
  };
}]);

// Navigation controller
cms.controller('NavCtrl', ['$scope', '$state', 'auth', function($scope, $state, auth) {
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;

  // Logs the current moderator out
  $scope.logOut = function() {
    auth.logOut();
    $state.go('login');
  }
}]);
