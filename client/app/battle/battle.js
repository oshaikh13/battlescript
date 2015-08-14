angular.module('battlescript.battle', [])

.controller('BattleController', function($rootScope, $scope, $timeout, $location, $stateParams, Users, Battle) {

  ////////////////////////////////////////////////////////////
  // check first to see if valid battle room id
  ////////////////////////////////////////////////////////////

  $scope.battleRoomId = $stateParams.id;
  $scope.battleInitialized = false;
  $scope.currentUser = Users.getAuthUser();
  $scope.opponent = 'waiting... '

  console.log('we are here....');

  Battle.isValidBattleRoom($scope.battleRoomId)
    .then(function(valid) {
      if (valid) {
        $rootScope.initBattleSocket($scope.battleRoomId, function() {
          $scope.initBattle();
        });
      } else {
        // redirect to dashboard
        $location.path('/dashboard');
      }
    })
    .catch(function(err) {
      console.log(err);
    });
  
  ////////////////////////////////////////////////////////////
  // init players
  ////////////////////////////////////////////////////////////

  $scope.initBattle = function() {

    $scope.battleInitialized = true;

    $scope.user = $scope.currentUser;
    $scope.opponent = 'waiting...';

    // this gets passed into the directive.
    // it definitely needs to be refactored depending on what happens
    // up above.
    $scope.userInfo = {username: $scope.user};

    ////////////////////////////////////////////////////////////
    // configure both editors and wire them to socket
    ////////////////////////////////////////////////////////////

    // set up buttons
    $scope.userButtonAttempt = 'Attempt Solution';
    $scope.userButtonSubmitFinal = 'Submit Final';
    $scope.userNotes = 'Nothing to show yet...';

    // set up editor 1
    var editor1 = CodeMirror.fromTextArea(document.querySelector('#editor1'), {
      mode: 'javascript',
      theme: 'material',
      indentUnit: 2,
      tabSize: 2,
      lineNumbers: false
    });

    // set up editor 2
    var editor2 = CodeMirror.fromTextArea(document.querySelector('#editor2'), {
      mode: 'javascript',
      theme: 'material',
      indentUnit: 2,
      tabSize: 2,
      lineNumbers: true,
      readOnly: 'nocursor'
    });

    // list for changes on editor
    editor1.on('change', function(e) {
      $rootScope.battleSocket.emit('textChange', editor1.getValue());
    });

    // 
    $rootScope.battleSocket.emit('getUsers');

    $rootScope.battleSocket.on('userList', function(userArray){
      // THIS WILL ONLY WORK FOR TWO USERS RIGHT NOW
      // loop over array looking for other users
      userArray.forEach(function(name){
        if(name !== $scope.user){
          $scope.playerTwo = name;    
          $scope.$apply();
        }
      });
      // set other user to player2 variable
      // if only one user, don't change player 2
    });

    $rootScope.battleSocket.on('updateEnemy', function(text){
      editor2.setValue(text);
    });





    ////////////////////////////////////////////////////////////
    // stuff to handle the waiting on both players
    ////////////////////////////////////////////////////////////
    
    // initial battle wait time when two players enter battle room
    $scope.battleWaitTime = 300000;

    // updates the battle wait time
    $scope.updateBattleWaitTime = function() {
      if ($scope.battleWaitTime === 0) {
        // we've timed out, need to do something...
      } else {
        $timeout(function() {
          $scope.battleWaitTime = $scope.battleWaitTime - 1000;
          $scope.updateBattleWaitTime();
        }, 1000);
      }
    };

    // call func immediately
    $scope.updateBattleWaitTime();





    ////////////////////////////////////////////////////////////
    // handle when both players are ready
    ////////////////////////////////////////////////////////////
    
    // set up player one states
    $scope.userReadyState = false;
    $scope.userReadyClass = '';
    $scope.userReadyText = 'Waiting on you';

    // this updates player one's ready state
    $scope.updateUserReadyState = function() {
      if ($scope.userReadyState === false) {
        $scope.userReadyState = true;
        $scope.userReadyClass = 'active';
        $scope.userReadyText = 'Ready for battle!';

        // emit a socket event
        $rootScope.battleSocket.emit('userReady', $scope.currentUser);

        // check if both players ready
        $scope.ifBothPlayersReady();
      }
    };

    // set up player two states
    $scope.opponentReadyState = false;
    $scope.opponentReadyClass = '';
    $scope.opponentReadyText = 'Waiting on opponent';

    // this time, let sockets listen for player two ready event
    $rootScope.battleSocket.on('opponentReady', function(opponent) {
      if ($scope.opponentReadyState === false) {
        $scope.opponentReadyState = true;
        $scope.opponentReadyClass = 'active';
        $scope.opponentReadyText = 'Ready for battle!';
        $scope.opponent = opponent;
        $scope.ifBothPlayersReady();
      }
    });





    ////////////////////////////////////////////////////////////
    // both players ready, prepare for battle
    ////////////////////////////////////////////////////////////

    // the battle prompt loaded is initially false, and we will only udpate it
    // on success down below.
    $scope.battlePromptLoaded = false;

    // we also need to check if both players are ready, to immediately prepare
    // the battle down below
    $scope.ifBothPlayersReady = function() {
      if ($scope.userReadyState && $scope.opponentReadyState) {
        $scope.getBattle();
      }
    };





    ////////////////////////////////////////////////////////////
    // battle logistics
    ////////////////////////////////////////////////////////////

    // first, cache some vars
    $scope.battle;
    $scope.battleDescription = null;
    $scope.battleProjectId = null;
    $scope.battleSolutionId = null;

    // fetch a battle
    $scope.getBattle = function() {
      Battle.getBattle()
        .then(function(data) {
          // battle prompt loaded is now true
          $scope.battlePromptLoaded = true;

          // set up the battle specifics
          $scope.battle = JSON.parse(data.body);
          $scope.battleDescription = marked($scope.battle.description);
          $scope.battleProjectId = $scope.battle.session.projectId;
          $scope.battleSolutionId = $scope.battle.session.solutionId;

          // update editors
          $timeout(function() {
            editor1.setValue($scope.battle.session.setup);
            editor2.setValue($scope.battle.session.setup);
          }, 50);

        })
        .catch(function(err) {
          console.log('There was an error fetching the problem...');
          console.log(err);
        });
    };






    ////////////////////////////////////////////////////////////
    // handle battle attempts
    ////////////////////////////////////////////////////////////

    $scope.attemptBattle = function($event) {
      $event.preventDefault();

      $scope.userButtonAttempt = 'Attempting...';

      Battle.attemptBattle($scope.battleProjectId, $scope.battleSolutionId, editor1.getValue())
        .then(function(data) {
          $scope.userButtonAttempt = 'Attempt Solution';
          $scope.userNotes = data.reason;

          // TODO: polling is successful at this point in time, time to send
          // and recieve the correct data
          console.log(data);
        });
    };
  };

});
