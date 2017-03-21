
cms.controller('NewModCtrl', ['$scope', 'auth', function($scope, auth) {
  $scope.newMod = {};

  // Create a new moderator
  $scope.register = function() {
    // Clear any alerts on the screen
    $scope.error = null;
    $scope.success = null;

    // Ensure that the user has input favorable text
    if ($scope.newMod.password != $scope.confirmPassword) {
      $scope.error = {message: "Passwords do not match"};
      return;
    } else if (!$scope.newMod.password) {
      $scope.error = {message: "You must use a password"};
      return;
    } else if ($scope.newMod.password.length < 6) {
      $scope.error = {message: "Passwords must be six or more characters"};
      return;
    }

    // Call to actually create a new moderator
    auth.register($scope.newMod).then((result) => {
      // Moderator was successfuly created
      $scope.success = {message: 'New Moderator Created!'};
      $scope.newMod.username = '';
      $scope.newMod.password = '';
      $scope.confirmPassword = '';
    }, function(error) {
      // There was an error creating a moderator
      $scope.error = error.data;
    });
  };

}]);

// Moderator list controller
cms.controller('ModeratorListCtrl',
['$scope', 'confirm', 'moderators', 'moderatorList',
function($scope, confirm, moderators, moderatorList) {
  $scope.mods = moderatorList;

  $scope.deleteModerator = function(name) {
    // Clear any alerts on the screen
    $scope.error = null;
    $scope.success = null;

    // Open a confirmation modal
    var modalInstance = confirm.openModal($scope, {
      size: 'md',
      message: 'Are you sure you want to delete the moderator ' + name + '?',
      button: 'Delete'
    });

    // Wait for the user to respond
    modalInstance.result.then(() => {
      // Delete the selected moderator
      moderators.delete(name).then((result) => {
        // Find the moderator that was deleted in local array
        var modIndex = -1;
        $scope.mods.forEach((value, index) => {
          if (value.username == name) {
            modIndex = index;
          }
        });
        // If the moderator that was delete is in the local array, delete it
        if (modIndex != -1) {
          $scope.mods.splice(modIndex, 1);
        }
        $scope.success = {message: 'Successfuly deleted moderator'};
      }, (error) => {
        // There was an error deleting the moderator
        $scope.error = error.data;
      });
    });
  };

  $scope.changeModeratorUsername = function(id) {
    //TODO: Implement this funtion
  };

}]);

// Moderator settings controller
cms.controller('ModSettingsCtrl', ['$scope', 'auth', '$uibModal', function($scope, auth, $uibModal) {

  // Open up a modal to change the current users password
  // see ModNewPassCtrl for more information
  $scope.showChangePasswordModal = function() {
    $uibModal.open({
      templateUrl: '/html/cms/modNewPass.html',
      controller: 'ModNewPassCtrl',
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      keyboard: true
    });
  };

}]);

// Moderator new password modal controller
cms.controller('ModNewPassCtrl', ['$scope', '$uibModalInstance', '$http', 'auth', function($scope, $uibModalInstance, $http, auth) {

  // Closes the new password modal
  $scope.cancel = function() {
    $uibModalInstance.close();
  };

  // changes the current moderators password
  $scope.changePassword = function() {
    // Remove all alerts
    $scope.error = null;

    // Check to ensure that the two passwords match
    if ($scope.newPassword !== $scope.newPasswordConfirm) {
      $scope.error = {message: 'Passwords do not match.'};
      return;
    } else {
      // build our request body with the current moderators username, their current password, and the new password
      var body = {
        username: auth.currentUser(),
        password: $scope.currentPassword,
        newPassword: $scope.newPassword
      };
      // Send the information off to the router
      $http.post('/moderator/changeModPass', body).then((result) => {
        // Close the modal if the password change went through
        $uibModalInstance.close();
      }, (error) => {
        // Show an error message if the password change was rejected
        $scope.error = error.data;
      });
    }
  };

}]);
