app.factory('chatSocket', ['socketFactory', function(socketFactory) {
  var socket = socketFactory();

  return socket;
}]);
