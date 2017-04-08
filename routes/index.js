var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');
var router = express.Router();

var Player = mongoose.model('Player');
var Moderator = mongoose.model('Moderator');
var Campaign = mongoose.model('Campaign');
var Character = mongoose.model('Character');
var Feat = mongoose.model('Feat');

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
      return res.status(400).json({message: 'Invalid email address'});
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
  req.player.populate('campaigns characters', function(error, player) {
    res.json(req.player);
  });
});

router.get('/player/name/:player', (req, res) => {
  res.json({name: req.player.username});
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

router.get('/campaigns/:campaign', function(req, res) {
  req.campaign.populate('players dm', function(error, campaign) {
    if (error) {
      console.log(err);
    }
    res.json(campaign);
  });
});

//Add the player to the campaigns player list
router.put('/addPlayerToCampaign/:campaign', function(req, res) {
  //Call addPlayer on the campaign (method defined in Models/Campaigns.js)
  req.campaign.addPlayer(req.body.player, function(err) {
    //If the addPlayer call fails report the error to the console
    if(err) {
      console.log(err);
    }
    //Confirm that the player was added to the campaigns player list
    res.send('Added Player To Campaign List');
  });
});

//Add the campaign to the players campagin list
router.put('/addCampaignToPlayer/:player', function(req, res) {
  //Cal addCampaign on the player (method defined in Models/Players.js)
  req.player.addCampaign(req.body.campaign, function(err) {
    //If the addCampaign call fails report the error to the console
    if(err) {
      console.log(err);
    }
    //Confirm that the Campaign was added to the players campaign list
    res.send('Added Campaign To Player List');
  });
});

router.param('campaignCode', function(req, res, next, code) {

  var query = Campaign.findOne({code: code}, function(error, campaign) {
    if (error) {
      return next(error);
    } else if (!campaign) {
      return next();
    } else {
      req.campaign = campaign;
      return next();
    }
  });
});

//Get a Campaign from the database based on its code
router.get('/campaignByCode/:campaignCode', function(req, res) {
  //If the campaign exists return it as a JSON object
  if (req.campaign) {
    res.json(req.campaign);
  } else {
    //If the campaign does not exist then report an error and return the message in a JSON object
    return res.status(400).json({message: 'Campaign does not exist!'});
  }
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


router.get('/publicCampaigns', function(req, res){
  Campaign.find({private : false}).populate('dm').exec(function(error, campaigns){
    if (error) {
      console.log(error)
    }
    res.json(campaigns);
  });

});

router.put('/campaign/toggleOpen', function(req, res){
  Campaign.findById(req.body.id, function(error, campaign){
    campaign.toggleOpen(function(error){
        res.send('Campagin toggled');
    });
  });
});

router.put('/delete/campaign', function(req, res){

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

router.delete('/delete/character/:id', (req, res) => {
  // Find the character by ID and remove it
  Character.findByIdAndRemove(req.params.id, (err, character) => {
    if (err) {
      console.log(err);
      res.json(err);
    } else {
      if (character) {
        // Find the player by ID
        Player.findById(character.player, (err, player) => {
          if (err) {
            console.log(err);
            res.json(err);
          } else {
            if (player) {
              // Remove the character from the player
              player.removeCharacter(character._id, (err) => {
                if (err) {
                  console.log(err);
                  res.json(err);
                } else {
                  // Successfull
                  res.json({message: 'Successfuly deleted the character and removed it from its player.'})
                }
              });
            } else {
              res.json({message: 'Could not find a player attached to the removed character'});
            }
          }
        });
      } else {
        res.json({message: 'Could not find a character to remove.'})
      }
    }
  });

});
router.post('/character/new', (req, res) => {
  Player.findById(req.body.player, (err, player) => {
    if (err) {
    // There was an error finding the player log it and return
      console.log(err);
      res.json(err);
    } else {
      // Ensure that we found a player
      if (player) {
        // create a new character
        var character = new Character();
        // Add all of the characters info
        character.player = req.body.player;
        character.name = req.body.character.name;
        character.race = req.body.character.race;
        character.class = req.body.character.class;
        character.level = req.body.character.level;
        character.proficiency = req.body.character.proficiency;
        character.initiative = req.body.character.initiative;
        character.hitPoints = req.body.character.hitPoints;
        character.hitDie = req.body.character.hitDie;
        character.armorClass = req.body.character.armorClass;
        character.speed = req.body.character.speed;
        character.stat = req.body.character.stat;
        character.statFinal = req.body.character.statFinal;
        character.statMod = req.body.character.statMod;
        character.statRMod = req.body.character.statRMod;
        character.statSave = req.body.character.statSave;
        character.acrobatics = req.body.character.acrobatics;
        character.animalHandling = req.body.character.animalHandling;
        character.arcana = req.body.character.arcana;
        character.athletics = req.body.character.athletics;
        character.deception = req.body.character.deception;
        character.history = req.body.character.history;
        character.insight = req.body.character.insight;
        character.intimidation = req.body.character.intimidation;
        character.investigation = req.body.character.investigation;
        character.medicine = req.body.character.medicine;
        character.nature = req.body.character.nature;
        character.perception = req.body.character.perception;
        character.performance = req.body.character.performance;
        character.persuasion = req.body.character.persuasion;
        character.religion = req.body.character.religion;
        character.sleightOfHand = req.body.character.sleightOfHand;
        character.stealth = req.body.character.stealth;
        character.survival = req.body.character.survival;
        character.align1 = req.body.character.align1.value;
        character.align2 = req.body.character.align2.value;
        character.traits = req.body.character.traits;
        character.bonds = req.body.character.bonds;
        character.flaws = req.body.character.flaws;
        character.ideals = req.body.character.ideals;
        character.feats = req.body.character.feats;
        character.attacksSpells = req.body.character.attacksSpells;
        character.proficiencies = req.body.character.proficiencies;
        character.languages = req.body.character.languages;
        character.equipment = req.body.character.equipment;

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
    }}
  );
});

module.exports = router;
