// Directive for the line width object
app.directive('lineWidth', ['drawingFactory', (drawingFactory) => {
  return {
    restrict: 'A',
    link: ($scope, $element) => {
      $element.on('change', (event) => {
        // Update the drawing factory if the user is editing objects
        if (!$scope.isDrawing) {
          drawingFactory.lineWidthChanged();
        }
      });
    } // End Link
  };
}]);

// Directive for the filled option
app.directive('filled', ['drawingFactory', (drawingFactory) => {
  return {
    restrict: 'A',
    link: ($scope, $element) => {
      $element.on('change', (event) => {
        // Update the drawing factory if the user is editing objects
        if (!$scope.isDrawing) {
          drawingFactory.filledChanged();
        }
      });
    } // End link
  };
}]);

// Directive for a drawing object in a list
app.directive('drawingObject', ['drawingFactory', (drawingFactory) => {
  return {
    restrict: 'A',
    link: ($scope, $element, $attrs) => {
      $element.on('click', (event) => {
        // Update the curent active object and update the drawing factory if the
        // user is updating objects
        if (!$scope.isDrawing) {
          $('#drawingObjectList a').removeClass('active');
          $element.addClass('active');
          $scope.$apply(() => {
            drawingFactory.selectObject(Number($attrs.index));
          });
        }
      });
    } // End link
  }
}]);

// Directive for switching between drawing mode and editing mode
app.directive('drawingSwitch', () => {
  return {
    restrict: 'E',
    template: `
      <button class="btn btn-xs btn-primary" ng-click="switchDrawing()">Drawing</button>
      <button class="btn btn-xs" ng-click="switchEditing()">Editing</button>
    `
  }
});

// Directive for choosing a spacific color
app.directive('colorPicker', ['drawingFactory', (drawingFactory) => {
  return {
    restrict: 'A',
    link: ($scope, $element) => {

      // Set what should happen when the drawing factory is notified that the
      // color has been changed
      drawingFactory.colorChanged = function() {
        $element[0].style.backgroundColor = drawingFactory.getObjectColorHex();
      };
    } // End link
  };
}]);

// Directive for a slider in the color picker
app.directive('colorRange', ['drawingFactory', (drawingFactory) => {
  return {
    restrict: 'A',
    link: ($scope, $element) => {
      // Toggle for if the user is changing the slider
      var changing = false;

      // Event to tell control that the user is going to change the slider value
      $element.on('mousedown', (event) => {
        changing = true;
      });

      // Event to tell control that the user is moveing their mouse over the slider
      $element.on('mousemove', (event) => {
        // Do something if the user is changing the value
        if (changing) {
          // Update the drawing factory based on weather or not the user is drawing
          if ($scope.isDrawing) {
            drawingFactory.colorChanged();
          } else {
            drawingFactory.editingColorChanged();
          }
        }
      });

      // Event to notify control that the user is done editing the slider
      $element.on('mouseup', (event) => {
        // Let control know that the user is done editing the slider
        changing = false;
        // Update the drawing factory one last time (just in case the mouse move didn't activate)
        if ($scope.isDrawing) {
          drawingFactory.colorChanged();
        } else {
          drawingFactory.editingColorChanged();
        }
      });

    } // End link
  };
}]);

// directive for the session drawing board
app.directive('drawing', ['socketFactory', 'drawingFactory', (socketFactory, drawingFactory) => {
  return {
    restrict: 'A',
    link: ($scope, $element) => {
      var socket = socketFactory();
      socket.emit('join-room', 'campaign-' + $scope.campaign._id);

      // Get the 2d drawing context
      var ctx = $element[0].getContext('2d');

      // Clear and draw the grid
      clear();
      drawGrid(20);

      // Variable that decides if something should be drawn on mousemove
      var drawing = false;
      var moving = false;
      var scaling = '';

      var position = { // Object to tell where the cursor is, usefull for minimizing code
        north: false,
        east: false,
        south: false,
        west: false,
        centerX: false,
        centerY: false
      };
      var large = 8;
      var small = 2;

      // The coordinates of the first click
      var startX; //centerX
      var startY; //centerY

      // Check to see if the current player is the DM, so that only the DM can draw
      if ($scope.isDM) {

        // Binding to get the starting position of the mouse
        // and let control know the user is drawing or editing
        $element.on('mousedown', (event) => {
          startX = event.offsetX;
          startY = event.offsetY;

          if ($scope.isDrawing) {
            drawing = true;
          } else {
            var curObject = drawingFactory.getCurrentObject();
            if (position.centerX && position.centerY) {
              drawing = true;
              moving = true;
            } else if (position.north) {
              if (position.west) {
                scaling = 'NW';
              } else if (position.centerX) {
                scaling = 'N';
              } else if (position.east) {
                scaling = 'NE';
              }
            } else if (position.south) {
              if (position.west) {
                scaling = 'SW';
              } else if (position.centerX) {
                scaling = 'S';
              } else if (position.east) {
                scaling = 'SE';
              }
            } else if (position.east && position.centerY) {
              scaling = 'E';
            } else if (position.west && position.centerY) {
              scaling = 'W';
            }

          }
        });

        // Binding to get the current position of the mouse
        // and to redraw the current shape
        $element.on('mousemove', (event) => {
          event.preventDefault();
          position = { // Object to tell where the cursor is, usefull for minimizing code
            north: false,
            east: false,
            south: false,
            west: false,
            centerX: false,
            centerY: false
          };
          if (!$scope.isDrawing && scaling == '') {
            var curObject = drawingFactory.getCurrentObject();

            if (event.offsetX >= curObject.startX - large && event.offsetX <= curObject.startX - small) { // West Line
              position.west = true;
            }
            if (event.offsetX <= curObject.lastX + large && event.offsetX >= curObject.lastX + small) {
              position.east = true;
            }
            if (event.offsetY >= curObject.startY - large && event.offsetY <= curObject.startY - small) {
              position.north = true;
            }
            if (event.offsetY <= curObject.lastY + large && event.offsetY >= curObject.lastY + small) {
              position.south = true;
            }
            if (event.offsetX > curObject.startX - small && event.offsetX < curObject.lastX + small) {
              position.centerX = true;
            }
            if (event.offsetY > curObject.startY - small && event.offsetY < curObject.lastY + small) {
              position.centerY = true;
            }
            //console.log(position);
            $element.removeClass();
            if (position.north) {
              if (position.west) {
                $element.addClass('drawingScaleNorthWest');
              } else if (position.centerX) {
                $element.addClass('drawingScaleNorth');
              } else if (position.east) {
                $element.addClass('drawingScaleNorthEast');
              }
            } else if (position.south) {
              if (position.west) {
                $element.addClass('drawingScaleSouthWest');
              } else if (position.centerX) {
                $element.addClass('drawingScaleSouth');
              } else if (position.east) {
                $element.addClass('drawingScaleSouthEast');
              }
            } else if (position.east && position.centerY) {
              $element.addClass('drawingScaleEast');
            } else if (position.west && position.centerY) {
              $element.addClass('drawingScaleWest');
            } else if (position.centerX && position.centerY) {
              $element.addClass('drawingMoveObject');
            }
          }

          if (drawing) {
            // Get the current mouse position
            var currentX = event.offsetX;
            var currentY = event.offsetY;

            if ($scope.isDrawing) {
              // Redraw the current shape
              redraw(startX, startY, currentX, currentY);
            } else {
              // Redraw the current editing shape, but use a temporary shape
              redrawTemp(startX, startY, currentX, currentY);
            }
          } else if (scaling != '') {
            // Get the current mouse position
            var currentX = event.offsetX;
            var currentY = event.offsetY;

            redrawScale(startX, startY, currentX, currentY);
          }
        });

        // Binding to get the ending mouse position, add the object
        // to the list of drawn objects or edit the current object,
        // let the players know about the newly drawn object or
        // updated object, and let control know that the user is
        // done drawing
        $element.on('mouseup', (event) => {
          var xDiff = event.offsetX - startX;
          var yDiff = event.offsetY - startY;
          // Stop drawing
          drawing = false;
          if (xDiff != 0 || yDiff != 0) {
            if ($scope.isDrawing) {

              var object = {
                startX: (startX < event.offsetX) ? startX : event.offsetX,
                startY: (startY < event.offsetY) ? startY : event.offsetY,
                lastX: (event.offsetX > startX) ? event.offsetX : startX,
                lastY: (event.offsetY > startY) ? event.offsetY : startY,
                editing: false,
                options: angular.copy(drawingFactory.objectOptions)
              };

              // Add the object to the drawing board
              $scope.$apply(() => {
                drawingFactory.addObject(object);
              });

              socket.emit('send-object', 'campaign-' + $scope.campaign._id, object);
            } else {
              if (moving) {
                drawingFactory.moveObject(xDiff, yDiff);
                drawingFactory.redraw();
                moving = false;
              } else if (scaling != '') {
                drawingFactory.scaleObject(xDiff, yDiff, scaling);
                drawingFactory.redraw();
                scaling = '';
              }
            }
          }
        });
      } // End if

      // Clear the canvas
      function clear() {
        // Draw a rectangle the size of the canvas
        ctx.clearRect(0, 0, $element[0].width, $element[0].height);
     }

     // Draw a given object
     function draw(object) {

       // Switch between the different objects
       switch (object.options.shape) {
         case 'box':
         ctx.beginPath();
           // Get the size of the rectangle
           var sizeX = object.lastX - object.startX;
           var sizeY = object.lastY - object.startY;

           // Set the rectangles parameters
           ctx.rect(object.startX, object.startY, sizeX, sizeY);

           break;
         case 'line':
         ctx.beginPath();
           // Set the start of the line
           ctx.moveTo(object.startX, object.startY);
           // Set the end of the line
           ctx.lineTo(object.lastX, object.lastY);

           break;
         case 'circle':
           ctx.save();
           // Get the size of the rectangle the circle is in
           var xDiff = object.lastX - object.startX;
           var yDiff = object.lastY - object.startY;

           // Translate the context because scale will scale the position,
           // so we want to center the circle at 0,0
           ctx.translate(object.startX + xDiff / 2, object.startY + yDiff / 2);

           // Scale the circle to create an oval
           ctx.scale(xDiff / 2, yDiff / 2);

           // Set the parameters for the circle
           ctx.beginPath();
           ctx.arc(0, 0, 1, 0, 2 * Math.PI, false);
           ctx.restore();
           break;
       }

       // Set the line width and color
       ctx.lineWidth = object.options.lineWidth;
       ctx.strokeStyle = drawingFactory.rgbToHex(object.options.color.red, object.options.color.green, object.options.color.blue);

       if (object.options.filled && object.options.shape != 'line') {
         // Set the circle to fill and set the color
         ctx.fillStyle = drawingFactory.rgbToHex(object.options.color.red, object.options.color.green, object.options.color.blue);
         ctx.fill();
       }

       // Draw the object
       ctx.stroke();
       if (object.editing) {
         ctx.save();
         ctx.beginPath();
         // Get the size of the rectangle
         var sizeX = object.lastX - object.startX + 10;
         var sizeY = object.lastY - object.startY + 10;

         // Set the rectangles parameters
         ctx.rect(object.startX - 5, object.startY - 5, sizeX, sizeY);
         ctx.setLineDash([5, 3]);
         ctx.lineWidth = 1;
         ctx.strokeStyle = '#358fff'; // Some blue color
         ctx.stroke();
         ctx.restore();
       }
     }

     // Redraw the current drawing shape
     function redraw(startX, startY, currentX, currentY) {
       // Clear the canvas
       clear();

       // Redraw each of the drawn objects
       $scope.objects.forEach((object) => {
         draw(object);
       });

       // Draw the current drawing object
       draw({
         startX: startX,
         startY: startY,
         lastX: currentX,
         lastY: currentY,
         editing: false,
         options: angular.copy($scope.options)
       });

       // Draw the grid lines over everthing else
       drawGrid(20);
     }

     // Redraw the current editing shape using a temporary object
     function redrawTemp(startX, startY, currentX, currentY) {
       // Clear the canvas
       clear();

       // Draw each of the
       $scope.objects.forEach((object) => {
         draw(object);
       });

       // Modify the selected objects properties by the current users actions
       var object = angular.copy(drawingFactory.getCurrentObject());
       var xDiff = currentX - startX;
       var yDiff = currentY - startY;
       object.startX += xDiff;
       object.startY += yDiff;
       object.lastX += xDiff;
       object.lastY += yDiff;
       object.editing = false;
       object.options.color = {
         red: 53,
         green: 143,
         blue: 255
       };

       // Draw the temporary object
       draw(object);

       // Draw the grid over top of everthing else
       drawGrid(20);
     }

     function redrawScale(startX, startY, currentX, currentY) {
       clear();

       $scope.objects.forEach((object) => {
         draw(object);
       });

       // Modify the selected objects properties by the current users actions
       var object = angular.copy(drawingFactory.getCurrentObject());
       var xDiff = currentX - startX;
       var yDiff = currentY - startY;
       switch (scaling) {
        case 'N':
          object.startY += yDiff;
          break;
        case 'NE':
          object.lastX += xDiff;
          object.startY += yDiff;
          break;
        case 'E':
          object.lastX += xDiff;
          break;
        case 'SE':
          object.lastX += xDiff;
          object.lastY += yDiff;
          break;
        case 'S':
          object.lastY += yDiff;
          break;
        case 'SW':
          object.startX += xDiff;
          object.lastY += yDiff;
          break;
        case 'W':
          object.startX += xDiff;
          break;
        case 'NW':
          object.startX += xDiff;
          object.startY += yDiff;
          break;
       }
       object.editing = false;
       object.options.color = {
         red: 53,
         green: 143,
         blue: 255
       };

       // Draw the temporary object
       draw(object);

       // Draw the grid over top of everthing else
       drawGrid(20);

     }

     // Function to draw the grid over the canvas
     function drawGrid(interval) {
       // Draw the vertical lines
       for (var i = 0; i < $element[0].width; i += interval) {
         ctx.beginPath();
         ctx.moveTo(i, 0);
         ctx.lineTo(i, $element[0].height);
         ctx.strokeStyle = "#c1c1c1";
         ctx.lineWidth = 1;
         ctx.stroke();
       }

       // Draw horizontal lines
       for (var i = 0; i < $element[0].height; i += interval) {
         ctx.beginPath();
         ctx.moveTo(0, i);
         ctx.lineTo($element[0].width, i);
         ctx.strokeStyle = "#c1c1c1";
         ctx.lineWidth = 1;
         ctx.stroke();
       }
     }

     // Set what happens when the drawingFactory get a redraw command
     drawingFactory.redraw = function() {
       // Clear the canvas
       clear();

       // Redraw each of objects
       $scope.objects.forEach((object) => {
         draw(object);
       });

       // Draw the grid lines overtop everything else
       drawGrid(20);
     };

     // Event for what should happen when the user recieves a send-object event.
     socket.on('send-object', (data) => {
       // Add the object to the drawing factory and update the scope
       drawingFactory.addObject(data);

       // Redraw the canvas
       drawingFactory.redraw();
     });

    } // End link
  };
}]);
