// Main angular app
var app = angular.module('dungeonManager', ['ui.router', 'angularModalService']);

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
    onEnter: ['$state', 'auth', function($state, auth) {
      if (!auth.isLoggedIn()) {
        $state.go('home');
      }
    }]
  });
  $urlRouterProvider.otherwise('home');
}]);

app.controller('MainCtrl', ['$scope', 'auth', function($scope, auth) {
  $scope.isLoggedIn = auth.isLoggedIn;
}]);

app.controller('PlayerCtrl', ['$scope', 'auth', function($scope, auth) {
  $scope.isLoggedIn = auth.isLoggedIn;

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

      return payload.email;
    }
  };

  auth.register = function(player) {
    return $http.post('/register', player).success(function(data) {
      auth.saveToken(data.token);
    });
  };

  auth.logIn = function(player) {
    return $http.post('/login', player).success(function(data) {
      auth.saveToken(data.token);
    });
  };

  auth.logOut = function() {
    $window.localStorage.removeItem('dungeon-manager-token');
  };

  auth.getPlayer = function(playerEmail) {
    return $http.get('/player/' + playerEmail).then(function(res) {
      console.log(res);
      return res.data;
    });
  }

  return auth;
}]);

app.controller('NavCtrl', ['$scope', '$state', 'auth', 'ModalService', function($scope, $state, auth, ModalService) {
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;

  $scope.logOut = function() {
    auth.logOut();
    $state.go('home');
  }

  $scope.showRegister = function() {
    ModalService.showModal({
      templateUrl: '/html/register.html',
      controller: 'RegisterCtrl'
    }).then(function(modal) {
      modal.element.modal();
    });
  };

  $scope.showLogin = function() {
    ModalService.showModal({
      templateUrl: '/html/login.html',
      controller: 'LoginCtrl'
    }).then(function(modal) {
      modal.element.modal();
    });
  };

}]);
