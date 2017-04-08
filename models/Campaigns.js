var mongoose = require('mongoose');

// Schema for the Campaign collection to be stored in MongoDB
var CampaignSchema = new mongoose.Schema({
  name: {type: String},
  description: {type: String},
  code: {type: String, unique: true},
  private: {type: Boolean},
  dm: {type: mongoose.Schema.Types.ObjectId, ref: 'Player'},
  players: [{type: mongoose.Schema.Types.ObjectId, ref: 'Player'}],
  blacklist: [{type: mongoose.Schema.Types.ObjectId, ref: 'Player'}]
});

// Adds a player to the player list
CampaignSchema.methods.addPlayer = function(playerID, cb) {
  // Ensure that the player does exist inside the list already
  if (this.players.indexOf(playerID) === -1) {
    this.players.push(playerID);
  }
  this.save(cb);
};

// Toggles between public and private
CampaignSchema.methods.toggleOpen = function(cb) {
  this.private = !this.private;
  this.save(cb);
};

// Remove a player from the player list
CampaignSchema.methods.removePlayer = function(playerId, cb) {

  var index = this.players.indexOf(playerId);
  console.log("players: " + this.players);
  console.log("OOOOGLYBOOOOGLY" + index);
  if(index !== -1) {
    console.log("in if: " + index);
    var test = this.players.splice(index, 1);
    console.log(test);
  }
  console.log("players after: " + this.players);
  this.save(cb);
};

//Add a player to the campaign blacklist
CampaignSchema.methods.addToBlacklist = function(playerId, cb) {
  // Find the players position in the array
  var index = this.blacklist.indexOf(playerId);
  // Ensure that the player does not exist in the array
  if (index == -1) {
    this.blacklist.push(playerId);
  }
  this.save(cb);
};

//Remove a player from the campaign blacklist
CampaignSchema.methods.removeFromBlacklist = function(playerId, cb) {
  // Find the players position in the array
  var index = this.blacklist.indexOf(playerId);
  // Ensure that the player does exist in the array
  if (index != -1) {
    this.blacklist.splice(index, 1);
  }
  this.save(cb);
};

mongoose.model('Campaign', CampaignSchema);
