var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

// Schema for the Moderators collection to be stored in MongoDB
var ModeratorSchema = new mongoose.Schema({
  username: {type: String, unique: true},
  hash: {type: String},
  salt: {type: String}
});

// Set the moderator password, hashes and salts it first
ModeratorSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');

  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
}

// Check if the current moderators password matches the given password
ModeratorSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

  return this.hash === hash;
}

// Generator a security token for this moderator
ModeratorSchema.methods.generateJWT = function() {

  // set expiration to 60 days
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 30);

  return jwt.sign({
    _id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000),
  }, 'SECRET');
};

mongoose.model('Moderator', ModeratorSchema);
