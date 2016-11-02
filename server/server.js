/*var app = require('express');
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
*/

var app = require('express')();
app.set('port', process.env.PORT || 3000);
var server = require('http').createServer(app);
var io = require('socket.io')(server);
server.listen(app.get('port'));

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
    getPseudoList : function(){
        var conn = [];
        this.connected.forEach(function(data){
                conn.push(data.pseudo);
        });
        return conn;
    },
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

io.on('connection', function(socket){
  console.log("socket.io connection.....");
    socket.on('Pseudo', function (pseudo){
      //socket.set('pseudo', data);
      connectedLobby.push({pseudo:pseudo, id:socket.id});
    });
    socket.on('message', function(message){
        var pseudo = connectedLobby.getPseudoById(socket.id);
        console.log("user " + pseudo + " send this : " + message );
        var data = { 'message' : message, pseudo : 'pseudo'};
        socket.broadcast.emit('message',data);
        /*socket.get('pseudo',function(error, name){
        });*/
    });
});

console.log("listening....");
/*
server.listen(3000, function(){
  console.log('listening on 3000');
});
*/
