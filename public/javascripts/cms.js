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
    controller: 'ModeratorListCtrl'
  })
  .state('home.modSettings', {
    url: '/cms/moderator/settings',
    templateUrl: '/html/cms/modSettings.html',
    controller: 'ModSettingsCtrl'
  })
  .state('home.campaignList', {
    url: '/cms/campaign/list',
    templateUrl: '/html/cms/campaignsList.html',
    controller: 'CampaignListCtrl'
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

// Authentication factory, used to handle all requests regarding current user or authentication
cms.factory('auth', ['$http', '$window', function($http, $window) {
  var auth = {};

  // Adds an authentication token to the current window with the name of dungeon-moderator-token
  auth.saveToken = function (token) {
    $window.localStorage['dungeon-moderator-token'] = token;
  };

  // Gets an authentication token from the current window with the name dungeon-moderator-token
  auth.getToken = function () {
    return $window.localStorage['dungeon-moderator-token'];
  };

  // Checks if the current user has an active authentication token
  auth.isLoggedIn = function() {
    var token = auth.getToken();

    if (token) {
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.exp > Date.now() / 1000;
    } else {
      return false;
    }
  };

  // Returns the username of the current moderator
  auth.currentUser = function() {
    if (auth.isLoggedIn()) {
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));
      return payload.username;
    }
  };

  // Registers the given moderator
  auth.register = function(moderator) {
    return $http.post('/moderator/register', moderator);
  };

  // Logs the given moderator in, if they have provided corrent login credentials
  auth.logIn = function(moderator) {
    return $http.post('/moderator/login', moderator).then((res) => {
      auth.saveToken(res.data.token);
    });
  };

  // Logs the current moderator out, removing their authentication token
  auth.logOut = function() {
    $window.localStorage.removeItem('dungeon-moderator-token');
  };

  return auth;
}]);

// Moderators factory, used to handle all operations regarding moderators
cms.factory('moderators', ['$http', function($http) {
  var moderators = {};

  // Goes out to the database and finds all of the moderators
  moderators.getAll = function() {
    return $http.get('/moderator/moderators');
  };

  // Goes out to the database and deletes a moderator with the given username
  moderators.delete = function(username) {
    return $http.put('/moderator/delete/moderator/', {username: username});
  }

  return moderators;
}]);

// Campaigns factory, used to handle all operations regarding campaigns
cms.factory('campaigns', ['$http', function($http) {
  var campaigns = {};

  // Goes out the database and gathers all of the campaigns and populates them
  // with their given dungeon master and players.
  campaigns.getAllWithDetail = function() {
    return $http.get('/moderator/campaignsWithDetails');
  };

  return campaigns;
}]);

// Characters factory, used to handle all operations regarding characters
cms.factory('characters', ['$http', function($http) {
  var characters = {};

  return characters;
}]);

// Players factory, used to handle all operations regarding players
cms.factory('players', ['$http', function($http) {
  var players = {};

  return players;
}]);

cms.controller('NewModCtrl', ['$scope', 'auth', function($scope, auth) {
  $scope.newMod = {};

  // Create a new moderator
  $scope.register = function() {
    // Clear any alerts on the screen
    $scope.error = null;
    $scope.success = null;

    // Ensure that the user has input favorable text
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

    // Call to actually create a new moderator
    auth.register($scope.newMod).then((result) => {
      // Moderator was successfuly created
      $scope.success = {message: 'New Moderator Created!'};
      $scope.newMod.username = '';
      $scope.newMod.password = '';
      $scope.confirmPassword = '';
    }, function(error) {
      // There was an error creating a moderator
      $scope.error = error.data;
    });
  };

}]);

// Moderator list controller
cms.controller('ModeratorListCtrl', ['$scope', '$uibModal', 'moderators', function($scope, $uibModal, moderators) {
  $scope.mods = [];

  // Populates the mods array with all the moderators that are in the database
  moderators.getAll().then((result) => {
    // copy the data from the result if the request was successfull
    angular.copy(result.data, $scope.mods);
  }, (error) => {
    // Show an error if the request failed
    $scope.error = error.data;
  });

  $scope.deleteModerator = function(name) {
    // Clear any alerts on the screen
    $scope.error = null;
    $scope.success = null;

    // Set the modals information
    $scope.modalInfo = {
      message: 'Are you sure you want to delete the moderator ' + name + '?',
      button: 'Delete'
    };

    // Open a confirmation modal
    var modalInstance = $uibModal.open({
      templateUrl: '/html/confirmModal.html',
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      size: 'md',
      keyboard: true,
      scope: $scope
    });

    // Wait for the user to respond
    modalInstance.result.then(() => {
      // Delete the selected moderator
      moderators.delete(name).then((result) => {
        // Find the moderator that was deleted in local array
        var modIndex = -1;
        $scope.mods.forEach((value, index) => {
          if (value.username == name) {
            modIndex = index;
          }
        });
        // If the moderator that was delete is in the local array, delete it
        if (modIndex != -1) {
          $scope.mods.splice(modIndex, 1);
        }
        $scope.success = {message: 'Successfuly deleted moderator'};
      }, (error) => {
        // There was an error deleting the moderator
        $scope.error = error.data;
      });
    });
  };

  $scope.changeModeratorUsername = function(id) {
    //TODO: Implement this funtion
  };

}]);

// Moderator settings controller
cms.controller('ModSettingsCtrl', ['$scope', 'auth', '$uibModal', function($scope, auth, $uibModal) {

  // Open up a modal to change the current users password
  // see ModNewPassCtrl for more information
  $scope.showChangePasswordModal = function() {
    $uibModal.open({
      templateUrl: '/html/cms/modNewPass.html',
      controller: 'ModNewPassCtrl',
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      keyboard: true
    });
  };

}]);

// Moderator new password modal controller
cms.controller('ModNewPassCtrl', ['$scope', '$uibModalInstance', '$http', 'auth', function($scope, $uibModalInstance, $http, auth) {

  // Closes the new password modal
  $scope.cancel = function() {
    $uibModalInstance.close();
  };

  // changes the current moderators password
  $scope.changePassword = function() {
    // Remove all alerts
    $scope.error = null;

    // Check to ensure that the two passwords match
    if ($scope.newPassword !== $scope.newPasswordConfirm) {
      $scope.error = {message: 'Passwords do not match.'};
      return;
    } else {
      // build our request body with the current moderators username, their current password, and the new password
      var body = {
        username: auth.currentUser(),
        password: $scope.currentPassword,
        newPassword: $scope.newPassword
      };
      // Send the information off to the router
      $http.post('/moderator/changeModPass', body).then((result) => {
        // Close the modal if the password change went through
        $uibModalInstance.close();
      }, (error) => {
        // Show an error message if the password change was rejected
        $scope.error = error.data;
      });
    }
  };

}]);

// Campaign List Controller
cms.controller('CampaignListCtrl', ['$scope', 'campaigns', function($scope, campaigns) {
  $scope.campaigns = [];

  // Loads the campaigns array full of data based on what is in the database
  campaigns.getAllWithDetail().then((result) => {
    // copy the data from the result into the campaigns array if the request was successfull
    angular.copy(result.data, $scope.campaigns);
  }, (error) => {
    // Show an error message of the request failed
    $scope.error = error.data;
  });

}]);
