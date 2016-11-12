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

// TODO: join, invited method must get list of users intead of one
//       so that invited or joined users don't get notification among them
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
	
	// broadcast message to all other members
	// input: data.user, data.content, data.importance, data.location
	sendMessage: function(data, callback) {
		var user = data.user;
		var content = data.content || '';
		var importance = data.importance || 0;
		var location = data.location;
		
		var message = {groupId: this.groupId, userId: user.userId,
				content: content, importance: importance, location: location};
		
		// broadcast message to all other users in chat
		this.broadcast(user, 'newMessage', message);
		
		callback(null);
	},
	
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
	
	printMembers: function() {
		var members = this.onlineMembers;
		console.log('print group members');
		for (var i = 0; i < members.length; i++) {
			console.log('group' + this.groupId + ': (' + 
					members[i].userId + ') ' + members[i].email);
		}
	},
	
	// input: data.users
	join: function(data, callback) {
		var users = data.users;
		var chatRoom = this;
		var onlineMembers = this.onlineMembers;
		
		var joinIter = function(i) {
			if (i == users.length) {
				// notify users
				chatRoom.broadcastFilter(function(user) {
					if (users.indexOf(user) >= 0)
						return true;
					
					return false;
				},
				'membersJoin',
				{groupId: chatRoom.groupId, members: lib.filterUsersData(users)});
				
				chatRoom.printMembers();
				
				return callback(null);
			}
			
			var user = users[i];
			
			if (onlineMembers.indexOf(user) >= 0)
				return joinIter(i + 1);
			
			user.join(chatRoom.getRoomName(), function(err) {
				// ignore errors
				if (err)
					joinIter(i + 1);
				else {
					onlineMembers.push(user);
					user.chatRooms.push(chatRoom);
					
					joinIter(i + 1);
				}
			});
		};
		
		joinIter(0);
	},
	
	// input: data.users
	leave: function(data, callback) {
		var users = data.users;
		var chatRoom = this;
		var onlineMembers = this.onlineMembers;
		
		var leaveIter = function(i) {
			if (i == users.length) {
				// notify users
				chatRoom.broadcastAll('membersLeave',
						{groupId: chatRoom.groupId, members: lib.filterUsersData(users)});
				
				chatRoom.printMembers();
				
				return callback(null);
			}
			
			var user = users[i];
			
			if (onlineMembers.indexOf(user) < 0)
				return leaveIter(i + 1);
			
			user.leave(chatRoom.getRoomName(), function(err) {
				if (err)
					leaveIter(i + 1);
				else {
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
	
	// join chat and notify other members
	// input: data.users
	joinInvited: function(data, callback) {
		var users = data.users;
		var chatRoom = this;
		var members = this.onlineMembers;
		var sessions = session.getUsersSessions(users, true);
		
		var ackStart = data.ackStart;
		
		// TODO: include ack start
		var sendMsg = {groupId: chatRoom.groupId, members: lib.filterUsersData(users)}
		
		async.waterfall([
			function(callback) {
				chatRoom.join(data, callback);
			}
		],
		function(err) {
			chatRoom.broadcastFilter(function(user) {
				// don't send to invited users
				if (users.indexOf(user) >= 0)
					return true;
				
				// don't send to other sessions of invited users
				if (sessions.indexOf(user) >= 0)
					return true;
				
				return false;
			},
			'membersInvited',
			sendMsg);
			
			callback(null);
		});
	},
	
	// user exits for every session and notify other members
	// input: data.users
	exit: function(data, callback) {
		var users = data.users;
		var chatRoom = this;
		var sessions = session.getUsersSessions(users, true);
		
		var ackStart = data.ackStart;
		var ackEnd = data.ackEnd;
		
		// TODO: include user ack information(start, end)
		var sendMsg = {groupId: chatRoom.groupId, members: lib.filterUsersData(users)};
		
		async.waterfall([
			function(callback) {
				chatRoom.leave(data, callback);
			}
		],
		function(err) {
			chatRoom.broadcastAll('membersExit', sendMsg);
			
			callback(null);
		});
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