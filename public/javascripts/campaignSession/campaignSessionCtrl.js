app.controller('CampaignSessionCtrl',
['$scope', 'auth', 'chatSocket', 'socketFactory', 'drawingFactory', 'campaign', 'player',
function ($scope, auth, chatSocket, socketFactory, drawingFactory, campaign, player) {

  $scope.campaign = campaign;
  $scope.isDM = (auth.currentUserId() == campaign.dm._id);
  $scope.activePlayers = [];
  $scope.isDrawing = true;

  // Options for the current shape
  $scope.options = drawingFactory.objectOptions;

  // List of the drawn objects
  $scope.objects = drawingFactory.objects;

  // Create the socket for this session
  var socket = socketFactory();

  // Initialize the socket io chat socket for the campaign
  chatSocket.initialize(socket, 'campaign-' + campaign._id, player, $scope.activePlayers, campaign._id, campaign.dm._id);

  // Add the current player (excluding the DM)
  if (!$scope.isDM) {
    chatSocket.addPlayer(player);
  }

  // Switch to drawing mode
  $scope.switchDrawing = function() {
    if (!$scope.isDrawing) {
      $('drawing-switch button:last').removeClass('btn-primary');
      $('drawing-switch button:first').addClass('btn-primary');
      $('#drawingObjectList a').removeClass('active');
      $scope.isDrawing = true;
      drawingFactory.drawingMode();
      drawingFactory.colorChanged();
    }
  };

  // Switch to editing mode
  $scope.switchEditing = function() {
    if ($scope.isDrawing) {
      $('drawing-switch button:first').removeClass('btn-primary');
      $('drawing-switch button:last').addClass('btn-primary');
      $('#drawingObjectList a:first').addClass('active');
      $scope.isDrawing = false;
      drawingFactory.selectObject(0);
    }
  };

  // Function to delete an object
  $scope.deleteObject = function(index) {
    // Delete the object from the drawing factory
    drawingFactory.deleteObject(index);

    // If the object deleted was the current object then set
    // the active object to the first object in the list
    if (index == drawingFactory.currentObject) {
      $('#drawingObjectList a:first').addClass('active');
      drawingFactory.selectObject(0);
    }

    // Update the canvas
    drawingFactory.redraw();
  };

  // Set what happens when the scope gets a redraw event
  $scope.redraw = function() {
    drawingFactory.redraw();
  };

}]);
