// var roomModel = require('../room/roomModel.js');

module.exports = function(socket, io, socketList){
  
  // look for signal that someone wants to battle
  socket.on('outgoingBattleRequest', function(users){

    var oppId = socketList[users.toUser].id;

    socket.broadcast.to(oppId).emit('incomingBattleRequest', {
      fromUser: users.fromUser
    });
  });

  // look for signal that a battle has been accepted
  socket.on('battleAccepted', function(users) {
    var opponentId = socketList[users.opponent];

    // now, need to broadcast to the opponent that it's time for battle
    socket.broadcast.to(opponentId).emit('prepareForBattle');
  });

};