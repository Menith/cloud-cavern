app.factory('chatSocket', ['socketFactory', function(socketFactory) {
  var socket = socketFactory();
  socket.forward('broadcast');
  return socket;
}]);

app.controller('SocketCtrl', ['$log', '$scope', 'chatSocket', 'auth', function($log, $scope, chatSocket, auth) {
  $scope.nickName = auth.currentUser();
  $scope.messageLog = 'Ready to Chat';

  function messageFormatter(date, nick, message) {
    return date.toLocaleTimeString() + ' - ' + nick + ' - ' + message + '\n';
  }

  $scope.sendMessage = function() {
    chatSocket.emit('message', 'broadcast', $scope.nickName, $scope.message);
    $scope.message = '';
  };

  $scope.$on('socket:broadcast', function(event, data) {
    if (!data.payload) {
      $log.error('invalid message', 'event', event, 'data', JSON.stringify(data));
      return;
    } else {
      $scope.$apply(function() {
        $scope.messageLog = messageFormatter(new Date(), data.source, data.payload) + $scope.messageLog;
      });
    }
  });
}]);
