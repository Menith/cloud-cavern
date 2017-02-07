var mongoose = require('mongoose');

// Schema for the Caracter collction to be stored in MongoDB
var CharacterSchema = new mongoose.Schema({

});

mongoose.model('Character', CharacterSchema);
