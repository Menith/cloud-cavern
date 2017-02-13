app.directive('chat', function(){
  return {
    restrict: 'E',
    scope: {
      messagerInfo: '='
    },
    controller: ['$scope', 'chatSocket', 'auth', function($scope, chatSocket, auth) {
      $scope.nickName = auth.currentUser();
      $scope.messageLog = 'Ready to Chat on: ' + $scope.messagerInfo.id;
      chatSocket.forward($scope.messagerInfo.id);

      function messageFormatter(date, nick, message) {
        return date.toLocaleTimeString() + ' - ' + nick + ' - ' + message + '\n';
      };

      $scope.sendMessage = function() {
        chatSocket.emit('message', $scope.messagerInfo.id, $scope.nickName, $scope.message);
        $scope.message = '';
      };

      $scope.$on('socket:' + $scope.messagerInfo.id, function(event, data) {
        if (!data.payload) {
          $log.error('invalid message', 'event', event, 'data', JSON.stringify(data));
          return;
        } else {
          $scope.$apply(function() {
            $scope.messageLog = messageFormatter(new Date(), data.source, data.payload) + $scope.messageLog;
          });
        }
      });

    }],
    templateUrl: '/html/chat.html'
  };
});
