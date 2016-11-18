/**
 * Chat manager
 * user can join or exit contact chat, group chat
 */

var rbTree = require('./RBTree');

// set of active chats
var allChatRoom = rbTree.createRBTree();

/* User operations
 * name               arguments
 * joinContactChat    email(of contact)
 * readMessage        groupId
 * sendMessage        groupId, content, importance, location
 */
var init = function(user) {
	user.on('joinContactChat', function(data) {
		if (!session.validateRequest('joinContactChat', user, true, data))
			return;
		console.log(data.email);
		dbManager.trxPattern([
			function(callback) {
				this.db.getUserByEmail({email: data.email, lock: true}, 
						callback);
			},
			function(result, fields, callback) {
				if (result.length == 0)
					return callback(new Error('no such user'));
				
				var contactId = result[0].userId;
				
				this.db.getAcceptedContact({userId: user.userId, 
					userId2: contactId, lock: true}, callback);
			},
			function(result, fields, callback) {
				if (result.length == 0)
					return callback(new Error('No such contact found'));
				
				var contact = result[0];
				var db = this.db;
				var data = this.data;
				
				// groupId cannot be 0
				if (contact.groupId) {
					// group already exists
					async.waterfall([
						function(callback) {
							db.getGroupOfUserById({groupId: contact.groupId, 
								userId: user.userId, lock: true}, callback);
						},
						function(result, fields, callback) {
							if (result.length == 0)
								return callback(new Error('failed to get group chat'));
							
							var group = result[0];
							data.group = group;
							
							db.getGroupMembers({groupId: group.groupId, lock: true},
									callback);
						},
						function(result, field, callback) {
							var group = data.group;
							
							group.members = lib.filterUsersData(result);
							
							callback(null);
						}
					],
					function(err) {
						callback(err);
					});
					
				} else {
					// create new group for contact
					async.waterfall([
						function(callback) {
							group.startNewGroup({user: user, members: [contact.email],
								trx: false, db: db}, callback);
						},
						function(group, callback) {
							data.group = group;
							
							db.updateContactGroupChat({contactId: contact.contactId, 
								groupId: group.groupId}, callback);
						},
						function(result, fields, callback) {
							if (result.affectedRows == 0)
								return callback(new Error('failed to update contact'));
							
							console.log(group.members);
							
							callback(null);
						}
					],
					function(err) {
						callback(err);
					});
				}
			},
			function(callback) {
				var group = this.data.group;
				var sessions = session.getUsersSessions(group.members);
				
				var sendMsg = lib.filterGroupData(group);
				sendMsg.status = 'success';
				
				// let user know the new group for contact
				for (var i = 0; i < sessions.length; i++) {
					var s = sessions[i];
					
					s.emit('joinContactChat', sendMsg);
				}
				
				callback(null);
			}
		],
		function(err) {
			if (err) {
				console.log(err);
				user.emit('joinContactChat', {status: 'fail', errorMsg: 'server error'});
			}
		});
	});
	
	user.on('readMessage', function(data) {
		if (!session.validateRequest('readMessage', user, true, data))
			return;
		
		var groupId = data.groupId;
		var nbMessageMax = 100;
		
		dbManager.trxPattern([
			function(callback) {
				// check if the user is member of the group
				this.db.getGroupMemberByUser({groupId: groupId, userId: user.userId,
					lock: true}, callback);
			},
			function(result, fields, callback) {
				if (result.length == 0)
					return callback(new Error('You are not member of the group'));
				
				// get at most 100 messages
				this.db.getRecentMessages({groupId: groupId, nbMessages: nbMessageMax,
					lock: true}, callback);
			}
		],
		function(err, result) {
			if (err) {
				user.emit('readMessage', {status: 'fail', errorMsg: 'server error'});
			} else {
				user.emit('readMessage', {status: 'success', messages: result});
			}
		});
	});
	
	// store message in database and broadcast to all other users
	user.on('sendMessage', function(data) {
		if (!session.validateRequest('sendMessage', user, true, data))
			return;
		
		var groupId = parseInt(data.groupId);
		var content = data.content || '';
		var importance = data.importance || 0;
		var location = data.location;
		
		dbManager.trxPattern([
			function(callback) {
				// check if the user is member of the group
				this.db.getGroupMemberByUser({groupId: groupId, userId: user.userId,
					lock: true}, callback);
			},
			function(result, fields, callback) {
				if (result.length == 0)
					return callback(new Error('You are not member of the group'));
				
				// get active chat
				var chatRoom = allChatRoom.get(groupId);
				
				if (!chatRoom)
					return callback(null);
				
				// broadcast message
				chatRoom.sendMessage({user: user, content: content,
					importance: importance, location: location}, callback);
			},
			function(callback)
			{
				var message = {groupId: groupId, userId: user.userId,
						content: content, importance: importance, location: location};
				
				// save message in database
				this.db.addMessage(message, callback);
			},
			function(result, fields, callback) {
				if (result.affectedRows == 0)
					return callback(new Error('Failed to save in database'));
				
				callback(null);
			}
		],
		function(err) {
			if (err) {
				console.log('failed to save message\r\n' + err);
				
				user.emit('sendMessage', {status: 'fail', errorMsg: 'failed to send message'});
			} else {
				user.emit('sendMessage', {status: 'success'});
			}
		});
	});
	
	// user have read messages id from data.ackFrom to ackTo inclusive
	user.on('ackMessage', function(data) {
		if (!session.validateRequest('ackMessage', user, true, data))
			return;
		
		var groupId = data.groupId;
		var ackFrom = data.ackFrom;
		var ackTo = data.ackTo;
		
		dbManager.trxPattern([
			function(callback) {
				
			}
		],
		function(err) {
			
		});
	});
};

// init user when logined
var initUser = function(user, callback) {
	user.chatRooms = [];
	
	// when logined, user will get group list and
	// automatically join all chatRooms
	dbManager.trxPattern([
		function(callback) {
			group.getGroupList({user: user, db: this.db}, callback);
		},
		function(groups, callback) {
			var db = this.db;
			
			this.data.groupList = groups;
			
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
			user.emit('getGroupList', {status: 'success', groups: this.data.groupList});
			
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

// user enter group chat invited
var joinInvitedGroupChat = function(data, callback) {
	data.invitation = true;
	
	enterGroupChat(data, callback);
};

// user enter group chat invited before
var joinGroupChat = function(data, callback) {
	data.invitation = false;
	
	enterGroupChat(data, callback);
};

// users enter group
// input : data.groupId, data.users
var enterGroupChat = function(data, callback) {
	var pattern;
	
	var users = data.users;
	var groupId = data.groupId;
	var invitation = data.invitation || false;
	
	if (data.trx)
		pattern = dbManager.trxPattern;
	else
		pattern = dbManager.atomicPattern;
	
	// no member to join
	if (users.length == 0)
		return callback(null);
	
	pattern([
		// get chat room. create if does not exist
		function(callback) {
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
			
			var userIds = [];
			
			// make array of user ids
			for (var i = 0; i < users.length; i++)
				userIds.push(users[i].userId);
			
			async.waterfall([
				function(callback) {
					db.getGroupMembersByUser({groupId: groupId, userIds: userIds,
						lock: true}, callback);
				},
				function(result, fields, callback) {
					// check if every user are member of this group
					for (var i = 0; i < userIds.length; i++) {
						var found = false;
						
						for (var j = 0; j < result.length; j++) {
							var memberId = result[j].accountId;
							
							if (memberId == userIds[i]) {
								found = true;
								break;
							}
						}
						
						if (!found)
							return callback(new Error('Some users are not member of group or' +
							' no such group'));
					}
					
					// join room and notify members
					if (invitation)
						chatRoom.joinInvited({users: users}, callback);
					else
						chatRoom.join({users: users}, callback);
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
					callback(null);
			});
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
// input : data.groupId, data.user
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
			this.db.getGroupMemberByUser({groupId: groupId, userId: user.userId,
				lock: true}, callback);
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
			
			chatRoom.leave({users: [user]}, callback);
		},
		function(callback) {
			removeGroupChatIfEmpty(this.data.chatRoom);
			
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

// input : data.groupId, data.user
var exitGroupChat = function(data, callback) {
	var pattern;
	
	var user = data.user;
	var groupId = data.groupId;
	
	if (data.trx)
		pattern = dbManager.trxPattern;
	else
		pattern = dbManager.atomicPattern;
	
	pattern([
		// assumed the user was group member
		function(callback) {
			
			// get active chat
			var chatRoom = allChatRoom.get(groupId);
			var members = chatRoom.onlineMembers;
			
			// no active chatRoom or user did not join
			if (!chatRoom || members.indexOf(user) < 0) {
				return callback(null);
			}
			
			this.data.chatRoom = chatRoom;
			
			chatRoom.exit({users: [user]}, callback);
		},
		function(callback) {
			removeGroupChatIfEmpty(this.data.chatRoom);
			
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

//when user disconnects, exit from every chats
//input : data.user
var leaveAllGroupChat = function(data) {
	var user = data.user;
	var chatRooms = user.chatRooms;
	
	if (!user || !chatRooms)
		return;
	
	for (var i in chatRooms) {
		var chatRoom = chatRooms[i];
		
		(function(chatRoom) {
			//NOTE: leave callback is asynchronously called
			chatRoom.leave({users: [user]}, function(err) {
				if (err)
					throw Error('leaving chat room failed!');
				
				removeGroupChatIfEmpty(chatRoom);
			});
		})(chatRoom);
	}
	
	console.log('exited every group');
};

//if no online members, remove chat
var removeGroupChatIfEmpty = function(chatRoom) {
	if (chatRoom.getMemberNum() == 0 &&
			!removeGroupChat(chatRoom))
		throw Error('chat room remove failed!');
};

// when contact chat members changes, it's not contact chat anymore
// input: data.groupId
var removeContactChat = function(data, callback) {
	var pattern;
	
	var groupId = data.groupId;
	
	if (data.trx)
		pattern = dbManager.trxPattern;
	else
		pattern = dbManager.atomicPattern;
	
	pattern([
		function(callback) {			
			this.db.getContactByGroup({groupId: this.data.groupId, 
				lock: true}, callback);
		},
		function(result, fields, callback) {
			// if the group was for contact chat, it's not anymore
			if (result.length > 0) {
				var contact = result[0];
				this.data.contact = contact;
				
				// set group id null
				this.db.updateContactGroupChat({contactId: null,
					userId: contact.userId, userId2: contact.userId2}, 
					function(err, result, fields) {
						callback(err, true, result);
					});
			} else 
				callback(null, false, null);
		},
		// send any notifications
		// this must be sent before commit
		function(updated, result, callback) {
			if (updated && result.affectedRows == 0)
				return callback(new Error('failed to update contact info'));
			
			callback(null);
		}
	],
	function(err) {
		callback(err);
	},
	{db: data.db});
};

// when number of online member in group is 0,
// remove group chat
var removeGroupChat = function(chatRoom) {
	console.log('remove group chat ' + chatRoom.groupId);
	if (!allChatRoom.remove(chatRoom.groupId))
		return false;
	
	return true;
};


module.exports = {init: init,
		initUser: initUser,
		joinGroupChat: joinGroupChat,
		joinInvitedGroupChat: joinInvitedGroupChat,
		leaveGroupChat: leaveGroupChat,
		exitGroupChat: exitGroupChat,
		leaveAllGroupChat: leaveAllGroupChat,
		removeContactChat: removeContactChat};

var session = require('./session');
var dbManager = require('./dbManager');
var group = require('./group');
var chat = require('./chat');
var lib = require('./lib');
var async = require('async');