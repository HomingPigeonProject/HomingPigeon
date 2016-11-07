/** 
 * Server based chat
 */

var session = require('./session');
var dbManager = require('./dbManager');
var group = require('./group');
var server = require('./appServer');

/* User operations
 * name               arguments
 * sendMessage        groupId, 
 */

/* User events 
 * name
 * newMessage
 */

var init = function(user) {
};

var chatRoomProto = {
	groupId: undefined,
	
	getRoomName: function() {
		return this.groupId.toString();
	},
	
	// returns list of user connections
	getMembers: function() {
		return server.io.sockets.clients(this.getRoomName());
	},
	
	// get recent message 
	// data.nbMessage : number of messages to retrieve 
	getRecentMessages: function(data, callback) {
		var user = data.user;
		
		data.groupId = this.groupId;
		
		dbManager.atomicPattern([
			function(callback) {
				this.db.getRecentMessages(data, callback);
			}
		],
		function(err, result) {
			if (err) {
				callback(err);
			} else {
				callback(null, result);
			}
		});
	},
	
	putMessage: function(data, callback) {
		var user = data.user;
		var content = data.content;
		var importance = data.importance || 0;
		var location = data.location;
		
		var message = {groupId: this.groupId, userId: user.userId,
				content: content, importance: importance, location: location};
		
		// broadcast message to all other users in chat
		user.to(this.getRoomName()).emit('newMessage', message);
		
		dbManager.atomicPattern([
			function(callback) {
				this.db.addMessage(message, callback);
			}
		],
		function(err, result) {
			if (err) {
				console.log('failed to save message\r\n' + err);
				
				callback(err);
			} else {
				callback(null);
			}
		});
	},
	
	join: function(data, callback) {
		var user = data.user;
		
		user.join(this.getRoomName(), function(err) {
			if (err)
				callback(err);
			else {
				callback(null);
			}
		});
	},
	
	leave: function(data, callback) {
		var user = data.user;
		
		user.leave(this.getRoomName(), function(err) {
			if (err)
				callback(err);
			else {
				callback(null);
			}
		});
	},
	
	
};

// chat room constructor
var chatRoom = function() {
	// constructor
	this.init = function(data) {
		this.groupId = data.groupId;
		
		return this;
	}
};

chatRoom.prototype = chatRoomProto;

var createChatRoom = function (data) {
	return new chatRoom().init(data);
};

module.exports = {init: init,
		createChatRoom: createChatRoom};
