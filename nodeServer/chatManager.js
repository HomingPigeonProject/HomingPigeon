/**
 * Chat manager
 * user can join or exit contact chat, group chat, conference
 */

var session = require('./session');
var dbManager = require('./dbManager');
var rbTree = require('./RBTree');
var group = require('./group');
var async = require('async');

// set of active chats
var allChats = rbTree.createRBTree();

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
		if (!session.validateRequest('joinContactChat', user, true, data))
			return;
		
	});
	
	// maybe we don't need this function
	user.on('joinConference', function(data) {
		if (!session.validateRequest('joinContactChat', user, true, data))
			return;
		
	});
}

var joinGroupChat = function(data) {
	
	var user = data.user;
	var groupId = data.groupId;
	
	async.waterfall([
		function(callback) {
			dbManager.getConnection(callback);
		},
		function(result, callback) {
			db = result;
			db.beginTransaction(callback);
		},
		// check if the user is group member
		function(result, fields, callback) {
			db.getGroupMember({groupId: groupId, userId: user.userId},
					callback);
		},
		function(result, fields, callback) {
			if (result.length == 0)
				return callback(new Error('You are not member of group or' +
											' no such group'));
			
			// get active chat
			var chat = allChats.get(groupId); 
			
			if (!chat) {
				if (!allChats.add())
					callback(new Error('Failed to open chat'));
			}
		}
	],
	function(err, result) {
		
	});
}

var exitGroupChat = function(data) {
	
}

var exitAllGroupChat = function(data) {
	
}

var removeGroupChat = function(data) {
	
}

module.exports = {init: init};