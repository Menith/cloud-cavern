var mongoose = require('mongoose');

// Schema for the Caracter collction to be stored in MongoDB
var CharacterSchema = new mongoose.Schema({

  name: {type: String},
  race: {type: String},
  class: {type: String},
  background: {type: String},
  level: {type: Number},
  proficiency: {type: Number},
  initiative: {type: Number},
  hitPoints: {type: Number},
  hitDie: {type: Number},
  armorClass: {type: Number},
  speed: {type: Number},
  stat: {type: Array},
  statFinal: {type: Array},
  statMod: {type: Array},
  statRMod: {type: Array},
  statSave: {type: Array},
  acrobatics: {type: Number},
  animalHandling: {type: Number},
  arcana: {type: Number},
  athletics: {type: Number},
  deception: {type: Number},
  history: {type: Number},
  insight: {type: Number},
  intimidation: {type: Number},
  medicine: {type: Number},
  nature: {type: Number},
  perception: {type: Number},
  performance: {type: Number},
  persuasion: {type: Number},
  religion: {type: Number},
  sleightOfHand: {type: Number},
  stealth: {type: Number},
  align1: {type: String},
  align2: {type: String},
  traits: {type: String},
  bonds: {type: String},
  flaws: {type: String},
  ideals: {type: String},
  feats: {type: String},
  attacksSpells: {type: String},
  proficiencies: {type: Array},
  languages: {type: String},
  equipment: {type: String},

  player: {type: mongoose.Schema.Types.ObjectId, ref: 'Player'},

});

mongoose.model('Character', CharacterSchema);
