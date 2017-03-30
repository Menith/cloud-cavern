app.directive('chat', ['chatSocket', (chatSocket) => {
  return {
    restrict: 'E',
    templateUrl: '/html/chat.html',
    link: ($scope, $element) => {

      $scope.messageLog = "";

      chatSocket.receiveMessage = function(messageData){
        $scope.messageLog += `${messageData.nickName}: ${messageData.message} \n`;
      };
    }
  }
}]);

app.directive('chatInput', ['chatSocket', 'auth', (chatSocket, auth) => {
  return {
    restrict: 'A',
    link: ($scope, $element) => {
      const nickName = auth.currentUser();
      $element.on('keydown', (event) => {
        //TODO add in soft enters
        // will be done with a different keycode check
        if(event.keyCode == 13){
          chatSocket.sendMessage({nickName: nickName, message: $element[0].value });
          $element[0].value = "";
          return false;
        }
      });
    }

  }

}]);


app.directive('playerList', () => {
  return {
    restrict: 'E',
    templateUrl: '/html/playerList.html'
  }
});
