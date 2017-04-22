app.factory('characters', ['$http', function($http) {
  var characters = {};

  // Goes out to the database and gets all of the characters for a player
  characters.getAll = function(playerID) {
    return $http.get(`/characters/all/${playerID}`).then((res) => {
      return res.data;
    });
  };

  characters.get = function(characterID) {
    return $http.get(`/characters/${characterID}`).then((res) => {
      return res.data;
    });
  };

  return characters;
}]);

app.factory('auth', ['$http', '$window', function($http, $window) {
  var auth = {};

  auth.saveToken = function (token) {
    $window.localStorage['dungeon-manager-token'] = token;
  };

  auth.getToken = function () {
    return $window.localStorage['dungeon-manager-token'];
  };

  auth.isLoggedIn = function() {
    var token = auth.getToken();

    if (token) {
      var payload = JSON.parse($window.atob(token.split('.')[1]));

      return payload.exp > Date.now() / 1000;
    } else {
      return false;
    }
  };

  auth.currentUser = function() {
    if (auth.isLoggedIn()) {
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));
      return payload.name;
    }
  };

  auth.currentUserId = function() {
    if (auth.isLoggedIn()) {
      var token = auth.getToken();
      var payload = JSON.parse($window.atob(token.split('.')[1]));
      return payload._id;
    }
  };

  auth.register = function(player) {
    return $http.post('/register', player).then((res) => {
      auth.saveToken(res.data.token);
    });
  };

  auth.logIn = function(player) {
    return $http.post('/login', player).then((res) => {
      auth.saveToken(res.data.token);
    });
  };

  auth.logOut = function() {
    $window.localStorage.removeItem('dungeon-manager-token');
  };

  return auth;
}]);

app.factory('players', ['$http', function($http) {
  var players = {};

  // Get a player based off an id
  players.get = function(playerID) {
    return $http.get(`/players/${playerID}`).then((res) => {
      return res.data;
    });
  };

  // Add a player to a campaign
  players.putCampaignInPlayer = function(player, campaign) {
    return $http.put(`/addCampaignToPlayer/${player}`, {campaign: campaign}).then((res) => {
      return res.data;
    });
  };

  // Add a campaign to a player
  players.removeCampaignFromPlayer = function(player, campaign) {
    return $http.put(`/removeCampaignFromPlayer/${player}`, {campaign: campaign}).then((res) => {
      return res.data;
    });
  };

  players.getPlayerName = function(playerID) {
    return $http.get(`/player/name/${playerID}`).then((res) => {
      return res.data;
    });
  };

  return players;
}]);

//Factory for campaigns
app.factory('campaigns', ['$http', 'socketFactory', function($http, socketFactory) {
  var campaigns = {};

  var socket = socketFactory();

  // Get all public campaigns
  campaigns.getPublic = function() {
    return $http.get('/publicCampaigns').then((res) => {
      return res.data;
    });
  };

  //Get a campaign by its ID
  campaigns.get = function(campaignID) {
    return $http.get(`/campaigns/${campaignID}`).then((res) => {
      return res.data;
    });
  };

  //Get a campaign by its code
  campaigns.getFromCode = function(code) {
    return $http.get(`/campaignByCode/${code}`).then((res) => {
      return res.data;
    });
  };

  //put a player into a campaigns player list
  campaigns.putPlayerInCampaign = function(campaignID, playerID) {
    return $http.put(`/addPlayerToCampaign/${campaignID}`, {player: playerID}).then((res) => {
      return res.data;
    });
  };

  campaigns.removePlayerFromCampaign = function(campaign, player) {
    return $http.put(`/removePlayerFromCampaign/${campaign}`, {player: player}).then((res) => {
      return res.data;
    });
  }

  //Create a campaign (put it into the database)
  campaigns.create = function(campaign) {
    return $http.post('/campaigns/new', campaign).then((res) => {
      // If the campaign was public, remove it from the public campaigns list
      if (!res.data.private) {
        socket.emit('add-public-campaign', {campaignID: res.data._id});
      }
      return res.data;
    });
  };

  //Delete a campaign
  campaigns.delete = function(campaignID) {
    return $http.delete(`/delete/campaign/${campaignID}`).then((res) => {
      // Tell the sockets that a campaign was deleted
      socket.emit('campaign-deleted', `campaign-${campaignID}`, {campaignID: campaignID});

      // If the campaign was public, remove it from the public campaigns list.
      if (!res.data.private) {
        socket.emit('remove-public-campaign', {campaignID: campaignID});
      }

      // Return the response data
      return res.data;
    });
  };

  campaigns.toggleOpen = function(campaignID, isPrivate) {
    return $http.post(`/campaign/toggleOpen/${campaignID}`, {isPrivate: isPrivate}).then((res) => {
      // Add or remove the campaign from the public campaigns list
      if (isPrivate) {
        socket.emit('remove-public-campaign', {campaignID: campaignID});
      } else {
        socket.emit('add-public-campaign', {campaignID: campaignID});
      }
      return res.data;
    });
  };

  campaigns.toggleSession = function(campaignID, isLive) {
    return $http.put(`/toggleCampaignSession/${campaignID}`, {isLive: isLive});
  };

  // Get a specific campaign
  campaigns.getPublicCampaign = function(campaignID) {
    return $http.get(`/campaigns/public/${campaignID}`).then((res) => {
      return res.data;
    });
  };

  campaigns.addPlayerToBlacklist = function(campaign, player){
    return $http.put(`/addPlayerToBlacklist/${campaign}/player/${player}`);
  };

  campaigns.removePlayerFromBlacklist = function(campaign, player){
    return $http.put(`/removePlayerFromBlacklist/${campaign}`, {player: player});
  };

  return campaigns;
}]);

//Service For the players campaign list, allows updating of the list outside the player controller
app.service('playerCampaignList', function () {
    //Make an empty object to store the players campaign list into, set in PlayerCtrl
    return {};
});

//Service For the public campaign list, allows updating of the list outside the public campaign controller
app.service('publicCampaignList', function () {
    //Make an empty object to store the public campaign list into, set in public campaign ctrl on plyrHome page
    return {openCampaigns: []};
});

app.service('confirm', ['$uibModal', function($uibModal) {
  var confirm = {};

  confirm.openModal = function($scope, options) {
    $scope.modalInfo = options;
    var modalOptions = {
      templateUrl: '/html/confirmModal.html',
      ariaLabelledBy: 'modal-title',
      ariaDescribedBy: 'modal-body',
      size: (options.size) ? options.size : 'md',
      keyboard: true,
      scope: $scope
    }
    return $uibModal.open(modalOptions);
  };

  return confirm;
}]);
