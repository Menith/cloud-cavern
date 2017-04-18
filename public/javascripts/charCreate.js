app.factory('CharFactory', [
  '$http',
  function($http) {
    var characters = {};
    characters.createNew = function(playerID, character) {
      return $http.post('/character/new', {character: character, player: playerID}).then((res) => {
        return res.data;
      });
    };
    return characters;
  }
]);
app.controller('CharCtrl',[

  '$scope', 'CharFactory', 'auth',
  function($scope, CharFactory, auth) {

    $scope.player = {
      name: '',
      race: '',
      class: '',
      background: '',
      level: 1,
      proficiency: 2,
      initiative: 0,
      hitPoints: 0,
      hitDie: 0,
      armorClass: 0,
      speed: 0,
      stat: [0, 0, 0, 0, 0, 0],
      statFinal: [0, 0, 0, 0, 0, 0],
      statMod: [0, 0, 0, 0, 0, 0],
      statRMod: [0, 0, 0, 0, 0, 0],
      statSave: [0, 0, 0, 0, 0, 0],
      acrobatics: 0,
      animalHandling: 0,
      arcana: 0,
      athletics: 0,
      deception: 0,
      history: 0,
      insight: 0,
      intimidation: 0,
      investigation: 0,
      medicine: 0,
      nature: 0,
      perception: 0,
      performance: 0,
      persuasion: 0,
      religion: 0,
      sleightOfHand: 0,
      stealth: 0,
      survival: 0,
      align1: '',
      align2: '',
      traits: '',
      bonds: '',
      flaws: '',
      ideals: '',
      feats: '',
      attacksSpells: '',
      proficiencies: [],
      languages: '',
      equipment: ''

    };
    //name, race, class, background,

    var baseRMod = [0, 0, 0, 0, 0, 0]; //starting racial mods, used for humans and half elfs
    var previousRMod = [0, 0, 0, 0, 0, 0]; //racial mods before increase, used for humans and half elfs

    var increaseS = 0; //maximum times a player can select skills
    var increaseR = 0; //maximum times a player can increase racial modifier
    var rAdd = 0; //variable used to track times the user has increased racial modifiers

    var raceFinish = false;
    var skillFinish = false;

    //dice selector
    $scope.dice = [{
      value: '3d6',
      label: '3d6'}, {
      value: '4d6',
      label: '4d6 Drop'
    }];

    //race selector
    $scope.races = [
      {value: 'choose', label: 'Choose'},
      {value: 'dragonborn', label: 'Dragonborn'},
      {value: 'dwarf', label: 'Dwarf'},
      {value: 'elf', label: 'Elf'},
      {value: 'gnome', label: 'Gnome'},
      {value: 'half-elf', label: 'Half-Elf'},
      {value: 'half-orc', label: 'Half-Orc'},
      {value: 'halfling', label: 'Halfling'},
      {value: 'human', label: 'Human'},
      {value: 'tiefling', label: 'Tiefling'}
    ];

    //class selector
    $scope.classes = [
      {value: 'choose', label: 'Choose'},
      {value: 'barbarian', label: 'Barbarian'},
      {value: 'bard', label: 'Bard'},
      {value: 'cleric', label: 'Cleric'},
      {value: 'druid', label: 'Druid'},
      {value: 'fighter', label: 'Fighter'},
      {value: 'monk', label: 'Monk'},
      {value: 'paladin', label: 'Paladin'},
      {value: 'ranger', label: 'Ranger'},
      {value: 'rogue', label: 'Rogue'},
      {value: 'sorcerer', label: 'Sorcerer'},
      {value: 'warlock', label: 'Warlock'},
      {value: 'wizard', label: 'Wizard'}
    ];

    //alignment selector 1
    $scope.aligns1 = [
      {value: 'choose', label: 'Choose'},
      {value: 'chaotic', label: 'Chaotic'},
      {value: 'neutral', label: 'Neutral'},
      {value: 'lawful', label: 'Lawful'}
    ];

    //alignment selector 2
    $scope.aligns2 = [
      {value: 'choose', label: 'Choose'},
      {value: 'evil', label: 'Evil'},
      {value: 'neutral', label: 'Neutral'},
      {value: 'good', label: 'Good'}
    ];
    $scope.proficiencyList = '';
    $scope.languageList = '';

    //function called when save button is clicked
    $scope.saveCharacter = function() {
      console.info($scope.player.name + ' ' + $scope.charForm.$valid);
      if($scope.charForm.$valid && raceFinish && skillFinish)
        CharFactory.createNew(auth.currentUserId(), $scope.player);
      else
        alert('It seems like you have not filled out the whole page, make sure to fill out all required fields, select skills, and adjust racial modifiers if needed');
    };

    //function that will be used for attack and spell modal
    $scope.attackSpellModal = function() {
      console.info('attack');
    };

    //function used to roll player's stats
    $scope.rollStats = function() {
      if($scope.diceList.value === '3d6') {
        for(var i = 0; i < 6; i++) {
          $scope.player.stat[i] = Math.floor((Math.random() * 6) + 1) +
                    Math.floor((Math.random() * 6) + 1) +
                    Math.floor((Math.random() * 6) + 1);
        }
      }
      else
      {
        for(var j = 0; j < 6; j++) {
          var dice = [Math.floor((Math.random() * 6) + 1),
            Math.floor((Math.random() * 6) + 1),
            Math.floor((Math.random() * 6) + 1),
            Math.floor((Math.random() * 6) + 1)];

          var temp;
          for(var k = 1; k < 4; k++) {
            if(dice[0] > dice[k]) {
              temp = dice[k];
              dice[k] = dice[0];
              dice[0] = temp;
            }
          }
          $scope.player.stat[j] =  dice[1] + dice[2] + dice[3];
        }
      }
      $scope.calculateSaves();
      $scope.calculateScores();
    };

    //function used to calculate the players final ability scores
    $scope.calculateScores = function() {
      for(var i = 0; i < 6; i++) {
        $scope.player.statFinal[i] = $scope.player.stat[i] + $scope.player.statRMod[i];
        $scope.player.statMod[i] = Math.floor(($scope.player.statFinal[i] - 10)/2);
      }
      $scope.player.initiative = $scope.player.statMod[1];
      $scope.player.armorClass = $scope.player.statMod[1] + 10;
      $scope.calculateHP();
      $scope.calculateSkills();
    };

    //function used to caculate hit points
    $scope.calculateHP = function() {
      $scope.player.hitPoints = $scope.player.statMod[2] + $scope.player.hitDie;
    };

    //function used when player changes race, assigns racial mods, speed, and known languages
    $scope.raceChange = function() {
      console.info($scope.raceList.value);
      $scope.disableRMod();
      $scope.player.race = $scope.raceList.value;
      raceFinish = false;
      if($scope.raceList.value == 'dragonborn')
      {
        raceFinish = true;
        $scope.player.statRMod = [2, 0, 0, 0, 0, 1];
        $scope.player.speed = 30;
        $scope.player.languages = 'Common\nDragonic\n';
      }
      else if($scope.raceList.value == 'dwarf')
      {
        raceFinish = true;
        $scope.player.statRMod = [0, 0, 2, 0, 0, 0];
        $scope.player.speed = 25;
        $scope.player.languages = 'Common\nDwarvish\n';
      }
      else if($scope.raceList.value == 'elf')
      {
        raceFinish = true;
        $scope.player.statRMod = [0, 2, 0, 0, 0, 0];
        $scope.player.speed = 30;
        $scope.player.languages = 'Common\nElvish\n';
      }
      else if($scope.raceList.value == 'gnome')
      {
        raceFinish = true;
        $scope.player.statRMod = [0, 0, 0, 2, 0, 0];
        $scope.player.speed = 25;
        $scope.player.languages = 'Common\nGnomish\n';
      }
      else if($scope.raceList.value == 'half-elf') {
        $scope.player.statRMod = [0, 0, 0, 0, 0, 2];
        $scope.player.speed = 30;
        $scope.player.languages = 'Common\nElvish\n[Extra]';
        baseRMod = [0, 0, 0, 0, 0, 2];
        increaseR = 1;
        $scope.enableRMod();
      }
      else if($scope.raceList.value == 'half-orc')
      {
        raceFinish = true;
        $scope.player.statRMod = [2, 0, 1, 0, 0, 0];
        $scope.player.speed = 30;
        $scope.player.languages = 'Common\nOrc\n';
      }
      else if($scope.raceList.value == 'halfling')
      {
        raceFinish = true;
        $scope.player.statRMod = [0, 2, 0, 0, 0, 0];
        $scope.player.speed = 25;
        $scope.player.languages = 'Common\nHalfling\n';
      }
      else if($scope.raceList.value == 'human') {
        $scope.player.statRMod = [0, 0, 0, 0, 0, 0];
        $scope.player.speed = 30;
        $scope.player.languages = 'Common\n[Extra]\n';
        baseRMod = [0, 0, 0, 0, 0, 0];
        increaseR = 2;
        $scope.enableRMod();
      }
      else if($scope.raceList.value == 'tiefling')
      {
        raceFinish = true;
        $scope.player.statRMod = [0, 0, 0, 1, 0, 2];
        $scope.player.speed = 30;
        $scope.player.languages = 'Common\nInfernal\n';
      }
      else
        $scope.player.statRMod = [0, 0, 0, 0, 0, 0];
      $scope.calculateScores();
    };

    //function used when player changes class, enables class skills, set proficient skill saves, set's proficiencies
    $scope.classChange = function() {
      console.info($scope.classList.value);
      $scope.uncheckSkill();
      $scope.player.class = $scope.classList.value;
      skillFinish = false;
      if($scope.classList.value == 'barbarian') {
        increaseS = 2;
        $scope.disableSkill();
        $scope.animalDisable = false;
        $scope.athleticsDisable = false;
        $scope.intimidationDisable = false;
        $scope.natureDisable = false;
        $scope.perceptionDisable = false;
        $scope.survivalDisable = false;
        $scope.uncheckSaves();
        $scope.strSaveCheck = true;
        $scope.conSaveCheck = true;
        $scope.player.hitDie = 12;
        $scope.player.proficiencies = ['Light Armor', 'Medium Armor', 'Shield', 'Simple Weapons', 'Martial Weapons'];
        $scope.proficiencyList = 'Light Armor\nMedium Armor\nShield\nSimple Weaposn\nMartial Weapons';
      }
      else if($scope.classList.value == 'bard') {
        increaseS = 3;
        $scope.enableSkill();
        $scope.uncheckSaves();
        $scope.dexSaveCheck = true;
        $scope.chaSaveCheck = true;
        $scope.player.hitDie = 8;
        $scope.player.proficiencies = ['Light Armor', 'Simple Weapons', 'Hand Crossbows', 'Longswords', 'Rapiers', 'Three Musical Instruments of Your Choice'];
        $scope.proficiencyList = 'Light Armor\nSimple Weapons\nHand Crossbows\nLongswords\nRapiers\nThree Musical Instruments of Your Choice';
      }
      else if($scope.classList.value == 'cleric') {
        increaseS = 2;
        $scope.disableSkill();
        $scope.uncheckSaves();
        $scope.historyDisable = false;
        $scope.insightDisable = false;
        $scope.medicineDisable = false;
        $scope.persuasionDisable = false;
        $scope.religionDisable = false;
        $scope.wisSaveCheck = true;
        $scope.chaSaveCheck = true;
        $scope.player.hitDie = 8;
        $scope.player.proficiencies = ['Light Armor', 'Medium Armor', 'Simple Weapons', 'Shields'];
        $scope.proficiencyList = 'Light Armor\nMedium Armor\nSimple Weapons\nShields';
      }
      else if($scope.classList.value == 'druid') {
        increaseS = 2;
        $scope.disableSkill();
        $scope.uncheckSaves();
        $scope.acrobaticsDisable = false;
        $scope.animalDisable = false;
        $scope.insightDisable = false;
        $scope.medicineDisable = false;
        $scope.natureDisable = false;
        $scope.perceptionDisable = false;
        $scope.religionDisable = false;
        $scope.survivalDisable = false;
        $scope.intSaveCheck = true;
        $scope.wisSaveCheck = true;
        $scope.player.hitDie = 8;
        $scope.player.proficiencies = ['Light Armor', 'Medium Armor', 'Simple Weapons', 'Shields (non-metal)', 'Clubs',
          'Daggars', 'Darts', 'Javelins', 'Maces', 'Quarterstaffs', 'Scimitars', 'Sickles', 'Slings', 'Spears', 'Herbalism Kit'];
        $scope.proficiencyList = 'Light Armor\nMedium Armor\nShields (non-metal)\nClubs\nDaggers\nDarts\nJavelins\n' +
        'Maces\nQuarterstaffs\nScimitars\nSickles\nSlings\nSpears\nHerbalism Kit';
      }
      else if($scope.classList.value == 'fighter') {
        increaseS = 2;
        $scope.disableSkill();
        $scope.uncheckSaves();
        $scope.acrobaticsDisable = false;
        $scope.animalDisable = false;
        $scope.athleticsDisable = false;
        $scope.historyDisable = false;
        $scope.insightDisable = false;
        $scope.intimidationDisable = false;
        $scope.perceptionDisable = false;
        $scope.survivalDisable = false;
        $scope.strSaveCheck = true;
        $scope.conSaveCheck = true;
        $scope.player.hitDie = 10;
        $scope.player.proficiencies = ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields', 'Simple Weapons', 'Martial Weapons'];
        $scope.proficiencyList = 'Light Armor\nMedium Armor\nHeavy Armor\nShields\nSimple Weapons\nMartial Weapons';
      }
      else if($scope.classList.value == 'monk') {
        increaseS = 2;
        $scope.disableSkill();
        $scope.uncheckSaves();
        $scope.acrobaticsDisable = false;
        $scope.athleticsDisable = false;
        $scope.historyDisable = false;
        $scope.intimidationDisable = false;
        $scope.religionDisable = false;
        $scope.stealthDisable = false;
        $scope.strSaveCheck = true;
        $scope.dexSaveCheck = true;
        $scope.player.hitDie = 8;
        $scope.player.proficiencies = ['Simple Weapons', 'Shortswords', 'any one type of artisan\'s tools or any one musical instrument'];
        $scope.proficiencyList = 'Simple Weapons\nShortswords\nany one type of artisan\'s tools or any one musical instrument';
      }
      else if($scope.classList.value == 'paladin') {
        increaseS = 2;
        $scope.disableSkill();
        $scope.uncheckSaves();
        $scope.athleticsDisable = false;
        $scope.insightDisable = false;
        $scope.intimidationDisable = false;
        $scope.medicineDisable = false;
        $scope.persuasionDisable = false;
        $scope.religionDisable = false;
        $scope.wisSaveCheck = true;
        $scope.chaSaveCheck = true;
        $scope.player.hitDie = 10;
        $scope.player.proficiencies = ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields', 'Simple Weapons', 'Martial Weapons'];
        $scope.proficiencyList = 'Light Armor\nMedium Armor\nHeavy Armor\nShields\nSimple Weapons\nMartial Weapons';
      }
      else if($scope.classList.value == 'ranger') {
        increaseS = 2;
        $scope.disableSkill();
        $scope.uncheckSaves();
        $scope.animalDisable = false;
        $scope.athleticsDisable = false;
        $scope.insightDisable = false;
        $scope.investigationDisable = false;
        $scope.natureDisable = false;
        $scope.perceptionDisable = false;
        $scope.stealthDisable = false;
        $scope.survivalDisable = false;
        $scope.strSaveCheck = true;
        $scope.dexSaveCheck = true;
        $scope.player.hitDie = 10;
        $scope.player.proficiencies = ['Light Armor', 'Medium Armor', 'Shields', 'Simple Weapons', 'Martial Weapons'];
        $scope.proficiencyList = 'Light Armor\nMedium Armor\nShields\nSimple Weapons\nMartial Weapons';
      }
      else if($scope.classList.value == 'rogue') {
        increaseS = 2;
        $scope.disableSkill();
        $scope.uncheckSaves();
        $scope.acrobaticsDisable = false;
        $scope.athleticsDisable = false;
        $scope.deceptionDisable = false;
        $scope.insightDisable = false;
        $scope.intimidationDisable = false;
        $scope.investigationDisable = false;
        $scope.perceptionDisable = false;
        $scope.performanceDisable = false;
        $scope.persuasionDisable = false;
        $scope.sleightDisable = false;
        $scope.stealthDisable = false;
        $scope.dexSaveCheck = true;
        $scope.intSaveCheck = true;
        $scope.player.hitDie = 8;
        $scope.player.proficiencies = ['Light Armor', 'Simple Weapons', 'Hand Crossbows', 'Longswords', 'Rapiers', 'Shortswords', 'Thieve\'s Tools'];
        $scope.proficiencyList = 'Light Armor\nSimple Weapons\nHand Crossbows\nLongswords\nRapiers\nShortswords\nThieves\' Tools';
      }
      else if($scope.classList.value == 'sorcerer') {
        increaseS = 2;
        $scope.disableSkill();
        $scope.uncheckSaves();
        $scope.arcanaDisable = false;
        $scope.deceptionDisable = false;
        $scope.insightDisable = false;
        $scope.intimidationDisable = false;
        $scope.persuasionDisable = false;
        $scope.religionDisable = false;
        $scope.conSaveCheck = true;
        $scope.chaSaveCheck = true;
        $scope.player.hitDie = 6;
        $scope.player.proficiencies = ['Daggars', 'Darts', 'Slings', 'Quarterstaffs', 'Light Crossbows'];
        $scope.proficiencyList = 'Daggers\nDarts\nSlings\nQuarterstaffs\nLight Crossbows';
      }
      else if($scope.classList.value == 'warlock') {
        increaseS = 2;
        $scope.disableSkill();
        $scope.uncheckSaves();
        $scope.arcanaDisable = false;
        $scope.deceptionDisable = false;
        $scope.historyDisable = false;
        $scope.intimidationDisable = false;
        $scope.investigationDisable = false;
        $scope.natureDisable = false;
        $scope.religionDisable = false;
        $scope.wisSaveCheck = true;
        $scope.chaSaveCheck = true;
        $scope.player.hitDie = 8;
        $scope.player.proficiencies = ['Light Armor', 'Simple Weapons'];
        $scope.proficiencyList = 'Light Armor\nSimple Weapons';

      }
      else if($scope.classList.value == 'wizard') {
        increaseS = 2;
        $scope.disableSkill();
        $scope.uncheckSaves();
        $scope.arcanaDisable = false;
        $scope.historyDisable = false;
        $scope.insightDisable = false;
        $scope.investigationDisble = false;
        $scope.medicineDisable = false;
        $scope.religionDisable = false;
        $scope.intSaveCheck = true;
        $scope.wisSaveCheck = true;
        $scope.player.hitDie = 6;
        $scope.player.proficiencies = ['Daggers', 'Darts', 'Slings', 'Quarterstaffs', 'Light Crossbows'];
        $scope.proficiencyList = 'Daggers\nDarts\nSlings\nQuarterstaffs\nLight Crossbows';
      }
      $scope.calculateSaves();
      $scope.calculateHP();
    };

    //function used when racial mods are changed, only used for humans and half elfs
    $scope.setRMod = function(i) {
      if($scope.player.statRMod[i] != previousRMod[i]) {
        var decrease = false;
        console.info('yup in the function');
        if($scope.player.statRMod[i] < baseRMod[i] || ($scope.player.statRMod[i] < previousRMod[i])) {
          decrease = true;
          console.info('decreased yup');
          $scope.player.statRMod[i] = baseRMod[i];
        }
        /*if($scope.player.statRMod[0] < baseRMod[0]) {
          decrease = true;
          $scope.player.statRMod[0] = baseRMod[0];
        }
        if($scope.player.statRMod[1] < baseRMod[1]) {
          decrease = true;
          $scope.player.statRMod[1] = baseRMod[1];
        }
        if($scope.player.statRMod[2] < baseRMod[2]) {
          decrease = true;
          $scope.player.statRMod[2] = baseRMod[2];
        }
        if($scope.player.statRMod[3] < baseRMod[3]) {
          decrease = true;
          $scope.player.statRMod[3] = baseRMod[3];
        }
        if($scope.player.statRMod[4] < baseRMod[4]) {
          decrease = true;
          $scope.player.statRMod[4] = baseRMod[4];
        }
        if($scope.player.statRMod[5] < baseRMod[5]) {
          decrease = true;
          $scope.player.statRMod[5] = baseRMod[5];
        }*/
        if(decrease) {
          console.info('decrease');
          if(rAdd != 0) {
            rAdd--;
          }
        }
        else {
          rAdd++;
          console.info('scrumpis');
          previousRMod[0] = $scope.player.statRMod[0];
          previousRMod[1] = $scope.player.statRMod[1];
          previousRMod[2] = $scope.player.statRMod[2];
          previousRMod[3] = $scope.player.statRMod[3];
          previousRMod[4] = $scope.player.statRMod[4];
          previousRMod[5] = $scope.player.statRMod[5];
        }
        if(rAdd >= increaseR) {
          console.info(increaseR);
          raceFinish = true;
          baseRMod[0] = $scope.player.statRMod[0];
          baseRMod[1] = $scope.player.statRMod[1];
          baseRMod[2] = $scope.player.statRMod[2];
          baseRMod[3] = $scope.player.statRMod[3];
          baseRMod[4] = $scope.player.statRMod[4];
          baseRMod[5] = $scope.player.statRMod[5];
          rAdd = 0;
          $scope.disableRMod();
        }
      }
      //baseRMod[0] = $scope.player.statRMod[0];
    //  baseRMod[1] = $scope.player.statRMod[1];
      //baseRMod[2] = $scope.player.statRMod[2];
      //baseRMod[3] = $scope.player.statRMod[3];
      //baseRMod[4] = $scope.player.statRMod[4];
      //baseRMod[5] = $scope.player.statRMod[5];
    };

    //function that enables racial modifier changes
    $scope.enableRMod = function() {
      this.rStrDisable = false;
      this.rDexDisable = false;
      this.rConDisable = false;
      this.rIntDisable = false;
      this.rWisDisable = false;
      this.rChaDisable = false;
    };

    //function that disables racial modifier changes
    $scope.disableRMod = function() {
      console.info('is it this?');
      this.rStrDisable = true;
      this.rDexDisable = true;
      this.rConDisable = true;
      this.rIntDisable = true;
      this.rWisDisable = true;
      this.rChaDisable = true;
    };

    //function that enables all skill checkboxes
    $scope.enableSkill = function() {
      $scope.acrobaticsDisable = false;
      $scope.animalDisable = false;
      $scope.arcanaDisable = false;
      $scope.athleticsDisable = false;
      $scope.deceptionDisable = false;
      $scope.historyDisable = false;
      $scope.insightDisable = false;
      $scope.intimidationDisable = false;
      $scope.investigationDisable = false;
      $scope.medicineDisable = false;
      $scope.natureDisable = false;
      $scope.perceptionDisable = false;
      $scope.performanceDisable = false;
      $scope.persuasionDisable = false;
      $scope.religionDisable = false;
      $scope.sleightDisable = false;
      $scope.stealthDisable = false;
      $scope.survivalDisable = false;
    };

    //function that disables all skill checkboxes
    $scope.disableSkill = function() {
      $scope.acrobaticsDisable = true;
      $scope.animalDisable = true;
      $scope.arcanaDisable = true;
      $scope.athleticsDisable = true;
      $scope.deceptionDisable = true;
      $scope.historyDisable = true;
      $scope.insightDisable = true;
      $scope.intimidationDisable = true;
      $scope.investigationDisable = true;
      $scope.medicineDisable = true;
      $scope.natureDisable = true;
      $scope.perceptionDisable = true;
      $scope.performanceDisable = true;
      $scope.persuasionDisable = true;
      $scope.religionDisable = true;
      $scope.sleightDisable = true;
      $scope.stealthDisable = true;
      $scope.survivalDisable = true;
    };

    //fucntion that unchecks all skill checkboxes
    $scope.uncheckSkill = function() {
      console.info('myster');
      $scope.acrobaticsCheck = false;
      $scope.animalCheck = false;
      $scope.arcanaCheck = false;
      $scope.athleticsCheck = false;
      $scope.deceptionCheck = false;
      $scope.historyCheck = false;
      $scope.insightCheck = false;
      $scope.intimidationCheck = false;
      $scope.investigationCheck = false;
      $scope.medicineCheck = false;
      $scope.natureCheck = false;
      $scope.perceptionCheck = false;
      $scope.performanceCheck = false;
      $scope.persuasionCheck = false;
      $scope.religionCheck = false;
      $scope.sleightCheck = false;
      $scope.stealthCheck = false;
      $scope.survivalCheck = false;
    };

    //function that unchecks all saving throw checkboxes
    $scope.uncheckSaves = function() {
      $scope.strSaveCheck = false;
      $scope.dexSaveCheck = false;
      $scope.conSaveCheck = false;
      $scope.intSaveCheck = false;
      $scope.wisSaveCheck = false;
      $scope.chaSaveCheck = false;
    };

    //cfunction that calculates saving throws
    $scope.calculateSaves = function() {
      if($scope.strSaveCheck){
        $scope.player.statSave[0] = $scope.player.statMod[0] + $scope.player.proficiency;
      }
      else {
        $scope.player.statSave[0] = $scope.player.statMod[0];
      }
      if($scope.dexSaveCheck){
        $scope.player.statSave[1] = $scope.player.statMod[1] + $scope.player.proficiency;
      }
      else {
        $scope.player.statSave[1] = $scope.player.statMod[1];
      }
      if($scope.conSaveCheck){
        $scope.player.statSave[2] = $scope.player.statMod[2] + $scope.player.proficiency;
      }
      else {
        $scope.player.statSave[2] = $scope.player.statMod[2];
      }
      if($scope.intSaveCheck){
        $scope.player.statSave[3] = $scope.player.statMod[3] + $scope.player.proficiency;
      }
      else {
        $scope.player.statSave[3] = $scope.player.statMod[3];
      }
      if($scope.wisSaveCheck){
        $scope.player.statSave[4] = $scope.player.statMod[4] + $scope.player.proficiency;
      }
      else {
        $scope.player.statSave[4] = $scope.player.statMod[4];
      }
      if($scope.chaSaveCheck){
        $scope.player.statSave[5] = $scope.player.statMod[5] + $scope.player.proficiency;
      }
      else {
        $scope.player.statSave[5] = $scope.player.statMod[5];
      }
    };

    //functon that calculates skill scores
    $scope.calculateSkills = function() {
      console.info('calculateSkills');
      //var i;
      //console.info(skillChecksArr);
      var check = 0;
      if($scope.acrobaticsCheck) {
        check++;
        console.info('heh big dongers');
        $scope.player.acrobatics = $scope.player.statMod[1] + $scope.player.proficiency;
      }
      else
      {
        $scope.player.acrobatics = $scope.player.statMod[1];
      }
      if($scope.animalCheck) {
        check++;
        $scope.player.animalHandling = $scope.player.statMod[4] + $scope.player.proficiency;
      }
      else {
        $scope.player.animalHandling = $scope.player.statMod[4];
      }
      if($scope.arcanaCheck) {
        console.info('is this if broken?');
        check++;
        console.info($scope.player.statMod[3] + $scope.player.proficiency);
        $scope.player.arcana = $scope.player.statMod[3] + $scope.player.proficiency;
      }
      else {
        $scope.player.arcana = $scope.player.statMod[3];
      }
      if($scope.athleticsCheck) {
        check++;
        $scope.player.athletics = $scope.player.statMod[0] + $scope.player.proficiency;
      }
      else {
        $scope.player.athletics = $scope.player.statMod[0];
      }
      if($scope.deceptionCheck) {
        check++;
        $scope.player.deception = $scope.player.statMod[5] + $scope.player.proficiency;
      }
      else {
        $scope.player.deception = $scope.player.statMod[5];
      }
      if($scope.historyCheck) {
        check++;
        $scope.player.history = $scope.player.statMod[3] + $scope.player.proficiency;
      }
      else{
        $scope.player.history = $scope.player.statMod[3];
      }
      if($scope.insightCheck) {
        check++;
        $scope.player.insight = $scope.player.statMod[4] + $scope.player.proficiency;
      }
      else {
        $scope.player.insight = $scope.player.statMod[4];
      }
      if($scope.intimidationCheck) {
        check++;
        $scope.player.intimidation = $scope.player.statMod[5] + $scope.player.proficiency;
      }
      else {
        $scope.player.intimidation = $scope.player.statMod[5];
      }
      if($scope.investigationCheck) {
        check++;
        $scope.player.investigation = $scope.player.statMod[3] + $scope.player.proficiency;
      }
      else {
        $scope.player.investigation = $scope.player.statMod[3];
      }
      if($scope.medicineCheck) {
        check++;
        $scope.player.medicine = $scope.player.statMod[4] + $scope.player.proficiency;
      }
      else {
        $scope.player.medicine = $scope.player.statMod[4];
      }
      if($scope.natureCheck) {
        check++;
        $scope.player.nature = $scope.player.statMod[3] + $scope.player.proficiency;
      }
      else {
        $scope.player.nature = $scope.player.statMod[3];
      }
      if($scope.perceptionCheck) {
        check++;
        $scope.player.perception = $scope.player.statMod[4] + $scope.player.proficiency;
      }
      else {
        $scope.player.perception = $scope.player.statMod[4];
      }
      if($scope.performanceCheck) {
        check++;
        $scope.player.performance = $scope.player.statMod[5] + $scope.player.proficiency;
      }
      else {
        $scope.player.performance = $scope.player.statMod[5];
      }
      if($scope.persuasionCheck) {
        check++;
        $scope.player.persuasion = $scope.player.statMod[5] + $scope.player.proficiency;
      }
      else {
        $scope.player.persuasion = $scope.player.statMod[5];
      }
      if($scope.religionCheck) {
        check++;
        $scope.player.religion = $scope.player.statMod[3] + $scope.player.proficiency;
      }
      else {
        $scope.player.religion = $scope.player.statMod[3];
      }
      if($scope.sleightCheck) {
        check++;
        $scope.player.sleightOfHand = $scope.player.statMod[1] + $scope.player.proficiency;
      }
      else {
        $scope.player.sleightOfHand = $scope.player.statMod[1];
      }
      if($scope.stealthCheck) {
        check++;
        $scope.player.stealth = $scope.player.statMod[1] + $scope.player.proficiency;
      }
      else {
        $scope.player.stealth = $scope.player.statMod[1];
      }
      if($scope.survivalCheck) {
        check++;
        $scope.player.survival = $scope.player.statMod[3] + $scope.player.proficiency;
      }
      else {
        $scope.player.survival = $scope.player.statMod[3];
      }
      if(check == increaseS)
      {
        skillFinish = true;
        $scope.disableSkill();
      }
    };
    $scope.disableSkill();
    $scope.disableRMod();
    $scope.uncheckSkill();
    $scope.uncheckSaves();
    //console.info(skillChecksArr);


  }
]);
