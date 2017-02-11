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

app.controller('CreateCampaignCtrl', ['$scope', 'auth', 'campaigns', '$state', '$uibModalInstance', function($scope, auth, campaigns, $state, $uibModalInstance){
  $scope.campaign = {};
  $scope.campaign.private = false;
  $scope.createCampaign = function() {
    //Create Campaign Code
    var chars = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    var date = new Date();
    var year = chars[date.getYear()%100];
    var month = chars[date.getMonth()];
    var day = chars[date.getDate()];
    var hour = chars[date.getHours()];
    var minutes = chars[date.getMinutes()];
    var seconds = chars[date.getSeconds()];
    var miliseconds2 = chars[Math.trunc(date.getMilliseconds()/64)];
    var miliseconds1 = chars[date.getMilliseconds()%64];

    //add to campaign object
    $scope.campaign.code = year+month+day+hour+minutes+seconds+miliseconds2+miliseconds1;
    $scope.campaign.dm = auth.currentUserId();
    $scope.campaign.players = [];

    //Create db entry
    campaigns.create($scope.campaign).then(function(res) {

      $state.go('campaignLobby', {id: res._id});


      $uibModalInstance.close();
      console.log(res);
    }, function(err) {
      $scope.error = err.data;
    });


  }

  $scope.cancel = function() {
    $uibModalInstance.close();
  }

}]);
