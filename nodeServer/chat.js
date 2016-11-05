/** 
 * Server based chat
 */

var session = require('./session');
var dbManager = require('./dbManager');
var group = require('./group');
var async = require('async');

/* User operations
 * name               arguments
 * getGroupList       
 * addGroup           name, members(array of email)
 * inviteGroupMembers groupId, members(array of email)
 * exitGroup          groupId
 */
var init = function(user) {
	
}

var chatRoomProto = {
	groupId: undefined,
	activeMembers: [],    // active members in group
	sendMessage: function(user, content, importance, location) {
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
				db.addMessage({groupId: this.groupId, accountId: user.userId,
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
				return user.to(this.groupId.toString()).emit(
						'getGroupList', {status: 'fail', errorMsg:'server error'});
			}
			
			if (db)
				db.release();
			
			user.emit('getGroupList', {status: 'success', groups: result});
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
