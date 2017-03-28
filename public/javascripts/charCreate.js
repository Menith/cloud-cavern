app.controller('CharCtrl',[
  '$scope',
  function($scope) {
    $scope.player = {
      name: '',
      race: '',
      class: '',
      alignment: '',
      background: '',
      level: 1,
      proficiency: 2,
      initiative: 0,
      hitPoints: 0,
      armorClass: 0,
      speed: 0,
      stat: [0, 0, 0, 0, 0, 0],
      statMod: [0, 0, 0, 0, 0, 0],
      statRMod: [0, 0, 0, 0, 0, 0],
      statSave: [0, 0, 0, 0, 0, 0],
      traits: '',
      bonds: '',
      flaws: '',
      ideals: '',
      feats: [],
      attacks_spells: [],
      proficiencies: [],
      languages: [],
      equipment: []

    };
    $scope.dice = [{
      value: '3d6',
      label: '3d6'}, {
      value: '4d6',
      label: '4d6 Drop'
    }];

    $scope.rollStats = function() {
      console.info($scope.diceList.value);
      if($scope.diceList.value === '3d6')
      {
        for(var i = 0; i < 6; i++)
        {
          $scope.player.stat[i] = Math.floor((Math.random() * 6) + 1) +
                    Math.floor((Math.random() * 6) + 1) +
                    Math.floor((Math.random() * 6) + 1);
        }
      }
      else
      {
        for(var j = 0; j < 6; j++)
        {
          var dice = [Math.floor((Math.random() * 6) + 1),
            Math.floor((Math.random() * 6) + 1),
            Math.floor((Math.random() * 6) + 1),
            Math.floor((Math.random() * 6) + 1)];

          var temp;
          for(var k = 1; k < 4; k++)
          {
            if(dice[0] > dice[k])
            {
              temp = dice[k];
              dice[k] = dice[0];
              dice[0] = temp;
            }
          }
          $scope.player.stat[j] =  dice[1] + dice[2] + dice[3];
        }
      }
    };
  }
]);
