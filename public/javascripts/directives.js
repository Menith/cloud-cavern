app.directive('chat', function(){
  return {
    restrict: 'E',
    scope: {
      messagerInfo: '='
    },
    controller: ['$scope', 'chatSocket', 'auth', function($scope, chatSocket, auth) {
      $scope.nickName = auth.currentUser();
      $scope.messageLog = '';
      chatSocket.emit('join-room', 'campaign-' + $scope.messagerInfo.id);

      function messageFormatter(date, nick, message) {
        return date.toLocaleTimeString() + ' - ' + nick + ' - ' + message + '\n';
      };

      $scope.sendMessage = function() {
        chatSocket.emit('message','campaign-' + $scope.messagerInfo.id, {source: $scope.nickName, payload: $scope.message});
        $scope.message = '';
      };

      chatSocket.on('message', (data) => {
        if (!data.payload) {
          console.log('Error in message');
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

app.directive('playerList', () => {
  return {
    restrict: 'E',
    templateUrl: '/html/playerList.html'
  }
});
