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
 * joinConference     ??
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
	
	// maybe we don't need this function
	user.on('joinConference', function(data) {
		if (!session.validateRequest('joinContactChat', user, true, data))
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
						joinGroupChat({user: user, groupId: group.groupId, 
							db: db, trx: false}, callback);
					}
				],
				function(err) {
					if (err) {
						console.log('failed to join chat' + err);	
					}
						
					// ignore fail, but this may cause problem
					joinGroupIter(i + 1);
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
			
			if (!chatRoom) {
				chatRoom = chat.createChatRoom({groupId: groupId});
				
				if (!allChatRoom.add(groupId, chatRoom))
					return callback(new Error('Failed to open chat'));
			}
			
			var members = chatRoom.onlineMembers;
			
			if (members.indexOf(user) >= 0)
				return callback(new Error('Already joined'));
			
			this.data.chatRoom = chatRoom;
			
			chatRoom.join({user: user}, callback);
		},
			// read at most 100 messages
			//this.data.chatRoom.getRecentMessages({nbMessage: 100}, callback);
		function(callback) {
			// notify members
			
			callback(null);
		}
	],
	function(err, result) {
		if (err) {
			callback(err);
		} else {
			callback(null);
		}
	});
};

// when user exits group
var exitGroupChat = function(data) {
	
};

// when user disconnects, exit from every chats
var exitAllGroupChat = function(data) {
	var user = data.user;
	var chatRooms = user.chatRooms;
	
	if (!user || !chatRooms)
		return;
	
	for (var i in chatRooms) {
		var chatRoom = chatRooms[i];
		
		chatRoom.leave({user: data.user}, function(err) {
			if (err)
				console.log('chat leave failed! memory leak');
		});
	}
	
	console.log('exit every group');
};

// when number of online member in group is 0,
// remove group chat
var removeGroupChat = function(data) {
};

module.exports = {init: init,
		initUser: initUser,
		joinGroupChat: joinGroupChat,
		exitGroupChat: exitGroupChat,
		exitAllGroupChat: exitAllGroupChat,
		removeGroupChat: removeGroupChat};

var session = require('./session');
var dbManager = require('./dbManager');
var group = require('./group');
var chat = require('./chat');
var async = require('async');