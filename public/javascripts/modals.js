app.controller('RegisterCtrl', ['$scope', '$element', '$state', 'auth', function($scope, $element, $state, auth) {
  $scope.player = {};

  $scope.register = function() {
    if ($scope.player.password != $scope.confirmPassword) {
      $scope.error = {message: "Passwords do not match"};
      return;
    } else if ($scope.player.password.length < 6) {
      $scope.error = {message: "Passwords must be six or more characters"};
      return;
    }

    auth.register($scope.player).error(function(error) {
      $scope.error = error;
    }).then(function() {
      $element.modal('hide');
      setTimeout(function(){ $state.go('player'); }, 500);
    });

  };

  $scope.cancel = function() {
    $element.modal('hide');
  }

}]);

app.controller('LoginCtrl', ['$scope', '$element', '$state', 'auth', function($scope, $element, $state, auth){
  $scope.player = {};

  $scope.logIn = function() {
    auth.logIn($scope.player).error(function(error) {
      $scope.error = error;
    }).then(function() {
      $element.modal('hide');
      setTimeout(function(){ $state.go('player'); }, 500);
    });
  };

  $scope.cancel = function() {
    $element.modal('hide');
  }
}]);
