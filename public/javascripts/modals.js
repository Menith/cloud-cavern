// Controller for creating a new account.
app.controller('RegisterCtrl',
['$scope', '$state', 'auth', '$uibModalInstance',
function($scope, $state, auth, $uibModalInstance) {
  $scope.player = {};

  $scope.register = function() {
    // Check to ensure the user has entered good information
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

    auth.register($scope.player).then(() => {
      $uibModalInstance.close();
      $state.go('player');
    }, (error) => {
      $scope.error = error.data;
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.close();
  };

}]);

// Controller for logging in.
app.controller('LoginCtrl',
['$scope', '$state', 'auth', '$uibModalInstance',
function($scope, $state, auth, $uibModalInstance){
  $scope.player = {};

  $scope.logIn = function() {
    if (!$scope.player.email || !$scope.player.password) {
      $scope.error = {message: 'Please fill out all fields'};
      return;
    }
    auth.logIn($scope.player).then(() => {
      $uibModalInstance.close();
      $state.go('player');
    }, (error) => {
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
    campaigns.getFromCode($scope.code).then((res) => {

      //add the campaign to the players campaign list
      players.putCampaignInPlayer(auth.currentUserId(), res._id).then((res) => {
      }, (err) => {
        $scope.error = err.data;
      });

      //Add the player to the campaign player list
      campaigns.putPlayerInCampaign(res._id, auth.currentUserId()).then((res) => {
      }, (err) => {
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
app.controller('SelectCharacterCtrl',
['$scope', '$state', 'clickedCampaign', '$uibModalInstance', 'characterList',
function($scope, $state, clickedCampaign, $uibModalInstance, characterList) {
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
app.controller('DmClickCtrl',
['$scope', '$state', '$uibModalInstance', 'campaigns', 'clickedCampaign','playerCampaignList', 'confirm',
function($scope, $state, $uibModalInstance, campaigns, clickedCampaign, playerCampaignList, confirm) {

  $scope.joinCampaign = function() {
    // Direct the player to the campaign lobby page
    $state.go('campaignLobby', {id: clickedCampaign._id});
    // Close the modal
    $uibModalInstance.close();
  };

  // Delete button function
  $scope.dissolve = function() {
    var modalInstance = confirm.openModal($scope, {
      size: 'md',
      message: `Are you sure you want to delete the campaign ${clickedCampaign.name}`,
      button: 'Delete'
    });

    modalInstance.result.then(() => {
      // Delete the campaign
      campaigns.delete(clickedCampaign._id).then((res) => {
        // Get the index of the campaign that is to be removed
        var index = playerCampaignList.playerCampaignList.indexOf(clickedCampaign);

        //Remove the Campaign from the player list on the player htmlPage
        playerCampaignList.playerCampaignList.splice(index, 1);

        //Close the modal
        $uibModalInstance.close();
      });
    }, (err) => {
      console.log(err);
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

app.controller('CampaignBlacklist',
['$scope', 'campaigns', 'activePlayers', 'campaign', '$uibModalInstance',
  function($scope, campaigns, activePlayers, campaign, $uibModalInstance) {
    $scope.campaign = campaign;
    $scope.blacklist = $scope.campaign.blacklist;

    $scope.removeFromBlacklist = function(index) {
      //Get the player
      var player = $scope.blacklist[index];
      //Remove player from the blacklist
      campaigns.removePlayerFromBlacklist(campaign._id, player._id);
      campaign.blacklist.splice(index, 1);
      $uibModalInstance.close();
    }

    //Cancel button
    $scope.cancel = function() {
      //Close the modal
      $uibModalInstance.close();
    };

  }
]);
