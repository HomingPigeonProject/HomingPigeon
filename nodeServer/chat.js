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
 * membersJoin
 * membersLeave
 * messageAck
 * messageAckUndo
 */

var init = function(user) {
};

var chatRoomProto = {
	groupId: undefined,
	
	// array of online users
	// users in here and joined users are same set 
	onlineMembers: null, 
	
	getRoomName: function() {
		return this.groupId.toString();
	},
	
	getMemberNum: function() {
		return this.onlineMembers.length; 
	},
	
	// returns list of user connections
	//console.log(server.io.sockets.adapter.rooms);
	//var room = server.io.sockets.adapter.rooms[this.getRoomName()];
	
	// user broadcasts message to other users
	// assumed the user is member of this group
	broadcast: function(user, name, message) {
		user.broadcast.to(this.getRoomName()).emit(name, message);
	},
	
	// broadcast every user in room
	broadcastAll: function(name, message) {
		server.io.sockets.in(this.getRoomName()).emit(name, message);
	},
	
	// same as broadcast but filter user will get message by 'filter' function
	broadcastFilter: function(filter, name, message) {
		var members = this.onlineMembers;
		
		for (var i = 0; i < members.length; i++) {
			var member = members[i];
			
			if (filter(member))
				continue;
			
			member.emit(name, message);
		}
	},
	
	// broadcast message to all other members
	// input: data.user, data.content, data.importance, data.location
	sendMessage: function(data, callback) {
		var user = data.user;
		var messageId = data.messageId;
		var nbread = data.nbread;
		var content = data.content || '';
		var importance = data.importance || 0;
		var location = data.location;
		var date = data.date;
		
		var message = {groupId: this.groupId, messageId: messageId, 
				userId: user.userId, content: content, importance: importance,
				location: location, date: date, nbread: nbread};
		
		// broadcast message to all other users in chat
		this.broadcast(user, 'newMessage', message);
		
		callback(null);
	},
	
	// send ack to all user except users
	sendAck: function(data, callback) {
		var users = data.users;
		var user = data.user;
		var ackStart = data.ackStart || null;
		var ackEnd = data.ackEnd || null;
		
		var message = {groupId: this.groupId, userId: user.userId,
				ackStart: ackStart, ackEnd: ackEnd};
		
		// broadcast
		this.broadcastFilter(function(user) {
			if (users.indexOf(user) >= 0)
				return true;
			
			return false;
		}, 'messageAck', message);
		
		callback(null);
	},
	
	// send undo ack to all users
	// all sender user sessions must have left chat room
	undoAcks: function(data, callback) {
		var user = data.user;
		var acks = data.acks;
		var chatRoom = this;
		var i = 0;
		
		if (acks.length == 0)
			return callback(null);
		
		acks.forEach(function(ack) {
			var message = {groupId: this.groupId, userId: user.userId,
					ackStart: ack.ackStart, ackEnd: ack.ackEnd};
			
			// broadcast message to all users
			chatRoom.broadcastAll('messageAckUndo', message);
			
			i++;
			if(i == acks.length)
				callback(null);
		});
	},
	
	printMembers: function() {
		var members = this.onlineMembers;
		console.log('print group members');
		for (var i = 0; i < members.length; i++) {
			console.log('group' + this.groupId + ': (' + 
					members[i].userId + ') ' + members[i].email);
		}
	},
	
	// input: data.users
	// output: errSessions(if error, is list of sessions failed, otherwise null)
	join: function(data, callback) {
		var sessions = data.users;
		var chatRoom = this;
		var onlineMembers = this.onlineMembers;
		var errSessions = [];
		
		var joinIter = function(i) {
			if (i == sessions.length) {
				// notify users
				chatRoom.broadcastFilter(function(user) {
					if (sessions.indexOf(user) >= 0)
						return true;
					
					return false;
				},
				'membersJoin',
				{groupId: chatRoom.groupId, members: lib.filterUsersData(sessions)});
				
				chatRoom.printMembers();
				
				if (errSessions.length == 0)
					return callback(null, null);
				else
					return callback(null, errSessions);
			}
			
			var user = sessions[i];
			
			if (onlineMembers.indexOf(user) >= 0)
				return joinIter(i + 1);
			
			user.join(chatRoom.getRoomName(), function(err) {
				if (err) {
					errSessions.push(user);
				} else {
					errSessions.push(user);
					onlineMembers.push(user);
					user.chatRooms.push(chatRoom);
					
					joinIter(i + 1);
				}
			});
		};
		
		joinIter(0);
	},
	
	// input: data.users
	// output: errSessions(if error, is list of sessions failed, otherwise null)
	leave: function(data, callback) {
		var sessions = data.users;
		var chatRoom = this;
		var onlineMembers = this.onlineMembers;
		var errSessions = [];
		
		var leaveIter = function(i) {
			if (i == sessions.length) {
				// notify users
				chatRoom.broadcastAll('membersLeave',
						{groupId: chatRoom.groupId, members: lib.filterUsersData(sessions)});
				
				chatRoom.printMembers();
				
				if (errSessions.length == 0)
					return callback(null, null);
				else
					return callback(null, errSessions);
			}
			
			var user = sessions[i];
			
			if (onlineMembers.indexOf(user) < 0)
				return leaveIter(i + 1);
			
			user.leave(chatRoom.getRoomName(), function(err) {
				if (err) {
					errSessions.push(user);
				} else {
					var memberIndex = onlineMembers.indexOf(user);
					var chatRoomIndex = user.chatRooms.indexOf(chatRoom);
					
					onlineMembers.splice(memberIndex, 1);
					user.chatRooms.splice(chatRoomIndex, 1)
					
					leaveIter(i + 1);
				}
			});
		};
		
		leaveIter(0);
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