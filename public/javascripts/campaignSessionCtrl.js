app.controller('CampaignSessionCtrl', ['$scope', 'campaign', function($scope, campaign) {
  $scope.campaign = campaign;
  $scope.options = {
    shape: 'box',
    filled: false,
    lineWidth: 3,
    color: '#000'
  };

  $scope.picker = {
    red: 0,
    green: 0,
    blue: 0
  }

  // Get the color button
  var picker = $('#color')[0];

  // Convert a number to hex
  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  // Convert RGB values to hex values
  function rgbToHex(r, g, b) {
      return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  // Function for when the color is changed using one of the sliders
  $scope.colorChanged = function() {
    var color = rgbToHex($scope.picker.red, $scope.picker.green, $scope.picker.blue)
    picker.style.backgroundColor = color;
    $scope.options.color = color;
  };

  // Get the canvas object
  let canvas = angular.element(document).find('canvas');

  // Get the 2d drawing context
  var ctx = canvas[0].getContext('2d');

  reset();

  // Objects that have been drawn
  var objects = [];

  // Variable that decides if something should be drawn on mousemove
  var drawing = false;

  // The last coordinates before the current move
  var centerX;
  var centerY;

  canvas.on('mousedown', function(event) {
    centerX = event.offsetX;
    centerY = event.offsetY;

    drawing = true;
  });

  canvas.on('mousemove', function(event) {
    event.preventDefault();
    if (drawing) {
      // Get the current mouse position
      var currentX = event.offsetX;
      var currentY = event.offsetY;

      redraw(centerX, centerY, currentX, currentY);
    }
  });

  canvas.on('mouseup', function(event) {
    // Stop drawing
    drawing = false;

    // Add the object to the drawing board
    objects.push({
      startX: centerX,
      startY: centerY,
      lastX: event.offsetX,
      lastY: event.offsetY,
      options: JSON.parse(JSON.stringify($scope.options)) // Copy the object, but not its reference
    });

  });

  // canvas reset
  function reset() {
    ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);

    // Draw the vertical lines
    for (var i = 0; i < canvas[0].width; i += 15) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas[0].height);
      ctx.strokeStyle = "#c1c1c1";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw horizontal lines
    for (var i = 0; i < canvas[0].height; i += 15) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas[0].width, i);
      ctx.strokeStyle = "#c1c1c1";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
 };

  function draw(object) {
    // Begins a new object
    ctx.beginPath();

    switch (object.options.shape) {
      case 'box':
        // Get the size of the rectangle
        var sizeX = object.lastX - object.startX;
        var sizeY = object.lastY - object.startY;

        // Set the rectangles parameters
        ctx.rect(object.startX, object.startY, sizeX, sizeY);

        // Check if the rectangle needs to be filled or not
        if (object.options.filled) {
          // Set the rectangle to fill and the color
          ctx.fillStyle = object.options.color;
          ctx.fill();
        }

        break;
      case 'line':
        // Set the start of the line
        ctx.moveTo(object.startX, object.startY);
        // Set the end of the line
        ctx.lineTo(object.lastX, object.lastY);

        break;
      case 'circle':
        // Get the radius of the circle
        var sizeX = object.lastX - object.startX;
        var sizeY = object.lastY - object.startY;
        var radius = Math.sqrt(sizeX * sizeX + sizeY * sizeY);

        // Set the parameters for the circle
        ctx.arc(object.startX, object.startY, radius, 0, 2 * Math.PI);

        if (object.options.filled) {
          // Set the circle to fill and set the color
          ctx.fillStyle = object.options.color;
          ctx.fill();
        }

        break;
    }

    // Set the line width and color
    ctx.lineWidth = object.options.lineWidth;
    ctx.strokeStyle = object.options.color;

    // Draw the object
    ctx.stroke();
  };

  function redraw(startX, startY, currentX, currentY) {
    reset();
    objects.forEach((object) => {
      draw(object);
    });

    draw({
      startX: startX,
      startY: startY,
      lastX: currentX,
      lastY: currentY,
      options: JSON.parse(JSON.stringify($scope.options))
    });

  };

}]);
