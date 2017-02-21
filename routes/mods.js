var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');
var router = express.Router();

var Moderator = mongoose.model('Moderator');
var Campaign = mongoose.model('Campaign');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

// Get the home page for moderators
router.get('/', function(req, res, next) {
  res.render('moderator');
});

// Register a new moderator
router.post('/register', function(req, res) {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  // Construct and execute a query to find a user with the given email
  var query = Moderator.findOne({'username': req.body.username});
  query.exec(function(error, item) {
    if (error) {

    } else if (item) { // If a moderator was found, return and notify
      return res.status(400).json({message: 'Username is already in use'});
    } else { // If no moderator was found, we can create a new one
      var morderator = new Moderator();

      morderator.username = req.body.username;
      morderator.setPassword(req.body.password)

      morderator.save(function (err) {
        if (err) {
          
        }
        return res.json({message: 'success'});
      });
    }
  });
});

// Attempts to login a moderator
router.post('/login', function(req, res, next) {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local-moderator', function(err, moderator, info) {
    if (err) {
      return next(err);
    }

    if (moderator) {
      return res.json({token: moderator.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

router.post('/changeModPass', function(req, res) {
  passport.authenticate('local-moderator', function(error, moderator, info) {
    if (error) {

    }
    if (moderator) {
      moderator.setPassword(req.body.newPassword);
      moderator.save(function(err) {

        if (err) {

        }
        return res.json({message: 'success'});
      });
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

router.get('/moderators', function(req, res) {
  Moderator.find((error, moderators) => {
    if (error) {

    } else {
      res.json(moderators);
    }
  });
});

router.get('/campaignsWithDetails', function(req, res) {
  Campaign.find().populate('players dm').exec(function(error, campaigns) {
    if (error) {

    } else {
      res.json(campaigns);
    }
  });
});

router.put('/delete/moderator', function(req, res) {
  Moderator.remove({username: req.body.username}, function(error) {
    if (error) {
      console.log(error);
    }
    res.send('Deleted Moderator');
  });
});

module.exports = router;
