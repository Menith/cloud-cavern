var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');
var router = express.Router();

var Player = mongoose.model('Player');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// Register a new player
router.post('/register', function(req, res, next) {
  if (!req.body.username || !req.body.password || !req.body.email) {
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  var player = new Player();

  player.username = req.body.username;
  player.email = req.body.email;
  player.setPassword(req.body.password)

  player.save(function (err) {
    if (err) { return next(err); }

    return res.json({token: player.generateJWT()})
  });
});

// Attempts to login a player
router.post('/login', function(req, res, next) {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({message: 'Please fill out all fields'});
  }
  console.log('Checking credentials');
  passport.authenticate('local', function(err, player, info) {
    if (err) { return next(err); }

    if (player) {
      return res.json({token: player.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});



module.exports = router;
