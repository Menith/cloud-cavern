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

mongoose.model('Campaign', CampaignSchema);
