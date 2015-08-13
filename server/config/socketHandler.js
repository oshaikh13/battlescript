var roomModel = require('../room/roomModel.js');
var userController = require('../users/userController.js');
var battleSocketHandler = require('../config/battleSocketHandler.js');
var dashboardSocketHandler = require('../config/dashboardSocketHandler.js')


module.exports = function(socket, io){

  var offlineUser = function(){
    delete userController.currentUsers[socket.handshake.query.username];
    socket.emit('updateUsers');
    socket.broadcast.emit('updateUsers');
  }

  var addUser = function(){
    userController.currentUsers[socket.handshake.query.username] = {username: socket.handshake.query.username, id: socket.id};
    socket.emit('updateUsers'); //to urslef
    socket.broadcast.emit('updateUsers'); //to everyone
  }


  addUser();

  socket.on('online', function(){
    addUser();
  })

  socket.on('disconnect', function(){
    offlineUser();
  })

  socket.on('logout', function(){
    offlineUser();
  })


  socket.on('matchReady', function(){
    battleSocketHandler(socket, io, roomModel);
  });

  socket.on('dashListen', function(){
    dashboardSocketHandler(socket, io, userController.currentUsers);
  })


};


