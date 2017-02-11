var cms = angular.module('dungeonModerator', ['ui.router', 'ui.bootstrap', 'ngAnimate', 'ngTouch']);

cms.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
  $stateProvider.state('login', {
    url: '/login',
    templateUrl: '/html/cms/moderatorLogin.html',
    controller: 'ModLoginCtrl',
    onEnter: ['$state', 'auth', function($state, auth) {
      if (auth.isLoggedIn()) {
        $state.go('home');
      }
    }]
  })
  .state('home', {
    url: '/home',
    templateUrl: '/html/cms/moderatorHome.html',
    controller: 'ModHomeCtrl',
    onEnter: ['$state', 'auth', function($state, auth) {
      if (!auth.isLoggedIn()) {
        $state.go('login');
      }
    }]
  });
  $urlRouterProvider.otherwise('login');
}]);

cms.controller('ModLoginCtrl', ['$scope', '$state', 'auth', function($scope, $state, auth) {
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.moderator = {};

  $scope.logIn = function() {
    auth.logIn($scope.moderator).then(function() {
      $state.go('home');
    }, function(error) {
      $scope.error = error.data;
    });
  };
}]);

cms.controller('ModHomeCtrl', ['$scope', 'auth', function($scope, auth) {
  $scope.isLoggedIn = auth.isLoggedIn;
}]);

cms.controller('NavCtrl', ['$scope', '$state', 'auth', function($scope, $state, auth) {
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;

  // Logs the user out
  $scope.logOut = function() {
    auth.logOut();
    $state.go('login');
  }
}]);

cms.factory('auth', ['$http', '$window', function($http, $window) {
  var auth = {};

  auth.saveToken = function (token) {
    $window.localStorage['dungeon-moderator-token'] = token;
  };

  auth.getToken = function () {
    return $window.localStorage['dungeon-moderator-token'];
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
      return payload.username;
    }
  };

  auth.register = function(moderator) {
    return $http.post('/register', moderator).then(function(res) {
      auth.saveToken(res.data.token);
    });
  };

  auth.logIn = function(moderator) {
    return $http.post('/moderator/login', moderator).then(function(res) {
      auth.saveToken(res.data.token);
    });
  };

  auth.logOut = function() {
    $window.localStorage.removeItem('dungeon-moderator-token');
  };

  return auth;
}]);


cms.directive("newMod", function() {
  return {
    templateUrl: '/html/cms/newMod.html'
  };
});

cms.controller('NewModCtrl', ['$scope', 'auth', function($scope, auth) {
  $scope.newMod = {};

  $scope.register = function() {
    if ($scope.newMod.password != $scope.confirmPassword) {
      $scope.error = {message: "Passwords do not match"};
      return;
    } else if (!$scope.newMod.password) {
      $scope.error = {message: "You must use a password"};
      return;
    } else if ($scope.newMod.password.length < 6) {
      $scope.error = {message: "Passwords must be six or more characters"};
      return;
    }

    auth.register($scope.newMod).then(null, function(error) {
      $scope.error = error.data;
    });

  };
}]);


cms.directive("modSettings", function() {
  return {
    templateUrl: '/html/cms/modSettings.html'
  };
});

cms.controller('ModSettingsCtrl', ['$scope', 'auth', function($scope, auth) {

}]);
