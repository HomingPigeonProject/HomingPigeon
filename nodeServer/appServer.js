/**
 * HomingPigeon application server entry point
 **/

// initialize server

var fs = require('fs');

var options = {
  key: fs.readFileSync('ssl/file.pem'),
  cert: fs.readFileSync('ssl/file.crt'),
  requestCert: false,
  rejectUnauthorized: false
};


var app = require('express')();
app.set('port', process.env.PORT || 4000);

var server = require('https').createServer(options, app);
var io = require('socket.io')(server);

module.exports = {io: io, server: server, app: app};

var async = require('async');
var dbManager = require('./dbManager');
var contact = require('./contact');
var session = require('./session');
var group = require('./group');
var event = require('./event');
var chatManager = require('./chatManager');
var chat = require('./chat');

app.get('/', function(req, res){
	res.send('<h1>Hello world</h1>');
});

//initialize user connection
io.on('connection', function(user) {
	console.log('user connected');

	session.init(user);
	contact.init(user);
	group.init(user);
	chatManager.init(user);
});