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
							data.resMembers = [user];

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
						function(group, sessions, callback) {
							data.group = group;

							db.updateContactGroupChat({contactId: contact.contactId,
								groupId: group.groupId}, callback);
						},
						function(result, fields, callback) {
							if (result.affectedRows == 0)
								return callback(new Error('failed to update contact'));

							// update contactId
							data.group.contactId = contact.contactId;
							data.resMembers = data.group.members;

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
				var sessions = session.getUsersSessions(this.data.resMembers);

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
		// make sure client update group list on addGroup, joinContactChat, getGroupList
		//console.log('message to ' + data.groupId + '(' + data.content + ')');
		var groupId = parseInt(data.groupId);
		var content = data.content || '';
		var importance = data.importance || 0;
		var location = data.location;
		var date = new Date();

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
				chatRoom.sendMessage({user: user, content: content, nbread: 1,
					importance: importance, location: location, date: date}, callback);
			},
			function(callback) {
				var message = {groupId: groupId, userId: user.userId, content: content,
						nbread: 1, importance: importance, location: location, date: date};

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

	// user have read messages id from data.ackStart to ackEnd inclusive
	user.on('ackMessage', function(data) {
		if (!session.validateRequest('ackMessage', user, true, data))
			return;

		var groupId = data.groupId;
		var ackStart = parseInt(data.ackStart);
		var ackEnd = parseInt(data.ackEnd);

		// check NaN, +-Infinity
		if (!isFinite(ackStart) || !isFinite(ackEnd))
			return;

		if (ackStart > ackEnd)
			return;
		console.log('groupId ' + groupId + ' ack ' + ackStart + ' ~ ' + ackEnd);
		dbManager.trxPattern([
			function(callback) {
				// check if the user is member of the group
				this.db.getGroupMemberByUser({groupId: groupId, userId: user.userId,
					lock: true}, callback);
			},
			function(result, fields, callback) {
				if (result.length == 0)
					return callback(new Error('You are not a member of group or no such group'));

				this.db.getConflictingAcks({groupId: groupId, userId: user.userId,
					ackStart: ackStart, ackEnd: ackEnd, update: true}, callback);
			},
			function(result, fields, callback) {
				var ack, ack2;
				var newAcks = [];
				ack = result[0];
				ack2 = result.length > 1 ? result[result.length - 1] : null;

				// check if already acked
				if (ack && ack.ackStart <= ackStart &&
						ack.ackEnd >= ackEnd)
					return callback(new Error('Already acked'));

				var mergedAckStart = ackStart;
				var mergedAckEnd = ackEnd;

				if (ack) {
					if (ack.ackStart <= ackStart) {
						mergedAckStart = ack.ackStart;
					} else {
						newAcks.push({ackStart: ackStart, ackEnd: ack.ackStart - 1});
					}

					var curAckStart = ack.ackEnd + 1;
					var curAckEnd;

					for (var i = 1; i < result.length; i++) {
						var ack = result[i];

						if (ack.ackStart <= curAckStart) {
							curAckStart = ack.ackEnd + 1;
							continue;
						}

						curAckEnd = ack.ackStart - 1;

						if (curAckStart <= curAckEnd)
							newAcks.push({ackStart: curAckStart, ackEnd: curAckEnd});

						curAckStart = ack.ackEnd + 1;
					}

					if (ack2.ackEnd >= ackEnd) {
						mergedAckEnd = ack2.ackEnd;
					} else {
						newAcks.push({ackStart: ack2.ackEnd + 1, ackEnd: ackEnd});
					}
				} else {
					// no conflicts, just add
					newAcks.push({ackStart: ackStart, ackEnd: ackEnd});
				}

				console.log(newAcks);
				console.log('merged ' + mergedAckStart + ' ~ ' + mergedAckEnd);

				this.data.mergedAckStart = mergedAckStart;
				this.data.mergedAckEnd = mergedAckEnd;
				this.data.newAcks = newAcks;

				// remove every conflicting acks
				this.db.removeConflictingAcks({groupId: groupId, userId: user.userId,
					ackStart: ackStart, ackEnd: ackEnd}, callback);
			},
			function(result, fields, callback) {
				var ackStart = this.data.mergedAckStart;
				var ackEnd = this.data.mergedAckEnd;

				// store new ack
				this.db.addMessageAck({groupId: groupId, userId: user.userId,
					ackStart: ackStart, ackEnd: ackEnd}, callback);
			},
			function(result, fields, callback) {
				var acks = this.data.newAcks;
				var db = this.db;

				var updateIter = function(i) {
					if (i == acks.length) {
						return callback(null);
					}

					var ack = acks[i];

					db.incrementMessageNbread({groupId: groupId, userId: user.userId,
						ackStart: ack.ackStart, ackEnd: ack.ackEnd},
						function(err, result, fields) {
							if (err) {
								callback(err);
							} else {
								updateIter(i + 1);
							}
						});
				};

				updateIter(0);
			},
			function(callback) {
				var acks = this.data.newAcks;

				var notifyIter = function(i) {
					if (i == acks.length) {
						return callback(null);
					}

					var ack = acks[i];

					notifyAck({groupId: groupId, user: user,
						ackStart: ack.ackStart, ackEnd: ack.ackEnd},
						function(err) {
							if (err) {
								callback(err);
							} else {
								notifyIter(i + 1);
							}
						});
				};

				notifyIter(0);
			}
		],
		function(err) {
			if (err) {
				user.emit('ackMessage', {status: 'fail', errorMsg: 'failed to update ack'});
			}
		});
	});

	user.on('joinChat', function(data) {
		if (!session.validateRequest('joinChat', user, true, data))
			return;

		var groupId = data.groupId;

		dbManager.trxPattern([
			function(callback) {
				this.db.getGroupMemberByUser({groupId: groupId, userId: user.userId,
					lock: true}, callback);
			},
			function(result, fields, callback) {
				if (result.length == 0)
					return callback(new Error('You are not member of group or' +
					' no such group'));

				// join chat room
				chatRoom.join({users: [user]}, callback);
			}
		],
		function(err, errSessions) {
			if (err || errSessions) {
				user.emit('joinChat', {status: 'fail',
					errorMsg: 'failed to join chat, if you are a member, please retry'});
			} else {
				user.emit('joinChat', {status: 'success'});
			}
		});
	});

	user.on('leaveChat', function(data) {
		if (!session.validateRequest('leaveChat', user, true, data))
			return;

		var groupId = data.groupId;

		dbManager.trxPattern([
			function(callback) {
				this.db.getGroupMemberByUser({groupId: groupId, userId: user.userId,
					lock: true}, callback);
			},
			function(result, fields, callback) {
				if (result.length == 0)
					return callback(new Error('You are not member of group or' +
					' no such group'));

				// join chat room
				chatRoom.leave({users: [user]}, callback);
			}
		],
		function(err, errSessions) {
			if (err || errSessions) {
				user.emit('leaveChat', {status: 'fail',
					errorMsg: 'failed to leave chat, if you are a member, please retry'});
			} else {
				user.emit('leaveChat', {status: 'success'});
			}
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
				function(err, errSessions) {
					if (err) {
						console.log('failed to join chat' + err);
						throw err;
					} else {
						if (errSessions) {
							chatTryer.pushSessions(group.groupId, errSessions, true);
						}

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

// user enter group chat invited before
// it should be synchronous until user joins chat
// input : data.groupId, data.users
var joinGroupChat = function(data, callback) {
	var users = data.users;
	var groupId = data.groupId;

	// no member to join
	if (users.length == 0)
		return callback(null, null);

	chatTryer.removeSessions(groupId, users);

	async.waterfall([
		// get chat room. create if does not exist
		function(callback) {
			var chatRoom = allChatRoom.get(groupId);

			if (!chatRoom) {
				chatRoom = chat.createChatRoom({groupId: groupId});

				if (!allChatRoom.add(groupId, chatRoom))
					return callback(new Error('Failed to open chat'));
			}

			// every sessions of users will enter chat
			var sessions = session.getUsersSessions(users, true);

			// join chat room
			chatRoom.join({users: sessions}, callback);
		},
	],
	function(err, errSessions) {
		if (err) {
			callback(err);
		} else {
			callback(null, errSessions);
		}
	});
};

// when user leaves group
// it should be synchronous until user leaves chat
// input : data.groupId, data.users
var leaveGroupChat = function(data, callback) {
	var users = data.users;
	var groupId = data.groupId;

	// no member to join
	if (users.length == 0)
		return callback(null, null);

	chatTryer.removeSessions(groupId, users);

	var chatRoom;
	async.waterfall([
		// check if the user is group member
		function(callback) {
			var members;
			// get active chat
			chatRoom = allChatRoom.get(groupId);
			members = chatRoom.onlineMembers;

			// no active chatRoom
			if (!chatRoom) {
				return callback(null, null);
			}

			// every sessions of users will leave chat
			var sessions = session.getUsersSessions(users, true);

			chatRoom.leave({users: sessions}, callback);
		},
		function(errSessions, callback) {
			removeGroupChatIfEmpty(chatRoom);

			callback(null, errSessions);
		}
	],
	function(err, errSessions) {
		if (err) {
			callback(err);
		} else {
			callback(null, errSessions);
		}
	});
};

var notifyAck = function(data, callback) {
	var user = data.user;
	var groupId = data.groupId;
	var ackStart = data.ackStart;
	var ackEnd = data.ackEnd;

	async.waterfall([
		// check if the user is group member
		function(callback) {
			// get active chat
			var chatRoom = allChatRoom.get(groupId);

			// no active chatRoom
			if (!chatRoom) {
				return callback(null);
			}

			// sender will not get ack of itself
			var sessions = session.getUserSessions(user, true);

			chatRoom.sendAck({users: sessions, user: user, ackStart: ackStart,
				ackEnd: ackEnd}, callback);
		},
	],
	function(err) {
		if (err) {
			callback(err);
		} else {
			callback(null);
		}
	});
};

var undoAcks = function(data, callback) {
	var user = data.user;
	var groupId = data.groupId;
	var acks = data.acks;

	async.waterfall([
		// check if the user is group member
		function(callback) {
			// get active chat
			var chatRoom = allChatRoom.get(groupId);

			// no active chatRoom
			if (!chatRoom) {
				return callback(null);
			}

			chatRoom.undoAcks({acks: acks, user: user}, callback);
		},
	],
	function(err) {
		if (err) {
			callback(err);
		} else {
			callback(null);
		}
	});
};

//when user disconnects, exit from every chats
//input : data.user
var leaveAllGroupChat = function(data) {
	var user = data.user;
	var chatRooms = user.chatRooms;

	if (!user || !chatRooms)
		return;

	chatTryer.removeSessionForAll(user);

	for (var i in chatRooms) {
		var chatRoom = chatRooms[i];

		(function(chatRoom) {
			//NOTE: leave callback is asynchronously called
			chatRoom.leave({users: [user]}, function(err, errSessions) {
				if (errSessions) {
					chatTryer.pushSessions(groupId, errSessions, false);

					console.log('User exit and leaving chat failed, try again...');
				}

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

// when number of online member in group is 0,
// remove group chat
var removeGroupChat = function(chatRoom) {
	console.log('remove group chat ' + chatRoom.groupId);
	if (!allChatRoom.remove(chatRoom.groupId))
		return false;

	return true;
};

// background process trying to join or leave chat
var chatTryer = (function() {
	var requests = []; // remaining [groupId, session] to join

	// push one request
	var pushSession = function(groupId, session, isJoin) {
		var req = {groupId: groupId, session: session};
		var handle = setTimeout(function() {
				trySession(req, isJoin);
			},
			calcTimeToWait());

		req.handle = handle;
		requests.push(req);
	};

	// push multiple requests
	var pushSessions = function(groupId, sessions, isJoin) {
		sessions.forEach(function(session) {
			pushSession(groupId, session, isJoin);
		});
	};

	// cancel every request for session for a group
	var removeSession = function(groupId, session) {
		requests.forEach(function(req) {
			var session2 = req.session;
			var reqGroupId = req.groupId;
			var handle = req.handle;

			if (session.userId == session2.userId &&
					groupId == reqGroupId) {
				requests.splice(requests.indexOf(req), 1);
				clearTimeout(handle);
			}
		});
	};

	// cancel every request for sessions for a group
	var removeSessions = function(groupId, sessions) {
		sessions.forEach(function(session) {
			removeSession(groupId, session);
		});
	};

	// cancel every request for session for every group
	var removeSessionForAll = function(session) {
		requests.forEach(function(req) {
			var session2 = req.session;
			var handle = req.handle;

			if (session.userId == session2.userId) {
				requests.splice(requests.indexOf(req), 1);
				clearTimeout(handle);
			}
		});
	};

	// cancel every request for sessions for every group
	var removeSessionsForAll = function(sessions) {
		sessions.forEach(function(session) {
			removeSessionForAll(session);
		});
	};

	var trySession = function(req, isJoin) {
		var groupId = req.groupId;
		var session = req.session;

		// remove from list
		requests.splice(requests.indexOf(req), 1);

		async.waterfall([
			function(callback) {
				var arg = {groupId: groupId, users: [session]};

				if (isJoin)
					joinGroupChat(arg, callback);
				else
					leaveGroupChat(arg, callback);
			}
		],
		function(err, errSessions) {
			if (err || errSessions) {
				// try again
				pushSession(groupId, session, isJoin);
			}
		});
	};

	// calculate next try time in milisec
	var calcTimeToWait = function() {
		return (requests.length + 1) * 100;
	};

	return {pushSession: pushSession,
		pushSessions: pushSessions,
		removeSession: removeSession,
		removeSessions: removeSessions,
		removeSessionForAll: removeSessionForAll,
		removeSessionsForAll: removeSessionsForAll};
})();

module.exports = {init: init,
		initUser: initUser,
		joinGroupChat: joinGroupChat,
		leaveGroupChat: leaveGroupChat,
		leaveAllGroupChat: leaveAllGroupChat,
		notifyAck: notifyAck,
		undoAcks: undoAcks,
		chatTryer: chatTryer};


//Léo try to communicate with Android
server.on("askList",function(){
		server.emit("onGetList","blabla");
});
//end Android communication

var session = require('./session');
var dbManager = require('./dbManager');
var group = require('./group');
var chat = require('./chat');
var lib = require('./lib');
var async = require('async');
