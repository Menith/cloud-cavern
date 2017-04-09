var mongoose = require('mongoose');

// Schema for the Caracter collction to be stored in MongoDB
var FeatSchema = new mongoose.Schema({
  name: {type: String},
  description: {type: String}
});

mongoose.model('Feat', FeatSchema);
