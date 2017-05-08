// Directive for the whole chat page
app.directive('chat', [() => {
  return {
    restrict: 'E',
    templateUrl: '/html/chat.html'
  }
}]);

// Directive for chat input on the campaign lobby and session screens
app.directive('chatInput', ['$rootScope', 'auth', 'campaignSocket', ($rootScope, auth, campaignSocket) => {

  function djb2(str){
    var hash = 5381;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
    }
    return hash;
  }

  function hashStringToColor(str) {
    var hash = djb2(str);
    var r = (hash & 0xFF0000) >> 16;
    var g = (hash & 0x00FF00) >> 8;
    var b = hash & 0x0000FF;
    return "#" + ("0" + r.toString(16)).substr(-2) + ("0" + g.toString(16)).substr(-2) + ("0" + b.toString(16)).substr(-2);
  }

  return {
    restrict: 'A',
    link: ($scope, $element) => {
      // Get the users username
      const nickName = auth.currentUser();

      // On enter send the message
      $element.on('keydown', (event) => {
        if(event.keyCode == 13 && !event.shiftKey) {

          // Scrolls down the chat when new message is added
            var divForChat = document.getElementById('chatDiv');
            divForChat.scrollTop = divForChat.scrollHeight + 20;

          //check for command message then send message
          if($element[0].value.charAt(0) == "!"){

            function rollDice(rollString)
            {
              // how many dice get rolled
              var diceNumber = "";
              //how many sides the dice are
              var diceSides = "";
              //All of the dice added together
              var diceSum = 0;
              var index = 5;


              //loop for pulling out number of dice
              while(rollString.charAt(index) != "d"){
                diceNumber = diceNumber + rollString.charAt(index);
                index++;
              }
              //skiping the d in the substring
              index++;

              //loop for pulling out number of sides on each dice
              while(rollString.length != index){
                diceSides = diceSides + rollString.charAt(index);
                index++;
              }

              var outputRollString = `${nickName} rolled ${diceNumber}d${diceSides} =  (`

              //loop to randomly genderate
              for(var i = 1; i <= diceNumber; i++ ){
                var diceRoll = 0;
                diceRoll = Math.floor(Math.random() * (diceSides)) + 1;
                diceSum = diceSum + diceRoll;
                if(i == diceNumber){
                  outputRollString = outputRollString + diceRoll;
                }
                else{
                  outputRollString = outputRollString + diceRoll + " + ";
                }
              }
              return (outputRollString + ") = " + diceSum);
            }

            var socketData = {
              nickName: nickName.fontcolor(hashStringToColor(nickName)),
              message: '',
              type: ''
            };

            if ($element[0].value.substring(0,5) == "!roll") {
              socketData.message = rollDice($element[0].value);
              socketData.type = 'roll'
              campaignSocket.sendCommandMessage(socketData);
            }
            else if ($element[0].value.substring(0,5) == "!help") {
              $rootScope.$broadcast('display-help');
            }
          }
          else{
            // Send the message
            campaignSocket.sendMessage({nickName: nickName.fontcolor(hashStringToColor(nickName)), message: $element[0].value });
          }
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
              return matchingURL = "https://" + matchingURL;
            }
        }

        // Test if what the user entered was a link
        if(urlRegex.test(messageData.message)) {
          var urlMatch = messageData.message.match(urlRegex);
          urlMatch = validateText(urlMatch);
          $element.append(`<li id="chatMessage">${messageData.nickName}: <a target="_blank" href="${urlMatch}">${messageData.message}</a></li>`);
        }
         else {
          $element.append(`<li id="chatMessage">${messageData.nickName}: ${messageData.message}</li>`);
        }

      });

      $scope.$on('display-help', (event) => {
        $element.append(`<li id="chatMessage">CChelper: To roll dice type !roll "number of dice"d"number of sides of dice" example !roll5d20</li>`);
      });

      $scope.$on('receive-command-message', (event, messageData) => {
        switch (messageData.type) {
          case 'roll':
          $element.append(`<li id="chatMessage">CChelper: ${messageData.message}</li>`)

            break;
          default:

        }
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
