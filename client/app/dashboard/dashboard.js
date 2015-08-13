angular.module('battlescript.dashboard', [])

.controller('DashboardController', function ($scope, $timeout, SocketHolder, Dashboard) {
  // scope.username always refers to the curreng logged in user
  // 
  // TODO: extract this into the global set up, so we don't have to keep
  // rededfining it in every controller
  $scope.username = SocketHolder.playerOne;

  // this gets passed into the directive.
  // it definitely needs to be refactored depending on what happens
  // up above.
  $scope.userInfo = {
    username: $scope.username
  };

  ////////////////////////////////////////////////////////////
  // sets up all the dashboard stuff here
  ////////////////////////////////////////////////////////////

  // this defaults to false, because when the page first loads, there is 
  // no battle request for the logged in user
  $scope.userHasBattleRequest = false;

  // battle request status can be 'none', 'open', or 'init'. it defaults
  // to none, changes to open when a request is first sent, and changes to
  // init if the user accepts/declines the battle request.
  $scope.battleRequestStatus = 'none';

  // this defaults to null, because by default, no opponents have challenged
  // the logged in user
  $scope.battleRequestOpponentName = null;

  ////////////////////////////////////////////////////////////
  // set up sockets
  ////////////////////////////////////////////////////////////

  var socket = SocketHolder.socket;

  ////////////////////////////////////////////////////////////
  // set up online users
  ////////////////////////////////////////////////////////////

  $scope.onlineUsers;

  $scope.getOnlineUsers = function(){
    Dashboard.getOnlineUsers()
      .then(function(data) {
        $scope.onlineUsers = data;
        console.log(data);
      });
  };

  $scope.getOnlineUsers();

  socket.on('updateUsers', function() {
    $scope.getOnlineUsers();
  });

  ////////////////////////////////////////////////////////////
  // handle battle requests
  ////////////////////////////////////////////////////////////

  // Open up socket with specific dashboard server handler
  $scope.requestBattle = function($event, opponentUsername) {
    $event.preventDefault();

    // now, we need to emit to the socket
    socket.emit('outgoingBattleRequest', {
      fromUser: $scope.username,  // request from the logged in user
      toUser: opponentUsername    // request to the potential opponent
    });
  };

  // listen for incoming battle request
  socket.on('incomingBattleRequest', function(user){
    $scope.battleRequestOpponentName = user.fromUser;
    $scope.userHasBattleRequest = true;
    $scope.battleRequestStatus = 'open';
    $scope.$apply();
    console.log("opponent has challenged you: ", user.fromUser);
  });

  // battle has been accepted
  $scope.battleAccepted = function() {
    // need to somehow notify challenger that the battle has been accepted
    socket.emit('battleAccepted', {
      opponent: $scope.battleRequestOpponentName  // the opponent needs to be notified
    });
  };

  // battle has been declined
  $scope.battleDeclined = function() {

  };

  // prepare for battle, only gets fired when a user has sent a battle request,
  // and another user has accepted.
  socket.on('prepareForBattle', function() {
    // at this point, the opponent (i.e. the person who sent the initial battle
    // request) should be notified that the person he/she challenged has
    // accepted.
    console.log('prepare for battle');

    // on this notification, the url hash needs to be generated and sent to the
    // opponent.
    
    
    // the url hash needs to also be sent to the player who accepted the
    // challenge
  });
  
});