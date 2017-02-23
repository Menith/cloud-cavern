var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');
var router = express.Router();

var Player = mongoose.model('Player');
var Moderator = mongoose.model('Moderator');
var Campaign = mongoose.model('Campaign');
var Character = mongoose.model('Character');

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

  // Construct and execute a query to find a user with the given email
  var query = Player.findOne({'email': req.body.email});
  query.exec(function(err, item) {
    if (err) {
      return next(err);
    } else if (item) { // If a player was found, return and notify
      return res.status(400).json({message: 'Email is already in use'});
    } else { // If no player was found, we can create a new one
      var player = new Player();

      player.username = req.body.username;
      player.email = req.body.email;
      player.setPassword(req.body.password)

      player.save(function (err) {
        if (err) {
          return next(err);
        }

        return res.json({token: player.generateJWT()})
      });
    }
  });
});

// Attempts to login a player
router.post('/login', function(req, res, next) {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local-player', function(err, player, info) {
    if (err) { return next(err); }

    if (player) {
      return res.json({token: player.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

router.param('player', function(req, res, next, id) {
  var query = Player.findById(id);

  query.exec(function(err, player) {
    if (err) {
      return next(err);
    }
    req.player = player;
    return next();
  });
});

router.get('/players/:player', function(req, res) {
  req.player.populate('campaigns', function(error, player) {
    res.json(req.player);
  });

});

router.param('campaign', function(req, res, next, id) {
  var query = Campaign.findById(id);

  query.exec(function(err, campaign) {
    if (err) {
      return next(err);
    }
    if (!campaign) {
      return next(new Error('can\'t find campaign'));
    }

    req.campaign = campaign;
    return next();
  })
});

router.get('/campaigns/:campaign', function(req, res, next) {
  req.campaign.populate('players dm', function(error, campaign) {
    if (error) {
      return next(error);
    }
    res.json(campaign);
  });
});

router.put('/addPlayerToCampaign/:campaign', function(req, res, next) {
  console.log(req.body);
  req.campaign.addPlayer(req.body.player, function(err) {
    if(err) {
      return next(err);
    }
  });
});

router.put('/addCampaignToPlayer/:player', function(req, res, next) {
  console.log(req.body);
  req.player.addCampaign(req.body.campaign, function(err) {
    if(err) {
      return next(err);
    }
  });
});

router.param('campaignCode', function(req, res, next, code) {

  var query = Campaign.findOne({code: code});

  query.exec(function(err, campaign) {
    if (err) {

    }
    if (!campaign) {
      return next(new Error('can\'t find campaign'));
    }

    req.campaign = campaign;
  })
});

router.get('/campaignByCode/:campaignCode', function(req, res) {
  res.json(req.campaign);
});

router.post('/campaigns', function(req, res, next) {
  var campaign = new Campaign(req.body);

  campaign.save(function(err, campaign) {
    if (err) {
      return next(err);
    }
    res.json(campaign);
  })
});

router.get('/campaigns', function(req, res, next) {
  Campaign.find(function(err, campaigns) {
    if (err) {
      return next(err);
    }
    res.json(campaigns);
  });
});

router.put('/delete/campaign', function(req, res){
  Campaign.findByIdAndRemove(req.body.id, function(){
    res.send('Campagin Dissolved');
  });
});

router.put('/campaign/toggleOpen', function(req, res){
  Campaign.findById(req.body.id, function(error, campaign){
    campaign.toggleOpen(function(error){
        res.send('Campagin toggled');
    });
  });
});

module.exports = router;
