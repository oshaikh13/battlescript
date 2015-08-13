module.exports = function(socket, io, roomModel){
  var username = socket.handshake.query.username;
  console.log('connected');

  var joinedRoom = roomModel.createOrGetRoom();
  joinedRoom.users.push(username);
  console.log("CURRENT STATE OF ROOMS: ", roomModel.rooms);
  console.log("I JUST JOINED :", joinedRoom);
  console.log("Joined room ID :", joinedRoom.id);
  console.log("Total number of rooms: ", roomModel.rooms.roomCount);
  // Join a room
  socket.join(joinedRoom.id);
  // Increment members
  // joinedRoom.members++;

  // Save the room. Save it with the count (its like a key)
  roomModel.updateRooms(joinedRoom);

  // Emit array of all users to a room when someone joins
  socket.in(joinedRoom.id).emit('userJoined', joinedRoom.users);


  socket.on('updateUsers', function(){
    setTimeout(function(){
      io.in(joinedRoom.id).emit('userList', joinedRoom.users);
    }, 40);
  });

  socket.on('textChange', function(data){
    socket.broadcast.to(joinedRoom.id).emit('updateEnemy', data);
  });

  // I catch the disconnected client. What I do is 'remove' the memeber from the room
  // I also delete it if there are no people in the room
  // and save it if ppl remain.

  // The magic in this method is that the client is never really "disconnected..."
  // He's just moving from room to room. Or no room at all...

  socket.on('disconnectedClient', function(data){

    console.log(data.username, ' DISCONECTED FROM ROOM: ', joinedRoom.id);

    joinedRoom.members--;
    joinedRoom.users.splice(joinedRoom.users.indexOf(data.username),1); // remove user from user array
    console.log("NEW USER LIST: ", joinedRoom.users);

    if (joinedRoom.members === 0) {
      roomModel.removeRoom(joinedRoom.id);
      roomModel.rooms.roomCount -=1;
    } else {
      roomModel.updateRooms(joinedRoom.id);
    }

  });


  ////////////////////////////////////////////////////////////
  // handle and emit player ready events
  ////////////////////////////////////////////////////////////

  socket.on('playerOneReady', function() {
    socket.broadcast.to(joinedRoom.id).emit('playerTwoReady');
  });
}