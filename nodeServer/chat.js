/** 
 * Server based chat
 */

var session = require('./session');
var dbManager = require('./dbManager');
var group = require('./group');
var async = require('async');

/* User operations
 * name               arguments
 * sendMessage        groupId, 
 */
var init = function(user) {
	user.on('sendMessage', function(data) {
		
	});
}

var chatRoomProto = {
	groupId: undefined,
	activeMembers: [],    // active members in group
	sendMessage: function(user, content, importance, location, callback) {
		var db;
		async.waterfall([
			function(callback) {
				dbManager.getConnection(callback);
			},
			function(result, callback) {
				db = result;
				db.beginTransaction(callback);
			},
			function(result, fields, callback) {
				db.addMessage({groupId: this.groupId, userId: user.userId,
					content: content, importance: importance, location: location},
					callback);
			}
		],
		function(err, result) {
			if (err) {
				if (db) {
					db.rollback(function() {
						db.release();
					});
				}
				
				console.log('failed to process message list\r\n' + err);
				callback(err);
			}
			
			if (db)
				db.release();
			
			// broadcast message to all other users in chat
			user.to(this.groupId.toString()).emit('newMessage', 
					{groupId: this.groupId, userId: user.userId,
						content: content, importance: importance, location: location});
			
			callback(null);
		});
	}
};

// chat room constructor
var chatRoom = function(data) {
	this.groupId = data.groupId;
}

chatRoom.prototype = chatRoomProto;

var createChatRoom = function (data) {
	return new chatRoom(data);
}

module.exports = {init: init,
		createChatRoom: createChatRoom};
