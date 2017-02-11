var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var Player = mongoose.model('Player');
var Moderator = mongoose.model('Moderator');

// Used to varify if a user logs in with the correct information.
passport.use('local-player', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, function(email, password, done) {
    Player.findOne({ email: email }, function (err, player) {
      if (err) { return done(err); }
      if (!player) {
        return done(null, false, { message: 'Incorrect email.' });
      }
      if (!player.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, player);
    });
  }
));

passport.use('local-moderator', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, function(username, password, done) {
    Moderator.findOne({username: username}, function(error, moderator) {
      if (error) {
        return done(error);
      }
      if (!moderator) {
        return done(null, false, {message: 'Incorrect username.'});
      }
      if (!moderator.validPassword(password)) {
        return done(null, false, {message: 'Incorrect password.'})
      }
      return done(null, moderator);
    });
  }
));
