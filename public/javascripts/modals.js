// Controller for creating a new account.
app.controller('RegisterCtrl', ['$scope', '$state', 'auth', '$uibModalInstance', function($scope, $state, auth, $uibModalInstance) {
  $scope.player = {};

  $scope.register = function() {
    if (!$scope.player.username) {
      $scope.error = {message: 'You must provide a username'};
      return;
    } else if ($scope.player.password != $scope.confirmPassword) {
      $scope.error = {message: "Passwords do not match"};
      return;
    } else if (!$scope.player.password) {
      $scope.error = {message: "You must use a password"};
      return;
    } else if ($scope.player.password.length < 6) {
      $scope.error = {message: "Passwords must be six or more characters"};
      return;
    }

    auth.register($scope.player).then(function() {
      $uibModalInstance.close();
      $state.go('player');
    }, function(error) {
      $scope.error = error.data;
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.close();
  };

}]);

// Controller for logging in.
app.controller('LoginCtrl', ['$scope', '$state', 'auth', '$uibModalInstance', function($scope, $state, auth, $uibModalInstance){
  $scope.player = {};

  $scope.logIn = function() {
    if (!$scope.player.email || !$scope.player.password) {
      $scope.error = {message: 'Please fill out all fields'};
      return;
    }
    auth.logIn($scope.player).then(function() {
      $uibModalInstance.close();
      $state.go('player');
    }, function(error) {
      $scope.error = error.data;
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.close();
  };
}]);

//Create Campaign Controller
app.controller('CreateCampaignCtrl',
['$scope', 'auth', 'campaigns', 'players', '$state', '$uibModalInstance',
function($scope, auth, campaigns, players, $state, $uibModalInstance) {

  //make a campaign variable
  $scope.campaign = {};

  //By default have the campaign be open (not private)
  $scope.campaign.private = false;

  //Function for creating the campaign (Linked to create campaign button in the html)
  $scope.createCampaign = function() {

    //Make sure that the campaign has a name
    if (!$scope.campaign.name) {
      //Return an error message to the user stating that the campaign needs a name
      $scope.error = {message: 'Campaigns need to have a name!'};
      return;
    }

    //Create Campaign Code
    //Array of all charcters that can be used in a campaign code
    var chars = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    //get the date to use to generate the campaign code
    var date = new Date();

    //Take each component of the date and store the character equivalent into each var
    var year = chars[date.getYear() % 60];
    var month = chars[date.getMonth()];
    var day = chars[date.getDate()];
    var hour = chars[date.getHours()];
    var minutes = chars[date.getMinutes()];
    var seconds = chars[date.getSeconds()];
    var miliseconds2 = chars[Math.trunc(date.getMilliseconds() / 60)];
    var miliseconds1 = chars[date.getMilliseconds() % 60];

    //Concat all of the characters together and assign it to code
    $scope.campaign.code = year + month + day + hour + minutes + seconds + miliseconds2 + miliseconds1;

    //Assign the dm of the campaign to the current user
    $scope.campaign.dm = auth.currentUserId();

    //Assign the player list
    $scope.campaign.players = [];

    //Create db entry
    campaigns.create($scope.campaign).then((res) => {

      //Switch the state to campaignlobby
      $state.go('campaignLobby', {id: res._id});

      //Close the modal
      $uibModalInstance.close();
    }, (err) => {
      $scope.error = err.data;
    });
  };

  //Cancel the create Campaign process
  $scope.cancel = function() {
    //Closes the create campaign modal
    $uibModalInstance.close();
  };

}]);

//Join Campaign Modal
app.controller('JoinCampaignCodeCtrl', ['$scope', 'auth', 'campaigns', 'players', '$state', '$uibModalInstance', function($scope, auth, campaigns, players, $state, $uibModalInstance){
  //Var to store the campaign code
  $scope.code;

  //Join Campaign function (linked to join campaign button in html)
  $scope.joinCampaign = function() {
    campaigns.getFromCode($scope.code).then(function(res) {

      //add the campaign to the players campaign list
      players.putCampaignInPlayer(auth.currentUserId(), res._id).then(function(res){
      }, function(err) {
        $scope.error = err.data;
      });

      //Add the player to the campaign player list
      campaigns.putPlayerInCampaign(res._id, auth.currentUserId()).then(function(res){
      }, function(err) {
        $scope.error = err.data;
      });

      //direct the player to the campaign lobby page
      $state.go('campaignLobby', {id: res._id});

      //Close the modal
      $uibModalInstance.close();

    }, function(err){
      $scope.error = err.data;
    });
  };

  //Cancel the Join campaign process (linked to the cancel button in the html)
  $scope.cancel = function() {
    //Close the join campaign modal
    $uibModalInstance.close();
  };

}]);


//Select Character Modal
app.controller('SelectCharacterCtrl', ['$scope', '$state', 'players', 'campaigns', 'clickedCampaign', 'playerCampaignList', '$uibModalInstance', 'characters', 'characterList',
 function($scope, $state, players, campaigns, clickedCampaign, playerCampaignList, $uibModalInstance, characters, characterList) {
   $scope.characters = characterList;

   $scope.joinLobby = function() {
     //direct the player to the campaign lobby page
     $state.go('campaignLobby', {id: clickedCampaign._id});
     $uibModalInstance.close();
  };
  $scope.charCancel = function() {
    $uibModalInstance.close();
   };

}]);

// Controller for Dungeon Manager Clicking own campaign
app.controller('DmClickCtrl', ['$scope', '$state', 'players', 'auth', 'campaigns', 'clickedCampaign','playerCampaignList', '$uibModalInstance',
function($scope, $state, players, auth, campaigns, clickedCampaign, playerCampaignList, $uibModalInstance) {

  $scope.joinCampaign = function() {
    //direct the player to the campaign lobby page
    $state.go('campaignLobby', {id: clickedCampaign._id});
    //Close the modal
    $uibModalInstance.close();
  };

  //remove campaign from all player campaign lists
  $scope.dissolve = function() {
    //Fully delete the campaign from the players campaignList
    campaigns.delete(clickedCampaign._id)
    //Once the campaign has been deleted
    .then((res) => {
      // Get the index of the campaign that is to be removed
      var index = playerCampaignList.playerCampaignList.indexOf(clickedCampaign);

      //Remove the Campaign from the player list on the player htmlPage
      playerCampaignList.playerCampaignList.splice(index, 1);

      //Close the modal
      $uibModalInstance.close();
    });
  };

  //Cancel button
  $scope.cancel = function() {
    //Close the modal
    $uibModalInstance.close();
  };
}]);

//Create Character Modal
app.controller('CreateCharCtrl', ['$scope', '$state', '$uibModalInstance',
function($scope, $state, $uibModalInstance) {
  $scope.gotoAdvanced = function() {
    console.info('hebscep');
    $uibModalInstance.close();
    $state.go('newCharacter');
  }
  $scope.gotoTutorial = function() {
    $uibModalInstance.close();
  }
  $scope.cancel = function() {
    $uibModalInstance.close();
  }
}]);

app.controller('CampaignBlacklist', ['$scope', '$state', 'players', 'campaigns', 'activePlayers', 'campaign', '$uibModalInstance',
  function($scope, $state, players, campaigns, activePlayers, campaign, $uibModalInstance) {
    $scope.campaign = campaign;
    $scope.blacklist = $scope.campaign.blacklist;

    $scope.removeFromBlacklist = function(index) {
      //Get the player
      var player = $scope.blacklist[index];
      console.log(player);
      //Remove player from the blacklist
      campaigns.removePlayerFromBlacklist(campaign._id, player._id);
    }


    //Cancel button
    $scope.cancel = function() {
      //Close the modal
      $uibModalInstance.close();
    };

  }
]);
