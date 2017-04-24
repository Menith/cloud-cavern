app.controller('CampaignSessionCtrl',
['$rootScope', '$scope', '$transition$', 'auth', 'socketFactory', 'campaign', 'player', 'drawingSocket', 'campaignSocket', 'character',
function ($rootScope, $scope, $transition$, auth, socketFactory, campaign, player, drawingSocket, campaignSocket, character) {

  $scope.campaign = campaign;
  $scope.isDM = (auth.currentUserId() == campaign.dm._id);
  $scope.canSeePlayers = !$scope.isDM;

  $scope.activePlayers = [];

  $scope.shapeTypes = ['Rectangle', 'Ellipse', 'Line'];
  $scope.drawingOptions = {
    shape: $scope.shapeTypes[0],
    lineWidth: 2,
    filled: false,
    shapeColor: '#000000',
    lineColor: '#000000'
  };
  $scope.gridLock = false;
  $scope.drawingObjects = [];
  $scope.currentObject = -1;

  if ($transition$.from.state.abstract || !$scope.isDM) {
    campaignSocket.initialize($scope.isDM);
  }

  // Add the current player (excluding the DM)
  if (!$scope.isDM) {
    campaignSocket.addPlayer(player, character);
  } else {
    campaignSocket.requestPlayers();
  }

  //console.log($transition$);

  drawingSocket.emit('join-room', `campaign-${campaign._id}`);

  $scope.$on('add-drawing-object', (event, object) => {
    drawingSocket.emit('add-drawing-object', `campaign-${campaign._id}`, object)
    $scope.drawingObjects.forEach((object) => {
      object.selected = false;
    });
    $scope.$apply(() => {
      $scope.drawingObjects.push(object);
      $scope.currentObject = $scope.drawingObjects.length - 1;
    });
  });

  $scope.$watch('drawingOptions.shape', (newVal) => {
    if ($scope.currentObject !== -1) {
      drawingSocket.emit('change-object-shape', `campaign-${campaign._id}`, {index: $scope.currentObject, shape: newVal});
    }
  });

  $scope.$watch('drawingOptions.shapeColor', (newVal) => {
    if ($scope.currentObject !== -1) {
      drawingSocket.emit('change-object-shape-color', `campaign-${campaign._id}`, {index: $scope.currentObject, color: newVal});
    }
  });

  $scope.$watch('drawingOptions.filled', (newVal) => {
    if ($scope.currentObject !== -1) {
      drawingSocket.emit('change-object-filled', `campaign-${campaign._id}`, {index: $scope.currentObject, filled: newVal});
    }
  });

  $scope.$watch('drawingOptions.lineWidth', (newVal) => {
    if ($scope.currentObject !== -1) {
      drawingSocket.emit('change-object-line-width', `campaign-${campaign._id}`, {index: $scope.currentObject, lineWidth: newVal});
    }
  });

  $scope.$watch('drawingOptions.lineColor', (newVal) => {
    if ($scope.currentObject !== -1) {
      drawingSocket.emit('change-object-line-color', `campaign-${campaign._id}`, {index: $scope.currentObject, color: newVal});
    }
  });

  drawingSocket.on('delete-drawing-object', (index) => {
    $scope.drawingObjects.splice(index, 1);
    $rootScope.$broadcast('redraw-canvas');
  });

  // Only bind these events if they player is not the DM
  if (!$scope.isDM) {
    drawingSocket.on('add-drawing-object', (object) => {
      object.selected = false;
      $scope.drawingObjects.push(object);
      $rootScope.$broadcast('redraw-canvas');
    });

    drawingSocket.on('update-drawing-object', (index, object) => {
      object.selected = false;
      $scope.drawingObjects[index] = object;
      $rootScope.$broadcast('redraw-canvas');
    });
  }

  $scope.objectSelected = function(index) {
    $scope.drawingObjects.forEach((object) => {
      object.selected = false;
    });
    if (index !== $scope.currentObject && index >= 0 && index < $scope.drawingObjects.length) {
      $scope.drawingObjects[index].selected = true;
      $scope.drawingOptions = $scope.drawingObjects[index].options;
      $scope.currentObject = index;
      $rootScope.$broadcast('object-selected', index);
    } else {
      $scope.currentObject = -1;
      $rootScope.$broadcast('object-selected', -1);
    }
  };

  $scope.$on('add-player', (event, data) => {
    if (data.player._id !== campaign.dm._id) {
      $scope.activePlayers.push(data);

      if ($scope.activePlayers.length === 1) {
        data.selected = true;
      }
    }
  });

  $scope.$on('remove-player', (event, playerID) => {
    var index = $scope.activePlayers.findIndex((data) => {
      return (playerID === data.player._id);
    });
    if (index !== -1) {
      $scope.activePlayers.splice(index, 1);
    }
  });

  // Function to delete an object
  $scope.deleteObject = function(index) {

    drawingSocket.emit('delete-drawing-object', `campaign-${campaign._id}`, index);
    $scope.drawingObjects.splice(index, 1);
    $scope.objectSelected($scope.currentObject - 1);
  };

  $scope.selectCharacter = function(index) {
    $scope.activePlayers.forEach((data) => {
      data.selected = false;
    });
    $scope.activePlayers[index].selected = true;
  };

  $scope.showCharacters = function() {
    $scope.canSeePlayers = true;
  };

  $scope.showObjects = function() {
    $scope.canSeePlayers = false;
  };

}]);

app.factory('drawingSocket', ['socketFactory', function(socketFactory) {
  var socket = socketFactory();

  return socket;
}]);
