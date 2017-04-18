app.controller('CampaignSessionCtrl',
['$rootScope', '$scope', 'auth', 'chatSocket', 'socketFactory', 'campaign', 'player', 'drawingSocket',
function ($rootScope, $scope, auth, chatSocket, socketFactory, campaign, player, drawingSocket) {

  $scope.campaign = campaign;
  $scope.isDM = (auth.currentUserId() == campaign.dm._id);
  $scope.activePlayers = [];

//  $scope.shapeTypes = [{shape: 'Line'}, {shape: 'Rectangle'}, {shape: 'Ellipse'}];
  $scope.shapeTypes = ['Line', 'Rectangle', 'Ellipse'];
  $scope.drawingOptions = {
    shape: $scope.shapeTypes[1],
    lineWidth: 2,
    filled: false,
    shapeColor: '#000000',
    lineColor: '#000000'
  };
  $scope.gridLock = false;
  $scope.drawingObjects = [];
  $scope.currentObject = -1;

  // Create the socket for this session
  var socket = socketFactory();

  // Initialize the socket io chat socket for the campaign
  chatSocket.initialize(socket, 'campaign-' + campaign._id, player, $scope.activePlayers, campaign._id, campaign.dm._id);

  drawingSocket.emit('join-room', `campaign-${campaign._id}`);

  $scope.$on('add-drawing-object', (event, object) => {
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

  $scope.objectSelected = function(index) {
    $scope.drawingObjects.forEach((object) => {
      object.selected = false;
    });
    if (index !== $scope.currentObject) {
      $scope.drawingObjects[index].selected = true;
      $scope.drawingOptions = $scope.drawingObjects[index].options;
      $scope.currentObject = index;
      $rootScope.$broadcast('object-selected', index);
    } else {
      $scope.currentObject = -1;
      $rootScope.$broadcast('object-selected', -1);
    }
  };

  // Add the current player (excluding the DM)
  if (!$scope.isDM) {
    chatSocket.addPlayer(player);
  }


  // Function to delete an object
  $scope.deleteObject = function(index) {

  };

}]);

app.factory('drawingSocket', ['socketFactory', function(socketFactory) {
  var socket = socketFactory();

  return socket;
}]);
