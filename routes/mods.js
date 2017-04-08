var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');
var router = express.Router();

var Moderator = mongoose.model('Moderator');
var Campaign = mongoose.model('Campaign');
var Player = mongoose.model('Player');
var Character = mongoose.model('Character');
var Feat = mongoose.model('Feat');

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
router.post('/login', function(req, res) {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local-moderator', function(err, moderator, info) {
    if (err) {

    }

    if (moderator) {
      return res.json({token: moderator.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res);
});

router.post('/changeModPass', function(req, res) {
  passport.authenticate('local-moderator', function(error, moderator, info) {
    if (error) {
      console.log(error);
    }
    if (moderator) {
      moderator.setPassword(req.body.newPassword);
      moderator.save(function(err) {

        if (err) {
          console.log(err);
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
      console.log(error);
    } else {
      res.json(moderators);
    }
  });
});

router.get('/campaignsWithDetails', function(req, res) {
  Campaign.find().populate('dm').exec(function(error, campaigns) {
    if (error) {
      console.log(error);
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

router.put('/update/campaign', function(req, res) {
  Campaign.findByIdAndUpdate({_id: req.body.campaign._id}, {$set: {
    name: req.body.campaign.name,
    description: req.body.campaign.description,
    dm: req.body.campaign.dm
  }}, function(error) {
    if (error) {
      console.log(error);
    }
    res.send('Updated Campaign')
  })
});

router.get('/playersWithDetails', function(req, res) {
  Player.find().populate('characters campaigns').exec(function(error, players) {
    if (error) {
      console.log(error);
    } else {
      res.json(players);
    }
  });
});

router.param('campaign', function(req, res, next, id) {
  var query = Campaign.findById(id);

  query.exec(function(error, campaign) {
    if (error) {
      return next(error);
    }
    if (!campaign) {
      return next(new Error('can\'t find campaign'));
    }

    req.campaign = campaign;
    return next();
  })
});

router.put('/delete/campaign/:campaign', function(req, res) {
  // Remove the campaign that is going to be delted from all players in the campaigns player list
  req.campaign.players.forEach(function(value) {
    Player.findById(value, function(error, player) {
      if (player) {
        player.removeCampaign(req.campaign._id);
      }
    });
  });

  // Delete the given campaign
  Campaign.findByIdAndRemove(req.campaign._id, function(error) {
    if (error) {
      console.log(error);
    } else {
      res.send('Deleted Campaign');
    }
  });
});

router.param('player', function(req, res, next, id) {
  var query = Player.findById(id);

  query.exec(function(error, player) {
    if (error) {
      return next(error);
    }
    req.player = player;
    return next();
  });
});

router.put('/delete/player/:player', function(req, res) {
  req.player.campaigns.forEach(function(value) {
    Campaign.findById(value, function(error, campaign) {
      if (campaign) {
        campaign.removePlayer(req.player._id);
      }
    });
  });

  Player.findByIdAndRemove(req.player._id, function(error) {
    if (error) {
      console.log(error);
    } else {
      res.send('Deleted Player');
    }
  });
});

router.put('/campaigns/:campaign/remove/player', function(req, res) {
  req.campaign.removePlayer(req.body.playerId, function(error) {
    if (error) {
      console.log(error);
    } else {
      res.send('Removed player from campaign');
    }
  });
});

router.put('/players/:player/remove/campaign', function(req, res) {
  req.player.removeCampaign(req.body.campaignId, function(error) {
    if (error) {
      console.log(error);
    } else {
      res.send('Removed campaign from player');
    }
  });
});

router.put('/update/player', function(req, res) {
  Player.findByIdAndUpdate({_id: req.body.player._id}, {$set: {
    username: req.body.player.username,
    email: req.body.player.email
  }}, function(error) {
    if (error) {
      console.log(error);
    } else {
      res.send('Updated player');
    }
  });
});

// Gets all of the characters
router.get('/characters', (req, res) => {
  Character.find().populate('player').exec((err, characters) => {
    if (err) {
      console.log(err);
    } else {
      res.json(characters);
    }
  });
});

// Route to create a new character
router.post('/characters/new', (req, res) => {

  // Find the player this character is going to be attached to
  Player.findById(req.body.player, (err, player) => {
    if (err) {
      // There was an error finding the player log it and return
      console.log(err);
      res.json(error);
    } else {
      // Ensure that we found a player
      if (player) {
        // create a new character
        var character = new Character();

        // Add all of the characters info
        character.player = req.body.player;
        character.name = req.body.name;
        character.race = req.body.race;
        character.class = req.body.class;
        character.level = req.body.level;

        // save the new character
        character.save((err) => {
          if (err) {
            // There was an error saving the character, log it and return
            console.log(err);
            res.json(err);
          } else {
            // Add the new saved character to the player
            player.addCharacter(character._id, (err) => {
              if (err) {
                // There was an error adding the character to the player, log it and return
                console.log(err);
                res.json(err);
              } else {
                // Everything was successfull
                res.json({message: 'Successfuly created a new character!'})
              }
            });
          }
        });
      } else {
        res.status(400).json({message: 'The given player does not exist'});
      }
    }
  });

});

router.get('/feats', (req, res) => {
  Feat.find((err, feats) => {
    if (err) {
      console.log(err);
      res.status(400).json(err);
    } else {
      res.json(feats);
    }
  });
});

router.param('feat', (req, res, next, id) => {
  Feat.findById(id, (err, feat) => {
    if (err) {
      console.log(err);
      res.status(400).json(err);
    } else {
      if (feat) {
        req.feat = feat;
        return next();
      }
      else {
        res.status(400).json({message: 'Feat was not found'});
      }
    }
  });
});
router.get('/feat/:feat', (req, res) => {
  res.json(req.feat);
});

router.put('/feat/edit', (req, res) => {
  Feat.findByIdAndUpdate({_id: req.body.feat._id}, {$set: {
    name: req.body.feat.name,
    description: req.body.feat.description
  }}, function(error) {
    if (error) {
      console.log(error);
    }
    res.json({message: 'Updated Feat'});
  });
});

router.post('/feat/create', (req, res) => {
  var feat = new Feat();

  feat.name = req.body.name;
  feat.description = req.body.description;
  feat.save((err, feat) => {
    if (err) {
      console.log(err);
      res.status(400).json(err);
    } else {
      res.json({message: 'Successfully created a new feat'});
    }
  });
});

router.delete('/feat/delete/:featID', (req, res) => {

  Feat.findByIdAndRemove(req.params.featID, (err) => {
    if (err) {
      console.log(err);
      res.status(400).json(err);
    } else {
      res.json({message: 'Successfully deleted a feat'});
    }
  });
});



module.exports = router;
