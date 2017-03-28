var mongoose = require('mongoose');

// Schema for the Caracter collction to be stored in MongoDB
var CharacterSchema = new mongoose.Schema({
  player: {type: mongoose.Schema.Types.ObjectId, ref: 'Player'},
  name: {type: String},
  race: {type: String},
  class: {type: String},
  level: {type: Number}
});

mongoose.model('Character', CharacterSchema);
