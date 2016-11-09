/**
 * Chat manager
 * user can join or exit contact chat, group chat, conference
 */

var rbTree = require('./RBTree');

// set of active chats
var allChatRoom = rbTree.createRBTree();

/* User operations
 * name               arguments
 * joinContactChat    userId(id of contact)
 * joinGroupChat      groupId
 */
var init = function(user) {
	user.on('joinContactChat', function(data) {
		if (!session.validateRequest('joinContactChat', user, true, data))
			return;
		
	});
	
	user.on('joinGroupChat', function(data) {
		if (!session.validateRequest('joinGroupChat', user, true, data))
			return;
		
	});
	
	user.on('readMessage', function(data) {
		
	});
	
	user.on('sendMessage', function(data) {
		
	});
	
	user.on('ackMessage', function(data) {
		
	});
};

// init user when logined
var initUser = function(user, callback) {
	user.chatRooms = [];
	
	// when logined, user will get group list and
	// automatically join all chatRooms
	dbManager.trxPattern([
		function(callback) {
			group.getGroup({user: user, db: this.db}, callback);
		},
		function(groups, callback) {
			var db = this.db;
			this.data.groups = groups;
			
			var joinGroupIter = function(i) {
				var group = groups[i];
				
				if (i == groups.length)
					return callback(null);
				
				async.waterfall([
					function(callback) {
						joinGroupChat({users: [user], groupId: group.groupId, 
							db: db}, callback);
					}
				],
				function(err) {
					if (err) {
						console.log('failed to join chat' + err);
						throw err;
					} else {
						joinGroupIter(i + 1);
					}
				});
			};
			
			joinGroupIter(0);
		},
		function(callback) {
			user.emit('getGroupList', {status: 'success', groups: this.data.groups});
			
			callback(null);
		}
	],
	function(err) {
		if (err) {
			// can't fail currently
			console.log('failed to join chat'+ err);
			
			callback(err);
		} else {
			callback(null);
		}
	});
};

var joinGroupChat = function(data, callback) {
	var pattern;
	
	var users = data.users;
	var groupId = data.groupId;
	
	if (data.trx)
		pattern = dbManager.trxPattern;
	else
		pattern = dbManager.atomicPattern;
	
	pattern([
		function(callback) {
			// get active chat
			var chatRoom = allChatRoom.get(groupId);
			
			if (!chatRoom) {
				chatRoom = chat.createChatRoom({groupId: groupId});
				
				if (!allChatRoom.add(groupId, chatRoom))
					return callback(new Error('Failed to open chat'));
			}
			
			this.data.chatRoom = chatRoom;
			this.data.members = chatRoom.onlineMembers;
			
			callback(null);
		},
		// add users to group chat
		function(callback) {
			var db = this.db;
			var members = this.data.members;
			var chatRoom = this.data.chatRoom;
			
			var joinIter = function(i) {
				if (i == users.length)
					return callback(null);
				
				var user = users[i];
				
				async.waterfall([
					function(callback) {
						db.getGroupMember({groupId: groupId, userId: user.userId},
								callback);
					},
					function(result, fields, callback) {
						if (result.length == 0)
							return callback(new Error('You are not member of group or' +
														' no such group'));
						
						if (members.indexOf(user) >= 0)
							return callback(new Error('Already joined'));
						
						// join room and notify members
						chatRoom.invited({user: user}, callback);
					},
					function(callback) {
						// read at most 100 messages
						//this.data.chatRoom.getRecentMessages({nbMessage: 100}, callback);
						callback(null);
					}
				],
				function(err) {
					if (err)
						callback(err);
					else
						joinIter(i + 1);
				});
			}
			
			joinIter(0);
		},
	],
	function(err) {
		if (err) {
			callback(err);
		} else {
			callback(null);
		}
	},
	{db: data.db});
};

// when user leaves group
var leaveGroupChat = function(data, callback) {
	var pattern;
	
	var user = data.user;
	var groupId = data.groupId;
	
	if (data.trx)
		pattern = dbManager.trxPattern;
	else
		pattern = dbManager.atomicPattern;
	
	pattern([
		// check if the user is group member
		function(callback) {
			this.db.getGroupMember({groupId: groupId, userId: user.userId},
					callback);
		},
		function(result, fields, callback) {
			if (result.length == 0)
				return callback(new Error('You are not member of group or' +
											' no such group'));
			
			// get active chat
			var chatRoom = allChatRoom.get(groupId);
			
			var members = chatRoom.onlineMembers;
			
			// no active chatRoom or user did not join
			if (!chatRoom || members.indexOf(user) < 0) {
				return callback(null);
			}
			
			this.data.chatRoom = chatRoom;
			
			chatRoom.leave({user: user}, callback);
		},
			// read at most 100 messages
			//this.data.chatRoom.getRecentMessages({nbMessage: 100}, callback);
		function(callback) {
			callback(null);
		}
	],
	function(err) {
		if (err) {
			callback(err);
		} else {
			callback(null);
		}
	},
	{db: data.db});
};

// when user disconnects, exit from every chats
var leaveAllGroupChat = function(data) {
	var user = data.user;
	var chatRooms = user.chatRooms;
	
	if (!user || !chatRooms)
		return;
	
	for (var i in chatRooms) {
		var chatRoom = chatRooms[i];
		
		chatRoom.leave({user: data.user}, function(err) {
			if (err)
				throw Error('chat room leave failed!');
			
			// if no online members, remove chat
			if (chatRoom.getMemberNum() == 0 &&
					!removeGroupChat(chatRoom))
				throw Error('chat room remove failed!');
				
		});
	}
	
	console.log('exited every group');
};

// when number of online member in group is 0,
// remove group chat
var removeGroupChat = function(chatRoom) {
	if (!allChatRoom.remove(chatRoom.groupId))
		return false;
	
	return true;
};

module.exports = {init: init,
		initUser: initUser,
		joinGroupChat: joinGroupChat,
		leaveGroupChat: leaveGroupChat,
		leaveAllGroupChat: leaveAllGroupChat};

var session = require('./session');
var dbManager = require('./dbManager');
var group = require('./group');
var chat = require('./chat');
var async = require('async');