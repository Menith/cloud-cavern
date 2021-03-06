// Directive for the drawing board;
app.directive('drawing', ['$rootScope', '$stateParams', 'drawingSocket', ($rootScope, $stateParams, drawingSocket) => {
  return {
    restict: 'A',
    link: ($scope, $element) => {

      // Get the drawing context
      var ctx = $element[0].getContext('2d');

      // Variables to tell whether the player is drawing or editing objects
      var drawing = false;
      var editing = false;

      // Object to know where the cusor is in relation to the current object
      var position = {
        direction: '',
        center: ''
      };

      // Variables that determine how percise the user has to be to resize the object
      var large = 8; // Defines the pixels away from the base object
      var small = 2;

      // Variables for storing a starting X and starting Y
      var startX;
      var startY;

      // Draw the initial grid;
      drawGrid(20);

      // Only add these functions if the player is the DM
      if ($scope.isDM) {
        $element.on('mousedown', (event) => {
          startX = event.offsetX;
          startY = event.offsetY;

          // Override the starting position if grid lock is on.
          if ($scope.gridLock) {
            startX = Math.floor(event.offsetX / 20) * 20;
            startY = Math.floor(event.offsetY / 20) * 20;
          }

          if (position.direction !== '' || position.center === 'XY') {
            // The player is trying to edit an object, by either moving it or scaling it
            drawing = false;
            editing = true;

            // get rid of the dotted line box around the object if it is going to be edited.
            $scope.drawingObjects[$scope.currentObject].selected = false;
            redrawAll();
          } else {
            drawing = true;
            editing = false;
          }
        }); // End mousedown event

        $element.on('mousemove', (event) => {
          event.preventDefault();

        //  console.log(`scope.currentObject = ${$scope.currentObject}`);
          // If there is a current object and the user is not drawing, update the position values
          if (!drawing && $scope.currentObject !== -1 && !editing) {
            // Reset the position values
            position = {
              direction: '',
              center: ''
            };

            // Get a local copy of the current selected object
            var curObject = $scope.drawingObjects[$scope.currentObject];

            // Variables that define an imaginary box around the object,
            // used for getting the mouse position
            var sX = curObject.startX;
            var sY = curObject.startY;
            var eX = curObject.lastX;
            var eY = curObject.lastY;

            if ($scope.drawingObjects[$scope.currentObject].options.shape == 'Line') {

              if (event.offsetX > sX - 3 && event.offsetX < sX + 3 && event.offsetY > sY - 3 && event.offsetY < sY + 3) {
                // User can move the starting position of the Line
                position.direction = 'MS';
              } else if (event.offsetX > eX - 3 && event.offsetX < eX + 3 && event.offsetY > eY - 3 && event.offsetY < eY + 3) {
                // Player can move the ending position of the line
                position.direction = 'ME';
              } else {
                // Check if the user is on the line
                if (sX > eX) {
                  sX = curObject.lastX;
                  eX = curObject.startX;
                }
                if (sY > eY) {
                  sY = curObject.lastY;
                  eY = curObject.startY;
                }

                if (event.offsetX > sX && event.offsetX < eX && event.offsetY > sY && event.offsetY < eY) {
                  // User is within the square made by the Line
                  var m = (curObject.startY - curObject.lastY) / (curObject.startX - curObject.lastX);
                  var point = (m * event.offsetX - m * curObject.startX + curObject.startY)
                  if (event.offsetY < point + 3 && event.offsetY > point - 3 ) {
                    position.center = 'XY';
                  }
                }

              }

            } else {
              // Determine what area the mouse is in
              if (event.offsetY >= sY - large && event.offsetY <= sY - small) {
                position.direction = 'N';
              }
              if (event.offsetY <= eY + large && event.offsetY >= eY + small) {
                position.direction = 'S';
              }
              if (event.offsetX >= sX - large && event.offsetX <= sX - small) {
                position.direction += 'W';
              }
              if (event.offsetX <= eX + large && event.offsetX >= eX + small) {
                position.direction += 'E';
              }
              if (event.offsetX > sX - small && event.offsetX < eX + small) {
                position.center += 'X';
              }
              if (event.offsetY > sY - small && event.offsetY < eY + small) {
                position.center += 'Y';
              }
            }

            // Remove any styling from the canvas and add the appropriate
            // pointer
            $element.removeClass();
            if (position.direction.includes('N')) {
              if (position.direction.includes('W')) {
                $element.addClass('drawingScaleNorthWest');
              } else if (position.center.includes('X')) {
                $element.addClass('drawingScaleNorth');
              } else if (position.direction.includes('E')) {
                $element.addClass('drawingScaleNorthEast');
              }
            } else if (position.direction.includes('S')) {
              if (position.direction.includes('W')) {
                $element.addClass('drawingScaleSouthWest');
              } else if (position.center.includes('X')) {
                $element.addClass('drawingScaleSouth');
              } else if (position.direction.includes('E')) {
                $element.addClass('drawingScaleSouthEast');
              }
            } else if (position.center.includes('Y')) {
              if (position.direction.includes('E')) {
                $element.addClass('drawingScaleEast');
              } else if (position.direction.includes('W')) {
                $element.addClass('drawingScaleWest');
              } else if (position.center.includes('X')) {
                $element.addClass('drawingMoveObject');
              }
            }
            if (position.direction == 'MS' || position.direction == 'ME') {
              $element.addClass('drawingMoveLine');
            }
          } else if (drawing) {
            var currentX = event.offsetX;
            var currentY = event.offsetY;

            if ($scope.gridLock) {
              currentX = Math.floor(event.offsetX / 20) * 20 + 20;
              currentY = Math.floor(event.offsetY / 20) * 20 + 20;
            }

            redraw(startX, startY, currentX, currentY);
          } else if (editing) {
            var currentX = event.offsetX;
            var currentY = event.offsetY;

            var xDiff = currentX - startX;
            var yDiff = currentY - startY;

            if ($scope.gridLock) {
              deltaX = (xDiff > 0) ? Math.floor(xDiff / 20) : Math.ceil(xDiff / 20);
              deltaY = (yDiff > 0) ? Math.floor(yDiff / 20) : Math.ceil(yDiff / 20);

              if (deltaX !== 0 || deltaY !== 0) {
                redrawTemp(deltaX * 20, deltaY * 20);
                if (deltaX !== 0) {
                  startX = event.offsetX;
                }
                if (deltaY !== 0) {
                  startY = event.offsetY;
                }
              }
            } else {
              redrawTemp(xDiff, yDiff);
              startX = event.offsetX;
              startY = event.offsetY;
            }
          } // End editing else

          // If the user has enabled locking to grid,
          // highlight the grid section they are over
          // if ($scope.gridLock && !drawing && !editing) {
          //   var x = Math.floor(event.offsetX / 20);
          //   var y = Math.floor(event.offsetY / 20);
          //   if (x >= 0 && y >= 0) {
          //     redrawAll();
          //     highlightCell(x, y);
          //   }
          // }

        }); // End mousemove event

        $element.on('mouseup', (event) => {
          var xDiff = event.offsetX - startX;
          var yDiff = event.offsetY - startY;

          if (drawing) {
            drawing = false;
            if (xDiff !== 0 || yDiff !== 0) {

              var object = {
                startX: (startX < event.offsetX || $scope.drawingOptions.shape == 'Line') ? startX : event.offsetX,
                startY: (startY < event.offsetY || $scope.drawingOptions.shape == 'Line') ? startY : event.offsetY,
                lastX: (startX < event.offsetX || $scope.drawingOptions.shape == 'Line') ? event.offsetX : startX,
                lastY: (startY < event.offsetY || $scope.drawingOptions.shape == 'Line') ? event.offsetY : startY,
                options: angular.copy($scope.drawingOptions),
                selected: true,
                visible: true
              };

              if ($scope.gridLock) {
                object.lastX = Math.floor(event.offsetX / 20) * 20 + 20;
                object.lastY = Math.floor(event.offsetY / 20) * 20 + 20;
              }

              $rootScope.$broadcast('add-drawing-object', object);

              redrawAll();
            }
          } else if (editing) {
            editing = false;
            $scope.drawingObjects[$scope.currentObject].selected = true;
            drawingSocket.emit('update-drawing-object', `campaign-${$stateParams.campaignID}`, $scope.currentObject, $scope.drawingObjects[$scope.currentObject]);
            redrawAll();
          }
        }); // End mouseup event

        // End if DM
      } else {
        $element.on('mousedown', (event) => {
          startX = event.offsetX;
          startY = event.offsetY;

          if ($scope.playerToken !== null) {
            // Check to see if the user is on their token, so they can move it.
            if ($scope.playerToken.startX <= event.offsetX && $scope.playerToken.lastX >= event.offsetX) {
              if ($scope.playerToken.startY <= event.offsetY && $scope.playerToken.lastY >= event.offsetY) {
                editing = true;
              }
            }
          }
        });

        $element.on('mousemove', (event) => {
          event.preventDefault();
          if ($scope.playerToken !== null) {
            $element.removeClass();
            // Check to see if the user is on their token, so they can move it.
            if ($scope.playerToken.startX <= event.offsetX && $scope.playerToken.lastX >= event.offsetX) {
              if ($scope.playerToken.startY <= event.offsetY && $scope.playerToken.lastY >= event.offsetY) {
                $element.addClass('drawingGrab');
              }
            }
          }

          if (editing) {
            var sx = Math.floor(event.offsetX / 20) * 20;
            var sy = Math.floor(event.offsetY / 20) * 20;

            if (sx !== $scope.playerToken.startX || sy !== $scope.playerToken.startY) {
              $scope.playerToken.startX = sx;
              $scope.playerToken.startY = sy;
              $scope.playerToken.lastX = sx + 20;
              $scope.playerToken.lastY = sy + 20;
              redrawAll();
            }
          }
        });

        $element.on('mouseup', (event) => {
          var sx = Math.floor(event.offsetX / 20) * 20;
          var sy = Math.floor(event.offsetY / 20) * 20;
          if ($scope.playerToken === null) {
            // Place the token
            $scope.playerToken = {
              startX: sx,
              startY: sy,
              lastX: sx + 20,
              lastY: sy + 20,
              options: {
                shape: 'Ellipse',
                shapeColor: angular.copy($scope.tokenColor),
                filled: true,
                lineWidth: 0,
                lineColor: '#000000'
              },
              selected: false,
              visible: true
            }
          } else if (editing) {
            $scope.playerToken.startX = sx;
            $scope.playerToken.startY = sy;
            $scope.playerToken.lastX = sx + 20;
            $scope.playerToken.lastY = sy + 20;
            editing = false;
          }
          redrawAll();
        }); // End mouseup function
      } // End if player

      function clear() {
        ctx.clearRect(0, 0, $element[0].width, $element[0].height);
      }

      function highlightCell(x, y) {
        ctx.beginPath();
        ctx.rect(x * 20, y * 20, 20, 20);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
      }

      // Functin to draw a given object
      function draw(object) {

        switch (object.options.shape) {
          case 'Line':
            ctx.beginPath();
            ctx.moveTo(object.startX, object.startY);
            ctx.lineTo(object.lastX, object.lastY);
            break;
          case 'Rectangle':
            ctx.beginPath();

            // Get the size of the rectangle
            var sizeX = object.lastX - object.startX;
            var sizeY = object.lastY - object.startY;

            // Set the rectangles parameters
            ctx.rect(object.startX, object.startY, sizeX, sizeY);
            break;
          case 'Ellipse':
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
        } // End switch

        ctx.lineWidth = object.options.lineWidth;
        ctx.strokeStyle = object.options.lineColor; // Set the line color

        if (object.options.filled) {
          ctx.fillStyle = object.options.shapeColor; // Set the fill color
          ctx.fill();
        }

        ctx.stroke();
        if (object.selected) {

          if (object.options.shape == 'Line') {
            ctx.save();
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#358fff';

            ctx.rect(object.startX - 2, object.startY - 2, 3, 3);
            ctx.stroke();
            ctx.beginPath();
            ctx.rect(object.lastX - 2, object.lastY - 2, 3, 3);
            ctx.stroke();

            ctx.restore();
          } else {
            ctx.save();
            ctx.beginPath();

            var sX = object.startX;
            var sY = object.startY;
            var eX = object.lastX;
            var eY = object.lastY;

            // Get the size of the rectangle
            var sizeX = eX - sX + 12;
            var sizeY = eY - sY + 12;

            // Set the rectangles parameters
            ctx.rect(sX - 6, sY - 6, sizeX, sizeY);
            ctx.setLineDash([5, 3]);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#358fff'; // Some blue color
            ctx.stroke();
            ctx.restore();
          }

        }

      } // End draw function

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

      // Redraw the current drawing shape
      function redraw(startX, startY, currentX, currentY) {

        redrawAll();

        // Draw the current drawing object
        draw({
          startX: startX,
          startY: startY,
          lastX: currentX,
          lastY: currentY,
          options: angular.copy($scope.drawingOptions),
          selected: false,
          visible: true
        });

      } // End redraw function

      // Redraw the current editing shape using a temporary object
      function redrawTemp(xDiff, yDiff) {

        // Modify the selected objects properties by the current users actions
        var object = $scope.drawingObjects[$scope.currentObject];

        if (position.direction !== '') {
          switch (position.direction) {
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
            case 'MS':
              object.startX += xDiff;
              object.startY += yDiff;
              break;
            case 'ME':
              object.lastX += xDiff;
              object.lastY += yDiff;
              break;
          }
        } else if (position.center !== '') {
          object.startX += xDiff;
          object.startY += yDiff;
          object.lastX += xDiff;
          object.lastY += yDiff;
        }

        redrawAll();
      } // End redrawTemp

      function redrawAll() {
        // Clear the canvas
        clear();

        drawGrid(20);

        // Redraw each of the drawn objects
        $scope.drawingObjects.forEach((object) => {
          if (object.visible) {
            draw(object);
          }
        });

        if ($scope.playerToken !== null) {
          draw($scope.playerToken);
        }
      }

      $scope.$on('object-selected', (event, index) => {
        redrawAll();
      });

      $scope.$on('redraw-canvas', (event) => {
        redrawAll();
      });

      $scope.$on('token-color-change', (event, color) => {
        $scope.playerToken.options.shapeColor = color;
        redrawAll();
      });

      drawingSocket.on('change-object-shape', (data) => {
        $scope.drawingObjects[data.index].options.shape = data.shape;
        redrawAll();
      });

      drawingSocket.on('change-object-shape-color', (data) => {
        $scope.drawingObjects[data.index].options.shapeColor = data.color;
        redrawAll();
      });

      drawingSocket.on('change-object-filled', (data) => {
        $scope.drawingObjects[data.index].options.filled = data.filled;
        redrawAll();
      });

      drawingSocket.on('change-object-line-width', (data) => {
        $scope.drawingObjects[data.index].options.lineWidth = data.lineWidth;
        redrawAll();
      });

      drawingSocket.on('change-object-line-color', (data) => {
        $scope.drawingObjects[data.index].options.lineColor = data.color;
        redrawAll();
      });

    } // End link
  };
}]);

app.directive('drawingOptions', [() => {
  return {
    restict: 'E',
    templateUrl: '/html/campaignSession/drawingOptions.html'
  };
}]);

app.directive('drawingObjectList', [() => {
  return {
    restrict: 'E',
    templateUrl: '/html/campaignSession/drawingObjectList.html'
  };
}]);

// Directive for a drawing object in a list
app.directive('drawingObject', [() => {
  return {
    restrict: 'A'
  }
}]);

app.directive('characterDetails', [() => {
  return {
    restrict: 'E',
    templateUrl: '/html/campaignSession/characterDetails.html'
  };
}]);

app.directive('tokenOptions', [() => {
  return {
    restict: 'E',
    templateUrl: '/html/campaignSession/tokenOptions.html'
  };
}]);
