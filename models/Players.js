var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

//Schema for the Player collection to be stored in MongoDB
var PlayerSchema = new mongoose.Schema({
  username: {type: String},
  email: {type: String, unique: true},
  hash: {type: String},
  salt: {type: String},
  characters: [{type: mongoose.Schema.Types.ObjectId, ref: 'Character'}], // All objects inside of a collection have an ObjectID, so we do not need to make one.
  campaigns: [{type: mongoose.Schema.Types.ObjectId, ref: 'Campaign'}]
});

// Called when making a player to set their password using the salt and hash technique.
PlayerSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');

  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

// Checks if the current users password equals the password given.
PlayerSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

  return this.hash === hash;
};

// Remove a campaign from this players campaign list
PlayerSchema.methods.removeCampaign = function(campaignId, cb) {
  // Get the campaigns location in the campaign list
  var index = this.campaigns.indexOf(campaignId);
  // Ensure that the campaign exists
  if (index != -1) {
    this.campaigns.splice(index, 1);
  }
  this.save(cb);
};

// Add the given campaign to the player
PlayerSchema.methods.addCampaign = function(campaignID, cb) {

  // Ensure that the campaign does not already exist
  if (this.campaigns.indexOf(campaignID) === -1) {
    this.campaigns.push(campaignID);
  }

  this.save(cb);
};

// Add the given character to the player
PlayerSchema.methods.addCharacter = function(characterID, cb) {
  // Ensure that this character does not already exist
  if (this.characters.indexOf(characterID) === -1) {
    this.characters.push(characterID);
  }

  this.save(cb);
};

PlayerSchema.methods.removeCharacter = function(characterID, cb) {
  var index = this.characters.indexOf(characterID);
  // Ensure that this character does exist inside this players characters list
  if (index !== -1) {
    this.characters.splice(index, 1);
  }

  this.save(cb);
}

// Generate a security token for the player.
PlayerSchema.methods.generateJWT = function() {

  // set expiration to 60 days
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 30);

  return jwt.sign({
    _id: this._id,
    email: this.email,
    name: this.username,
    exp: parseInt(exp.getTime() / 1000),
  }, 'SECRET');
};

mongoose.model('Player', PlayerSchema);
