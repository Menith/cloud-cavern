app.factory('CharFactory', [
  '$http',
  function($http) {
    var characters = {};
    characters.createNew = function(playerID, character) {
      return $http.post('/character/new', {character: character, player: playerID}).then((res) => {
        return res.data;
      });
    };
    characters.delete = function(id) {
      return $http.delete('/delete/character/' + id).then((res) => {
        return res.data;
      });
    };
    return characters;
  }
]);
app.controller('CharCtrl',[
  '$scope', '$state', '$stateParams', 'CharFactory', 'auth',
  function($scope, $state, $stateParams, CharFactory, auth) {

    $scope.player = {
      name: $stateParams.name,
      race: $stateParams.race,
      //raceIndex: $stateParams.raceIndex,
      class: $stateParams.class,
      //classIndex: $stateParams.classIndex,
      background: $stateParams.background,
      level: $stateParams.level,
      proficiency: $stateParams.proficiency,
      initiative: $stateParams.initiative,
      hitPoints: $stateParams.hitPoints,
      hitDie: $stateParams.hitDie,
      armorClass: $stateParams.armorClass,
      speed: $stateParams.speed,
      stat: $stateParams.stat,
      statFinal: $stateParams.statFinal,
      statMod: $stateParams.statMod,
      statRMod: $stateParams.statRMod,
      statSave: $stateParams.statSave,
      acrobatics: $stateParams.acrobatics,
      animalHandling: $stateParams.animalHandling,
      arcana: $stateParams.arcana,
      athletics: $stateParams.athletics,
      deception: $stateParams.deception,
      history: $stateParams.history,
      insight: $stateParams.insight,
      intimidation: $stateParams.intimidation,
      investigation: $stateParams.investigation,
      medicine: $stateParams.medicine,
      nature: $stateParams.nature,
      perception: $stateParams.perception,
      performance: $stateParams.performance,
      persuasion: $stateParams.persuasion,
      religion: $stateParams.religion,
      sleightOfHand: $stateParams.sleightOfHand,
      stealth: $stateParams.stealth,
      survival: $stateParams.survival,
      align1: $stateParams.align1,
      align2: $stateParams.align2,
      traits: $stateParams.traits,
      bonds: $stateParams.bonds,
      flaws: $stateParams.flaws,
      ideals: $stateParams.ideals,
      feats: $stateParams.feats,
      attacksSpells: $stateParams.attacksSpells,
      proficiencies: $stateParams.proficiencies,
      languages: $stateParams.languages,
      equipment: $stateParams.equipment

    };
    var old = false;
    if($scope.player.name != '')
    {
      old = true;
    }
    //name, race, class, background,
    console.info($scope.player.raceIndex);
    console.info($scope.player.classIndex);
    var baseRMod = [0, 0, 0, 0, 0, 0]; //starting racial mods, used for Humans and half Elfs
    var previousRMod = [0, 0, 0, 0, 0, 0]; //racial mods before increase, used for Humans and half Elfs

    var increaseS = 0; //maximum times a player can select skills
    var increaseR = 0; //maximum times a player can increase racial modifier
    var rAdd = 0; //variable used to track times the user has increased racial modifiers

    var raceFinish = false;
    var skillFinish = false;

    //$scope.selectedRace = $scope.player.raceIndex;
    /*if($scope.race != '')
    {
      if($scope.race == 'Dragonborn')
        $scope.selectedRace = 1;
      else if($scope.race == 'Dwarf')
        $scope.selectedRace = 2;
      else if($scope.race == 'Elf')
        $scope.selectedRace = 3;
      else if($scope.race == 'Gnome')
        $scope.selectedRace = 4;
      else if($scope.race == 'Half-Elf')
        $scope.selectedRace = 5;
      else if($scope.race == 'Half-Orc')
        $scope.selectedRace = 6;
      else if($scope.race == 'Halfling')
        $scope.selectedRace = 7;
      else if($scope.race == 'Human')
        $scope.selectedRace = 8;
      else if($scope.race == 'Tiefling')
        $scope.selectedRace = 9;
    }
    else {
      $scope.selectedRace = 0;
    }*/
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
      {value: 'Dragonborn', label: 'Dragonborn'},
      {value: 'Dwarf', label: 'Dwarf'},
      {value: 'Elf', label: 'Elf'},
      {value: 'Gnome', label: 'Gnome'},
      {value: 'Half-Elf', label: 'Half-Elf'},
      {value: 'Half-Orc', label: 'Half-Orc'},
      {value: 'Halfling', label: 'Halfling'},
      {value: 'Human', label: 'Human'},
      {value: 'Tiefling', label: 'Tiefling'}
    ];
    //$scope.selectedRace;

    //class selector
    $scope.classes = [
      {value: 'choose', label: 'Choose'},
      {value: 'Barbarian', label: 'Barbarian'},
      {value: 'Bard', label: 'Bard'},
      {value: 'Cleric', label: 'Cleric'},
      {value: 'Druid', label: 'Druid'},
      {value: 'Fighter', label: 'Fighter'},
      {value: 'Monk', label: 'Monk'},
      {value: 'Paladin', label: 'Paladin'},
      {value: 'Ranger', label: 'Ranger'},
      {value: 'Rogue', label: 'Rogue'},
      {value: 'Sorcerer', label: 'Sorcerer'},
      {value: 'Warlock', label: 'Warlock'},
      {value: 'Wizard', label: 'Wizard'}
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

    $scope.tabs = {
      tab1: true,
      tab2: false,
      tab3: false,
      tab4: false
    };
    $scope.proficiencyList = '';
    $scope.languageList = '';

    //function called when save button is clicked
    $scope.saveCharacter = function() {
      console.info($scope.player.stat[0]);
      $scope.player.initiative = $scope.player.statMod[1];
      $scope.player.armorClass = $scope.player.statMod[1] + 10;
      $scope.calculateHP();
      $scope.calculateSkills();
      $scope.calculateSaves();
      //console.info($scope.player.statSave[0] + ' ' + $scope.player.statSave[1] + ' ' + $scope.player.statSave[2] + ' ' + $scope.player.statSave[3] + ' ' + $scope.player.statSave[4] + ' ' + $scope.player.statSave[5]);
      if($scope.charForm.$valid && raceFinish && skillFinish)
        /*if(old)
        {
          console.info("wow");
          CharFactory.delete($scope.player._id).then(()=>{
            console.info("wow");
            CharFactory.createNew(auth.currentUserId(), $scope.player).then((res) => {
              $state.go('player');
            });
          });
        }
        else
        {*/
          console.info("wowzers");
          CharFactory.createNew(auth.currentUserId(), $scope.player).then((res) => {
            $state.go('player');
          });
      //  }
      else
        alert('It seems like you have not filled out the whole page, make sure to fill out all required fields, select skills, and adjust racial modifiers if needed');

    };

    $scope.clearCheckedSkills = function() {
      //a
      $scope.uncheckSkill();
      $scope.classChange();
      $scope.calculateSkills();
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
      $scope.calculateSaves();
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
      if($scope.raceList.value == 'Dragonborn')
      {
        raceFinish = true;
        $scope.player.statRMod = [2, 0, 0, 0, 0, 1];
        $scope.player.speed = 30;
        $scope.player.languages = 'Common\nDraconic\n';
        //$scope.player.raceIndex = 1;
      }
      else if($scope.raceList.value == 'Dwarf')
      {
        raceFinish = true;
        $scope.player.statRMod = [0, 0, 2, 0, 0, 0];
        $scope.player.speed = 25;
        $scope.player.languages = 'Common\nDwarvish\n';
        //$scope.player.raceIndex = 2;
      }
      else if($scope.raceList.value == 'Elf')
      {
        raceFinish = true;
        $scope.player.statRMod = [0, 2, 0, 0, 0, 0];
        $scope.player.speed = 30;
        $scope.player.languages = 'Common\nElvish\n';
        //$scope.player.raceIndex = 3;
      }
      else if($scope.raceList.value == 'Gnome')
      {
        raceFinish = true;
        $scope.player.statRMod = [0, 0, 0, 2, 0, 0];
        $scope.player.speed = 25;
        $scope.player.languages = 'Common\nGnomish\n';
        //$scope.player.raceIndex = 4;
      }
      else if($scope.raceList.value == 'Half-Elf') {
        $scope.player.statRMod = [0, 0, 0, 0, 0, 2];
        $scope.player.speed = 30;
        $scope.player.languages = 'Common\nElvish\n[Extra]';
        //$scope.player.raceIndex = 5;
        baseRMod = [0, 0, 0, 0, 0, 2];
        increaseR = 1;
        $scope.enableRMod();
      }
      else if($scope.raceList.value == 'Half-Orc')
      {
        raceFinish = true;
        $scope.player.statRMod = [2, 0, 1, 0, 0, 0];
        $scope.player.speed = 30;
        $scope.player.languages = 'Common\nOrc\n';
        //$scope.player.raceIndex = 6;
      }
      else if($scope.raceList.value == 'Halfling')
      {
        raceFinish = true;
        $scope.player.statRMod = [0, 2, 0, 0, 0, 0];
        $scope.player.speed = 25;
        $scope.player.languages = 'Common\nHalfling\n';
        //$scope.player.raceIndex = 7;
      }
      else if($scope.raceList.value == 'Human') {
        $scope.player.statRMod = [0, 0, 0, 0, 0, 0];
        $scope.player.speed = 30;
        $scope.player.languages = 'Common\n[Extra]\n';
        //$scope.player.raceIndex = 8;
        baseRMod = [0, 0, 0, 0, 0, 0];
        increaseR = 2;
        $scope.enableRMod();
      }
      else if($scope.raceList.value == 'Tiefling')
      {
        raceFinish = true;
        $scope.player.statRMod = [0, 0, 0, 1, 0, 2];
        $scope.player.speed = 30;
        $scope.player.languages = 'Common\nInfernal\n';
        //$scope.player.raceIndex = 9;
      }
      else
        $scope.player.statRMod = [0, 0, 0, 0, 0, 0];
      $scope.calculateScores();
      $scope.calculateSaves();
    };

    //function used when player changes class, enables class skills, set proficient skill saves, set's proficiencies
    $scope.classChange = function() {
      console.info($scope.classList.value);
      $scope.uncheckSkill();
      $scope.player.class = $scope.classList.value;
      skillFinish = false;
      if($scope.classList.value == 'Barbarian') {
        increaseS = 2;
        $scope.player.classIndex = 1;
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
      else if($scope.classList.value == 'Bard') {
        increaseS = 3;
        $scope.player.classIndex = 2;
        $scope.enableSkill();
        $scope.uncheckSaves();
        $scope.dexSaveCheck = true;
        $scope.chaSaveCheck = true;
        $scope.player.hitDie = 8;
        $scope.player.proficiencies = ['Light Armor', 'Simple Weapons', 'Hand Crossbows', 'Longswords', 'Rapiers', 'Three Musical Instruments of Your Choice'];
        $scope.proficiencyList = 'Light Armor\nSimple Weapons\nHand Crossbows\nLongswords\nRapiers\nThree Musical Instruments of Your Choice';
      }
      else if($scope.classList.value == 'Cleric') {
        increaseS = 2;
        $scope.player.classIndex = 3;
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
      else if($scope.classList.value == 'Druid') {
        increaseS = 2;
        $scope.player.classIndex = 4;
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
      else if($scope.classList.value == 'Fighter') {
        increaseS = 2;
        $scope.player.classIndex = 5;
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
      else if($scope.classList.value == 'Monk') {
        increaseS = 2;
        $scope.player.classIndex = 6;
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
      else if($scope.classList.value == 'Paladin') {
        increaseS = 2;
        $scope.player.classIndex = 7;
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
      else if($scope.classList.value == 'Ranger') {
        increaseS = 2;
        $scope.player.classIndex = 8;
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
      else if($scope.classList.value == 'Rogue') {
        increaseS = 2;
        $scope.player.classIndex = 9;
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
      else if($scope.classList.value == 'Sorcerer') {
        increaseS = 2;
        $scope.player.classIndex = 10;
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
      else if($scope.classList.value == 'Warlock') {
        increaseS = 2;
        $scope.player.classIndex = 11;
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
      else if($scope.classList.value == 'Wizard') {
        increaseS = 2;
        $scope.player.classIndex = 12;
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

    //function used when racial mods are changed, only used for Humans and half Elfs
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
