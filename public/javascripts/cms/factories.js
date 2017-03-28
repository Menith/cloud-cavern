// Authentication factory, used to handle all requests regarding current user or authentication
cms.factory('auth', ['$http', '$window', function($http, $window) {
  var auth = {};

  // Adds an authentication token to the current window with the name of dungeon-moderator-token
  auth.saveToken = function (token) {
    $window.localStorage['dungeon-moderator-token'] = token;
  };

  // Gets an authentication token from the current window with the name dungeon-moderator-token
  auth.getToken = function () {
    return $window.localStorage['dungeon-moderator-token'];
  };

  // Checks if the current user has an active authentication token
  auth.isLoggedIn = function() {
    var token = auth.getToken();

    if (token) {
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.exp > Date.now() / 1000;
    } else {
      return false;
    }
  };

  // Returns the username of the current moderator
  auth.currentUser = function() {
    if (auth.isLoggedIn()) {
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));
      return payload.username;
    }
  };

  // Registers the given moderator
  auth.register = function(moderator) {
    return $http.post('/moderator/register', moderator);
  };

  // Logs the given moderator in, if they have provided corrent login credentials
  auth.logIn = function(moderator) {
    return $http.post('/moderator/login', moderator).then((res) => {
      auth.saveToken(res.data.token);
    });
  };

  // Logs the current moderator out, removing their authentication token
  auth.logOut = function() {
    $window.localStorage.removeItem('dungeon-moderator-token');
  };

  return auth;
}]);



// Moderators factory, used to handle all operations regarding moderators
cms.factory('moderators', ['$http', function($http) {
  var moderators = {};

  // Goes out to the database and finds all of the moderators
  moderators.getAll = function() {
    return $http.get('/moderator/moderators').then((res) => {
      return res.data;
    });
  };

  // Goes out to the database and deletes a moderator with the given username
  moderators.delete = function(username) {
    return $http.put('/moderator/delete/moderator/', {username: username});
  }

  return moderators;
}]);



// Campaigns factory, used to handle all operations regarding campaigns
cms.factory('campaigns', ['$http', function($http) {
  var campaigns = {};

  // Get a campaign from the given id
  campaigns.get = function(id) {
    return $http.get('/campaigns/' + id).then((res) => {
      return res.data;
    });
  };

  // Goes out to the database and gathers all of the campaigns and populates them
  // with their given dungeon master and players.
  campaigns.getAllWithDetail = function() {
    return $http.get('/moderator/campaignsWithDetails').then((res) => {
      return res.data;
    });
  };

  // Goes out to the database and deletes a player given by the id.
  campaigns.delete = function(id) {
    return $http.put('/moderator/delete/campaign/' + id);
  };

  // Goes out to the database and updates the values inside of the campaign
  campaigns.update = function(campaign) {
    return $http.put('/moderator/update/campaign', {campaign: campaign});
  };

  // Remove the given player from the given campaign
  campaigns.removePlayer = function(campaignId, playerId) {
    return $http.put('/moderator/campaigns/' + campaignId + '/remove/player', {playerId: playerId});
  };

  return campaigns;
}]);



// Characters factory, used to handle all operations regarding characters
cms.factory('characters', ['$http', function($http) {
  var characters = {};

  // Goes out to the database and create a new character with the given information
  characters.createNew = function(character) {
    return $http.post('/moderator/characters/new', character).then((res) => {
      return res.data;
    });
  };

  // Goes out to the database and gets all of the characters
  characters.getAll = function() {
    return $http.get('/moderator/characters').then((res) => {
      return res.data;
    });
  };

  // Goes out to the database and deletes the character with the given id.
  characters.delete = function(id) {
    return $http.delete('/delete/character/' + id).then((res) => {
      return res.data;
    });
  };

  return characters;
}]);



// Players factory, used to handle all operations regarding players
cms.factory('players', ['$http', function($http) {
  var players = {};

  // Get a player with the given id
  players.get = function(id) {
    return $http.get('/players/' + id).then((res) => {
      return res.data;
    })
  };

  // Goes out to the database and gets a list of players with their list of
  // campaigs and characters loaded
  players.getAllWithDetail = function() {
    return $http.get('/moderator/playersWithDetails').then((res) => {
      return res.data;
    });
  }

  // Goes out to the database and deletes the palyer by the given id
  players.delete = function(id) {
    return $http.put('/moderator/delete/player/' + id);
  };

  // Goes out to the database and updates the player
  players.update = function(player) {
    return $http.put('/moderator/update/player', {player: player});
  }

  // Remove the given campaign from the given player
  players.removeCampaign = function(playerId, campaignId) {
    return $http.put('/moderator/players/' + playerId + '/remove/campaign', {campaignId: campaignId});
  };

  return players;
}]);



// Factory to show confirmation modals
cms.factory('confirm', ['$uibModal', function($uibModal) {
  var confirm = {};

  // Open up a modal with the given scope and options, then return the result promise
  confirm.openModal = function(scope, options) {
    scope.modalInfo = options;
    var modalOptions = {
      templateUrl: '/html/confirmModal.html',
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      size: (options.size) ? options.size : 'md',
      keyboard: true,
      scope: scope
    }
    return $uibModal.open(modalOptions);
  };

  return confirm;
}]);
