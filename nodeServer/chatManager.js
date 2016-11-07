/**
 * Chat manager
 * user can join or exit contact chat, group chat, conference
 */

var session = require('./session');
var dbManager = require('./dbManager');
var rbTree = require('./RBTree');
var group = require('./group');
var chat = require('./chat');
var async = require('async');

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
var initUser = function(user) {
	user.chatRooms = [];
	
	// when logined, user will get group list and
	// automatically join all chatRooms
	dbManager.trxPattern([
		function(callback) {
			group.getGroup({user: user, trx: false}, callback);
		},
		function(groups, callback) {
			this.data.groups = groups;
			
			var joinGroupIter = function(i) {
				if (i == groups.length)
					return callback(null);
				
				joinGroupChat({user: user, groupId: groups[i].groupId,
					db: this.db, trx: false}, callback);
			}
		},
		function(callback) {
			
		}
	],
	function(err) {
		if (err) {
			
		} else {
			
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
	
	dbManager.trxPattern([
		// check if the user is group member
		function(result, fields, callback) {
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
			
			var members = chatRoom.getMembers;
			
			if (members.indexOf(user) >= 0)
				return callback(new Error('Already joined'));
			
			this.data.chatRoom = chatRoom;
			
			chatRoom.join({user: user}, callback);
		},
		function(callback) {
			// read at most 100 messages
			//this.data.chatRoom.getRecentMessages({nbMessage: 100}, callback);
			
		},
		function(result, callback) {
			
		}
	],
	function(err, result) {
		
	});
};

var exitGroupChat = function(data) {
	
};

var exitAllGroupChat = function(data) {
	
};

var removeGroupChat = function(data) {
	
};

module.exports = {init: init};