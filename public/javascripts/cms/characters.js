cms.controller('CharacterCreateCtrl',
['$scope', '$stateParams', 'characters',
function($scope, $stateParams, characters) {
  // Make a new empty character
  $scope.character = {
    player: $stateParams.playerID
  };

  // Function to create a new character
  $scope.create = function() {
    $scope.error = null;
    $scope.success = null;

    // Do a bunch of checking to ensure that the user is entering data
    if (!$scope.character.player) {
      $scope.error = {message: 'A character must be attached to a player'};
      return;
    }
    if (!$scope.character.name) {
      $scope.error = {message: 'Your character must have a name'};
      return;
    }
    if (!$scope.character.race) {
      $scope.error = {message: 'Your character must have a race'};
      return;
    }
    if (!$scope.character.class) {
      $scope.error = {message: 'Your character must have a class'};
      return;
    }
    if (!$scope.character.level) {
      $scope.error = {message: 'Your character must be at least level 1'};
      return;
    }

    // Create the new character
    characters.createNew($scope.character).then((resData) => {
      $scope.success = resData;
      $scope.character = {};
    }, (err) => {
      console.log(err);
      $scope.error = {message: err.data};
    });

  };

  $scope.clear = function() {
    $scope.character = {};
    $scope.error = null;
    $scope.success = null;
  };


}]);

cms.controller('CharacterListCtrl',
['$scope', 'characters', 'confirm', 'characterList',
function($scope, characters, confirm, characterList) {

  $scope.characters = characterList;

  $scope.deleteCharacter = function(index) {
    $scope.success = null;
    $scope.error = null;

    var modalInstance = confirm.openModal($scope, {
      size: 'md',
      message: `Are you sure you want to delete the character ${$scope.characters[index].name} from player ${$scope.characters[index].player.username}?`,
      button: 'Delete'
    });

    modalInstance.result.then(() => {
      characters.delete($scope.characters[index]._id).then((resData) => {
        $scope.characters.splice(index, 1);
        $scope.success = resData;
      }, (err) => {
        console.log(err);
        $scope.error = err.data;
      });
    }, (err) => {
      $scope.error = err.data;
    })
  };

}]);
