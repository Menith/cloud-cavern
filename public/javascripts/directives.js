app.directive('chat', ['chatSocket', (chatSocket) => {
  return {
    restrict: 'E',
    templateUrl: '/html/chat.html',
    link: ($scope, $element) => {

      $scope.messageLog = [];

    }
  }
}]);


app.directive('chatInput', ['chatSocket', 'auth', (chatSocket, auth) => {
  return {
    restrict: 'A',
    link: ($scope, $element) => {
      const nickName = auth.currentUser();
      $element.on('keydown', (event) => {
        if(event.keyCode == 13 && !event.shiftKey){
          chatSocket.sendMessage({nickName: nickName, message: $element[0].value });
          $element[0].value = "";
          return false;
        }
      });
    }

  }

}]);

//Directive to route the chat to an unordered list to display on screen
// has built in checking for url's
app.directive('chatOutput', ['chatSocket', (chatSocket) => {
  var urlRegex = /(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi;
  return {
    restrict: 'A',
    link:($scope, $element, $attr) =>{
      chatSocket.receiveMessage = function(messageData){
        if(urlRegex.test(messageData.message)){
          $element.append(`<li id="chatMessage">${messageData.nickName}: <a target="_blank" href="${messageData.message}">${messageData.message}</a></li>`);
        }
        else {
          $element.append(`<li id="chatMessage">${messageData.nickName}: ${messageData.message}</li>`);
        }
        //scrols down the chat when new message is added
        var divForChat = document.getElementById('chatDiv');
        divForChat.scrollTop = divForChat.scrollHeight;
      };
    }
  }
}]);

app.directive('playerList', () => {
  return {
    restrict: 'E',
    templateUrl: '/html/playerList.html'
  }
});
