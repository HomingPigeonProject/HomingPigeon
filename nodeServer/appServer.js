/** 
 * HomingPigeon application server entry point 
 **/
var async = require('async');
var dbManager = require('./dbManager');
var session = require('./session');
var contact = require('./contact');
var group = require('./group');
var chat = require('./chat');
var event = require('./event');

// initialize server
var app = require('express')();
app.set('port', process.env.PORT || 4000);
var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.get('/', function(req, res){
	  res.send('<h1>Hello world</h1>');
	});

// initialize user connection
io.on('connection', function(user) {
	console.log('user connected');
	
	user.on('disconnect', function() {
		if (!session.logined(user)) {
			console.log('anonymous user ' + user.id + ' disconnected');
		} else {
			console.log('user ' + user.userId + ' disconnected');	
		}
	});
	
	session.init(user);
	contact.init(user);
	group.init(user);
	
});

// listen for users
server.listen(app.get('port'));
console.log('Server is listening to port ' + app.get('port') + '...');