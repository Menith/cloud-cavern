// Directive for the whole chat page
app.directive('chat', [() => {
  return {
    restrict: 'E',
    templateUrl: '/html/chat.html'
  }
}]);

// Directive for chat input on the campaign lobby and session screens
app.directive('chatInput', ['auth', 'campaignSocket', (auth, campaignSocket) => {
  return {
    restrict: 'A',
    link: ($scope, $element) => {
      // Get the users username
      const nickName = auth.currentUser();

      // On enter send the message
      $element.on('keydown', (event) => {
        if(event.keyCode == 13 && !event.shiftKey) {
          // Send the message
          campaignSocket.sendMessage({nickName: nickName, message: $element[0].value });
          // Reset the unput text
          $element[0].value = "";
          // Prevent default
          return false;
        }
      });
    }

  }

}]);

// Directive to route the chat to an unordered list to display on screen
// has built in checking for url's
app.directive('chatOutput', [() => {
  var urlRegex = /(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi;
  return {
    restrict: 'A',
    link:($scope, $element) => {
      // Override the chackSockets receiveMessage function
        $scope.$on('receive-message', (event, messageData) => {

        function validateText(matchingURL)
        {
          var tarea_regex = /(http(s?))\:\/\//gi;
          if(tarea_regex.test(matchingURL)) {
            return matchingURL;
            }
            else{
              return matchingURL = "http://" + matchingURL;
            }
        }

        // Test if what the user entered was a link
        if(urlRegex.test(messageData.message)) {
          var urlMatch = messageData.message.match(urlRegex);
          urlMatch = validateText(urlMatch);
          console.log(urlMatch);
          $element.append(`<li id="chatMessage">${messageData.nickName}: <a target="_blank" href="${urlMatch}">${messageData.message}</a></li>`);
        } else {
          $element.append(`<li id="chatMessage">${messageData.nickName}: ${messageData.message}</li>`);
        }

        // Scrols down the chat when new message is added
        var divForChat = document.getElementById('chatDiv');
        divForChat.scrollTop = divForChat.scrollHeight;
      });
    }
  }
}]);

// Directive for the player list in the lobby and session screens
app.directive('playerList', () => {
  return {
    restrict: 'E',
    templateUrl: '/html/playerList.html'
  }
});
