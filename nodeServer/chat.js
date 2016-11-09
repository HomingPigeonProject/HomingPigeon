/** 
 * Server based chat
 */

/* User operations
 * name               arguments
 * sendMessage        groupId, 
 */

/* User events 
 * name
 * newMessage
 * memberJoin
 * memberLeave
 * memberInvited
 * memberExit
 */

var init = function(user) {
};

var chatRoomProto = {
	groupId: undefined,
	
	onlineMembers: null, // list of online users
	
	getRoomName: function() {
		return this.groupId.toString();
	},
	
	getMemberNum: function() {
		return this.onlineMembers.length; 
	},
	
	// returns list of user connections
	//console.log(server.io.sockets.adapter.rooms);
	//var room = server.io.sockets.adapter.rooms[this.getRoomName()];
	
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
		this.broadcast(user, 'newMessage', message);
		
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
	
	// user broadcasts message to other users
	// assumed the user is member of this group
	broadcast: function(user, name, message) {
		user.broadcast.to(this.getRoomName()).emit(name, message);
	},
	
	printMembers: function() {
		var members = this.onlineMembers;
		console.log('print group members');
		for (var i = 0; i < members.length; i++) {
			console.log('group' + this.groupId + ': (' + 
					members[i].userId + ') ' + members[i].email);
		}
	},
	
	join: function(data, callback) {
		var user = data.user;
		var chatRoom = this;
		var onlineMembers = this.onlineMembers;
		
		user.join(this.getRoomName(), function(err) {
			if (err)
				callback(err);
			else {
				onlineMembers.push(user);
				user.chatRooms.push(chatRoom);
				
				// notify users
				chatRoom.broadcast(user, 'memberJoin',
						{groupId: chatRoom.groupId, session: user.id, 
					member: lib.filterUserData(user)});
				
				chatRoom.printMembers();
				
				callback(null);
			}
		});
	},
	
	leave: function(data, callback) {
		var user = data.user;
		var chatRoom = this;
		var onlineMembers = this.onlineMembers;
		
		user.leave(this.getRoomName(), function(err) {
			if (err)
				callback(err);
			else {
				var memberIndex = onlineMembers.indexOf(user);
				var chatRoomIndex = user.chatRooms.indexOf(chatRoom);
				onlineMembers.splice(memberIndex, 1);
				user.chatRooms.splice(chatRoomIndex, 1)
				
				// notify users
				chatRoom.broadcast(user, 'memberLeave',
						{groupId: chatRoom.groupId, session: user.id, 
					member: lib.filterUserData(user)});
				
				callback(null);
			}
		});
	},
	
	// join chat and notify other members
	invited: function(data, callback) {
		var user = data.user;
		var chatRoom = this;
		var members = this.onlineMembers;
		var sessions;
		
		if (!(sessions = session.getUserSessions(user.userId)) ||
				!sessions.length)
			throw Error('user session get failed, but user is alive');
		
		// TODO: include ack start
		var sendMsg = {groupId: chatRoom.groupId, member: lib.filterUserData(user)}
		
		this.join({user: user}, function(err) {
			if (err)
				callback(err);
			else {
				// notify new member
				for (var i = 0; i < members.length; i++) {
					var member = members[i];
					
					// don't nofity invited user
					if (sessions.indexOf(member) >= 0)
						continue;
					
					member.emit('memberInvited', sendMsg);
				}
				
				callback(null);
			}
		});
	},
	
	// user exits for every session and notify other members
	exit: function(data, callback) {
		var user = data.user;
		var ackStart = data.ackStart;
		var ackEnd = data.ackEnd;
		var chatRoom = this;
		var sessions;
		
		if (!(sessions = session.getUserSessions(user.userId)) ||
				!sessions.length)
			throw Error('user session get failed, but user is alive');
		
		// leave group and notify users
		var exitIter = function(i) {
			if (i == sessions.length) {
				// notify users
				// TODO: include user ack information(start, end)
				chatRoom.broadcast(user, 'memberExit',
						{groupId: chatRoom.groupId, member: lib.filterUserData(user)});
				
				return callback(null);
			}
			
			chatRoom.leave(data, function(err) {
				if (err)
					callback(err);
				else {
					exitIter(i + 1);
				}
			});
		};
		
		exitIter(0);
	},
};

// chat room constructor
var chatRoom = function() {
	// constructor
	this.init = function(data) {
		this.groupId = data.groupId;
		this.onlineMembers = [];
		
		return this;
	}
};

chatRoom.prototype = chatRoomProto;

var createChatRoom = function (data) {
	return new chatRoom().init(data);
};

module.exports = {init: init,
		createChatRoom: createChatRoom};

var session = require('./session');
var dbManager = require('./dbManager');
var group = require('./group');
var server = require('./appServer');
var lib = require('./lib');
var async = require('async');