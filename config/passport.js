var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var Player = mongoose.model('Player');

// Used to varify if a user logs in with the correct information.
passport.use(new LocalStrategy(
  function(username, password, done) {
    // we have to pass their email through a variable called username otherwise
    // passport does not recognize that the username is being passed and throws errors
    Player.findOne({ email: username }, function (err, player) {
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
