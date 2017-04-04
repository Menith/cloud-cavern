// Factory for drawing
app.factory('drawingFactory', function() {
  drawingFactory = {};

  // Objects drawn to the screen
  drawingFactory.objects = [];

  // Default object options
  drawingFactory.objectOptions = {
    shape: 'box',
    filled: false,
    lineWidth: 3,
    color: {
      red: 0,
      green: 0,
      blue: 0
    }
  };

  // The current object that the user is editing.
  drawingFactory.currentObject = null;

  // Convert a number to hex
  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  // Convert RGB values to hex values
  drawingFactory.rgbToHex = function(r, g, b) {
      return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  };

  // Converts the given hex to rgb
  drawingFactory.hexToRgb = function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        red: parseInt(result[1], 16),
        green: parseInt(result[2], 16),
        blue: parseInt(result[3], 16)
    } : null;
  };

  // Returns the current objects color options in HEX form
  drawingFactory.getObjectColorHex = function() {
    return this.rgbToHex(this.objectOptions.color.red, this.objectOptions.color.green, this.objectOptions.color.blue);
  };

  // This function will get overriden with what should happen when a color is changed.
  drawingFactory.colorChanged = function() {
    console.log(`Color Changed to ${this.getObjectColorHex()}`);
  };

  // Sets the color in the options to the given value
  drawingFactory.changeColor = function(color, value) {
    this.objectOptions.color[color] = value;
    this.colorChanged();
  };

  // This function will get overriden with what should happen on a redraw
  drawingFactory.redraw = function() {
    // Redraw the canvas
  };

  // Delete the object at the given index
  drawingFactory.deleteObject = function(index) {
    this.objects.splice(index, 1);
  };

  // Adds the given object to the objects list
  drawingFactory.addObject = function(object) {
    this.objects.push(object);
  };

  // Selects the given object, and sets the color also
  drawingFactory.selectObject = function(index) {
    this.currentObject = index;
    angular.copy(this.objects[index].options, this.objectOptions);
    this.colorChanged();
  };

  // Let the drawing factory know that the line width changed
  drawingFactory.lineWidthChanged = function() {
    this.objects[this.currentObject].options.lineWidth = this.objectOptions.lineWidth;
    drawingFactory.redraw();
  };

  // Let the drawing factory know that the filled option changed
  drawingFactory.filledChanged = function() {
    this.objects[this.currentObject].options.filled = this.objectOptions.filled;
    drawingFactory.redraw();
  };

  // Let the drawing factory know that the color changed while the user is editing the current object
  drawingFactory.editingColorChanged = function() {
    drawingFactory.colorChanged();
    this.objects[this.currentObject].options.color = this.objectOptions.color;
    drawingFactory.redraw();
  };

  // Move the current editing object by x,y
  drawingFactory.moveObject = function(xDiff, yDiff) {
    this.objects[this.currentObject].startX += xDiff;
    this.objects[this.currentObject].startY += yDiff;
    this.objects[this.currentObject].lastX += xDiff;
    this.objects[this.currentObject].lastY += yDiff;
  };

  // Get the javascript object of the current drawingObject
  drawingFactory.getCurrentObject = function() {
    return this.objects[this.currentObject];
  };

  // sets the drawing factory to drawing mode
  drawingFactory.drawingMode = function() {
    angular.copy({
      shape: 'box',
      filled: false,
      lineWidth: 3,
      color: {
        red: 0,
        green: 0,
        blue: 0
      }
    }, this.objectOptions);
    this.currentObject = null;
  }

  return drawingFactory;
});
