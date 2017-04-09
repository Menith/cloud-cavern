// Controller for the campaign list page
cms.controller('CampaignListCtrl',
['$scope', '$state', 'campaigns', 'campaignList', 'confirm',
function($scope, $state, campaigns, campaignList, confirm) {

  $scope.campaigns = campaignList;

  $scope.deleteCampaign = function(index) {
    $scope.success = null;
    $scope.error = null;

    // Open a confirmation modal
    var modalInstance = confirm.openModal($scope, {
      size: 'md',
      message: 'Are you sure you want to delete the campaign ' + $scope.campaigns[index].name + '?',
      button: 'Delete'
    });

    // Wait for the user to respond
    modalInstance.result.then(() => {
      // Go out to the database and delete the campaign
      campaigns.delete($scope.campaigns[index]._id).then((result) => {
        // Remove the campaign from the local list and show a confirmation
        $scope.campaigns.splice(index, 1);
        $scope.success = {message: 'Successfuly delete campaign'};
      }, (error) => {
        // Show an error if there was a problem deleting the campaign
        $scope.error = error.data;
      });
    }, (err) => {});
  };

  // Forward the moderator the edit campaign page
  $scope.editCampaign = function(index) {
    $state.go('home.campaignEdit', {id: $scope.campaigns[index]._id});
  };

}]);



// Controller for the edit campaign page.
cms.controller('CampaignEditCtrl',
['$scope', '$state', 'campaigns', 'campaign', 'players', 'confirm',
function($scope, $state, campaigns, campaign, players, confirm) {

  $scope.campaign = campaign;

  // Save the current campaign
  $scope.saveCampaign = function() {
    // Go out to the database and update the campaign
    campaigns.update($scope.campaign).then((res) => {
      // Show a message if it was successfull
      $scope.success = {message: 'Successfuly updated campaign'};
    }, (error) => {
      // Show an error if there was a problem updating the campaign.
      $scope.error = error.data;
    });
  };

  // Delete the current campaign
  $scope.deleteCampaign = function() {
    $scope.success = null;
    $scope.error = null;

    // Open a confirmation modal
    var modalInstance = confirm.openModal($scope, {
      size: 'md',
      message: 'Are you sure you want to delete this campaign?',
      button: 'Delete'
    });

    // Wait for the user to respond
    modalInstance.result.then(() => {
      // Remove the campaign from the database
      campaigns.delete($scope.campaign._id).then((result) => {
        // Redirect the moderator to the campaign list
        $state.go('home.campaignList');
      }, (error) => {
        // Show an error if there was a problem deleting the campaign
        $scope.error = error.data;
      });
    });
  };

  // Removes a player from the campaign list
  $scope.removePlayer = function(index) {
    $scope.success = null;
    $scope.error = null;

    // Open a confirmation modal
    var modalInstance = confirm.openModal($scope, {
      size: 'md',
      message: 'Are you sure you want to remove the player ' + $scope.campaign.players[index].username + ' from this campaign?',
      button: 'Remove'
    });

    // Wait for the user to respond
    modalInstance.result.then(() => {
      // Remove the player from the campaigns player list
      campaigns.removePlayer($scope.campaign._id, $scope.campaign.players[index]._id).then((res) => {
        // Remove the campaign from the players campaigns list
        players.removeCampaign($scope.campaign.players[index]._id, $scope.campaign._id).then((res) => {
          // Remove the player from the local array
          $scope.campaign.players.splice(index, 1);
        }, (error) => {
          // Show an error if there was a problem removing a campaign from the player
          $scope.error = error;
        });
      }, (error) => {
        // Show an error if there was a problem removing the player from the campaign
        $scope.error = error;
      });
    });
  };

}]);
