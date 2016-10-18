/*var app = require('express');
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
*/

var app = require('express')();
app.set('port', process.env.PORT || 3000);
var server = require('http').createServer(app);
var io = require('socket.io')(server);
server.listen(app.get('port'));

io.on('connection', function(socket){
    socket.on('pseudo', function (data){
      socket.set('pseudo', data);
    });
    socket.on('message', function(message){
        socket.get('pseudo',function(error, name){
            var data = { 'message' : message, pseudo : name};
            socket.broadcast.emit('message',data);
            console.log("user" + name + "send this " + message);
        });
    });
});

/*
server.listen(3000, function(){
  console.log('listening on 3000');
});
*/
