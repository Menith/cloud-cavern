var mongoose = require('mongoose');

// Schema for the Campaign collection to be stored in MongoDB
var CampaignSchema = new mongoose.Schema({
  name: {type: String},
  description: {type: String},
  code: {type: String, unique: true},
  private: {type: Boolean},
  dm: {type: mongoose.Schema.Types.ObjectId, ref: 'Player'},
  players: [{type: mongoose.Schema.Types.ObjectId, ref: 'Player'}]
});

CampaignSchema.methods.addPlayer = function(playerID, cb) {
  console.log("in addPlayer");

  if (this.players.indexOf(playerID) === -1) {
    this.players.push(playerID);
  }

  this.save(cb);
};

CampaignSchema.methods.removePlayer = function(playerId, cb) {
  var index = this.players.indexOf(playerId);
  if (index != -1) {
    this.players.splice(index, 1);
    this.save(cb);
  }
}

mongoose.model('Campaign', CampaignSchema);
