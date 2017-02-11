// Controller for creating a new account.
app.controller('RegisterCtrl', ['$scope', '$state', 'auth', '$uibModalInstance', function($scope, $state, auth, $uibModalInstance) {
  $scope.player = {};

  $scope.register = function() {
    if ($scope.player.password != $scope.confirmPassword) {
      $scope.error = {message: "Passwords do not match"};
      return;
    } else if (!$scope.player.password) {
      $scope.error = {message: "You must use a password"};
      return;
    } else if ($scope.player.password.length < 6) {
      $scope.error = {message: "Passwords must be six or more characters"};
      return;
    }

    auth.register($scope.player).then(function() {
      $uibModalInstance.close();
      $state.go('player');
    }, function(error) {
      $scope.error = error.data;
    });

  };

  $scope.cancel = function() {
    $uibModalInstance.close();
  }

}]);

// Controller for logging in.
app.controller('LoginCtrl', ['$scope', '$state', 'auth', '$uibModalInstance', function($scope, $state, auth, $uibModalInstance){
  $scope.player = {};

  $scope.logIn = function() {
    auth.logIn($scope.player).then(function() {
      $uibModalInstance.close();
      $state.go('player');
    }, function(error) {
      $scope.error = error.data;
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.close();
  }
}]);
