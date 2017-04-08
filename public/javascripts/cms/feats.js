cms.controller('FeatCreateCtrl', ['$scope', 'feats', function($scope, feats) {
  $scope.feat = {};

  $scope.createFeat = function() {
    $scope.success = null;
    $scope.error = null;
    feats.createFeat($scope.feat).then((resData) => {
      $scope.success = resData;
      $scope.feat = {};
    });
  };
}]);

cms.controller('FeatListCtrl', ['$scope', '$state', 'featList', 'confirm', 'feats', function($scope, $state, featList, confirm, feats) {
  $scope.featsList = featList;

  $scope.editFeat = function(index) {
    $state.go('home.featEdit', {id:$scope.featsList[index]._id});
  }

  $scope.deleteFeat = function(index) {
    $scope.success = null;
    $scope.error = null;

    // Open a confirmation modal
    var modalInstance = confirm.openModal($scope, {
      size: 'md',
      message: 'Are you sure you want to delete the feat ' + $scope.featsList[index].name + '?',
      button: 'Delete'
    });

    // Wait for the user to respond
    modalInstance.result.then(() => {
      // Go out to the database and delete the player
      feats.delete($scope.featsList[index]._id).then((result) => {
        // Remove the player from the local list and show a confirmation
        $scope.featsList.splice(index, 1);
        $scope.success = result;
      }, (error) => {
        // Show an error if there was a problem with deleting the player
        $scope.error = error.data;
      });
    });
  }
}]);

cms.controller('EditFeatCtrl', ['$scope', 'feat', 'feats', function($scope, feat, feats) {
  $scope.feat = feat;

  $scope.updateFeat = function() {
    feats.update($scope.feat).then((res) => {
      $scope.success = res;
    });
  }
}]);

cms.factory('feats', ['$http', function($http) {
  var feats = {};

  feats.getAll = function() {
    return $http.get('/moderator/feats').then((res) => {
      return res.data;
    });
  }
  feats.createFeat = function(feat) {
    return $http.post('/moderator/feat/create', feat).then((res) => {
      return res.data;
    });
  }
  feats.delete = function(id) {
    return $http.delete('/moderator/feat/delete/' + id).then((res) => {
      return res.data;
    });
  }
  feats.get = function (id) {
    return $http.get('/moderator/feat/' + id).then((res) => {
      return res.data;
    });
  }
  feats.update = function(feat) {
    return $http.put('/moderator/feat/edit/', {feat: feat}).then((res) => {
      return res.data;
    });
  }

  return feats;
}]);
