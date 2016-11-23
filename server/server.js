/*var app = require('express');
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
*/

var app = require('express')();
app.set('port', process.env.PORT || 3000);
var server = require('http').createServer(app);
var io = require('socket.io')(server);
server.listen(app.get('port'));

var connectedUsers = {};
var connectedLobby = {
    connected : [],
    push : function (newConnected){
        if (typeof newConnected === 'object'
            && newConnected.id
            && newConnected.pseudo){
                this.connected.push(newConnected);
        }
    },
    remove : function(pseudo){
        var conn = [];
        this.connected.forEach(function(data){
           if(data.pseudo != pseudo){
               conn.push(data);
           }
        });
        this.connected = conn;
    },
    //not used
    getPseudoList : function(){
        var conn = [];
        this.connected.forEach(function(data){
                conn.push(data.pseudo);
        });
        return conn;
    },
    //not used
    getPseudoById: function(id){
        var conn = null;
        this.connected.forEach(function(data){
            if(data.id == id){
                conn = data.pseudo;
            }
        });
        return conn;
    }
}

io.sockets.on('connection', function(socket){
  console.log(connectedLobby.connected);
  console.log("socket.io connection");
    socket.on('Pseudo', function (pseudo){
      socket.set('pseudo', data);
      console.log("ahgag");
      connectedLobby.push({pseudo:pseudo, id:socket.id});
    });
    socket.on('message', function(message, id, date){
        var pseudo = "billy";//connectedLobby.getPseudoById(socket.id);
        console.log("user " + pseudo + " send this : " + message + " to : " + id); //message to message.text etc....
        var data = { 'message' : message, id : id, date: new Date().toString()};
        socket.broadcast.emit('messageReception',data);
      });
    //
        //test
    //
      socket.on("message", function(message, id, date) {
       io.emit("messageReception", {message: message, id: id, date: date});
      });
      //
          //end test
      //


        /*socket.get('pseudo',function(error, name){
        });*/
});

console.log("listening....");
/*
server.listen(3000, function(){
  console.log('listening on 3000');
});
*/
