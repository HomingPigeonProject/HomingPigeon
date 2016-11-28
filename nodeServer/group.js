/**
 * Group management
 * user can create group chat for 2 or more users
 */

function init(user) {
	/* User operations
	 * name               arguments
	 * getGroupList       
	 * addGroup           name, members(array of email)
	 * inviteGroupMembers groupId, members(array of email)
	 * exitGroup          groupId
	 */
	
	/* User events 
	 * name
	 * membersInvited
	 * membersExit
	 */
	
	// get group list of the user
	// input : None
	// output : {status: 'success' or 'fail', groups: array of groups, errorMsg: error message}
	user.on('getGroupList', function() {
		if (!session.validateRequest('getGroupList', user, false))
			return;
		
		getGroupList({user: user, trx: true},
			function(err, result) {
				if (err) {	
					console.log('failed to get group list\r\n' + err);
					
					user.emit('getGroupList', {status: 'fail', errorMsg:'server error'});
				} else {
					user.emit('getGroupList', {status: 'success', groups: result});
				}
		});
		
	});
	
	// add group and add initial members to group
	// input : {name: group name, members: array of email}
	// output : {status: 'success' or 'fail', errorMsg: error message}
	user.on('addGroup', function(data) {
		if (!session.validateRequest('addGroup', user, true, data))
			return;
		
		dbManager.trxPattern([
			function(callback) {
				// add user itself to group
				data.user = user;
				data.db = this.db;
				
				startNewGroup(data, callback);
			},
			function(group, sessions, callback) {
				// notify every online member
				// this must be sent before commit
				for (var i = 0; i < sessions.length; i++)
					sessions[i].emit('addGroup', {status: 'success', group: group});
				
				callback(null);
			}
		],
		function(err) {
			if (err)
				user.emit('addGroup', {status: 'fail', errorMsg:'server error'});
		});
	});
	
	// invite contacts to group
	user.on('inviteGroupMembers', function(data) {
		if (!session.validateRequest('inviteGroupMembers', user, true, data))
			return;
		
		var members = data.members;
		var groupId = parseInt(data.groupId);
		// ignore invalid group id
		if (groupId !== groupId)
			return;
		
		dbManager.trxPattern([
			function(callback) {
				this.db.getGroupMemberByUser({groupId: groupId, 
					userId: user.userId, lock: true}, callback);
			},
			function(result, fields, callback) {
				if (result.length == 0)
					return callback(new Error('You are not a group member or no such group'));
				
				if (!groupId)
					return callback(new Error('no group id'));
				
				// members should be array
				if (lib.isArray(members)) {
					addMembers({db: this.db, groupId: groupId, user: user, 
						members: members, trx: false}, callback);
				} else {
					callback(new Error('not array'));
				}
			},
			function(members, callback) {
				this.data.invitedMembers = members;
				
				invalidateContactGroup({groupId: groupId, 
					db: this.db}, callback);
			},
			function(contact, callback) {
				this.data.contact = contact;
				
				// get group info
				this.db.getGroupById({groupId: groupId, lock: true}, callback);
			},
			function(result, fields, callback) {
				this.data.group = result[0];
				
				// get group member info
				this.db.getGroupMembers({groupId: groupId, lock: true}, callback);
			},
			// send any notifications
			// this must be sent before commit
			function(result, fields, callback) {	
				var group = this.data.group;
				var invitedMembers = this.data.invitedMembers;
				var totalMembers = result;
				var contact = this.data.contact;
				
				if (contact) {
					// notify two users of the contact
					var sessions = session.getUsersSessions([{userId: contact.userId}, 
						{userId: contact.userId2}]);
					
					for (var i = 0; i < sessions.length; i++) {
						var contactUser = sessions[i];
						
						contactUser.emit('contactChatRemoved', {contactId: contact.contactId});
					}
				}
				
				// get every session of every member
				var totalSessions = session.getUsersSessions(totalMembers);
				var invitedSessions = session.getUsersSessions(invitedMembers);
				
				group.members = totalMembers;
				
				// notify every online member
				for (var i = 0; i < totalSessions.length; i++) {
					var userSession = totalSessions[i];
					if (invitedSessions.indexOf(userSession) >= 0)
						userSession.emit('addGroup', {status: 'success', group: group});
					else
						userSession.emit('membersInvited', {groupId: group.groupId, 
							members: lib.filterUsersData(invitedMembers)});
				}
				
				callback(null);
			},
			function(callback) {
				var sessions = session.getUsersSessions(this.data.invitedMembers);
				
				chatManager.joinGroupChat({groupId: groupId, 
					users: sessions, db: this.db}, callback);
			},
			function(errSessions, callback) {
				if (errSessions)
					chatManager.chatTryer.pushSessions(groupId, errSessions, true);
				
				callback(null);
			}
		],
		function(err) {
			if (err) {
				console.log('failed to invite users to group\r\n' + err);
				
				return user.emit('inviteGroupMembers', {status: 'fail', errorMsg:'server error'});
			}
		});
	});
	
	// the user exit from group
	// TODO: when a user exit, messages of the user will not be shown to the other users anymore...
	user.on('exitGroup', function(data) {
		if (!session.validateRequest('exitGroup', user, true, data))
			return;
		
		var groupId = parseInt(data.groupId);
		// ignore invalid group id
		if (groupId !== groupId)
			return;
		
		dbManager.trxPattern([
			function(callback) {
				this.db.getGroupMemberByUser({groupId: groupId, 
					userId: user.userId, lock: true}, callback);
			},
			function(result, fields, callback) {
				if (result.length == 0) {
					return callback(new Error('You are already not in group'));
				}
				
				// leave group chat
				chatManager.leaveGroupChat({groupId: groupId, users: [user],
					db: this.db}, callback);
			},
			function(errSessions, callback) {
				if (errSessions)
					chatManager.chatTryer.pushSessions(groupId, errSessions, false);
				
				this.db.removeGroupMember({groupId: groupId, 
					userId: user.userId}, callback);
			},
			function(result, fields, callback) {
				if (result.affectedRows === 0) {
					return callback(new Error('failed to remove user from group'));
				}
				
				invalidateContactGroup({groupId: groupId, db: this.db}, 
						callback);
			},
			function(contact, callback) {
				this.data.contact = contact;
				
				// remove group if there's no member in group
				this.db.removeGroupIfNoMember({groupId: groupId, lock: true}, 
						callback);
			},
			function(result, fields, callback) {
				if (result.affectedRows > 0)
					console.log('group ' + groupId + ' is removed from db');
				
				// get group member info
				this.db.getGroupMembers({groupId: groupId, lock: true}, callback);
			},
			function(result, fields, callback) {
				this.data.totalMembers = result;
				
				//TODO: When user exits, dec nbread of all messages the user sent
				//      when user invited, inc nbread of all messages the user sent
				//      or don't do this and let this to be handled in client
				//NOTE: What client has to do, 
				//      When ack comes, increment nbread of messages in interval other than messages of sent user
				//      When undo comes, decrement nbread of messages in interval other than messages of sent user
				//      When user of message is not in group, ignore 1 nbread because it is by missing user 
				//undoAcks({groupId: groupId, user: user}, callback);
				callback(null);
			},
			function(callback) {
				var totalMembers = this.data.totalMembers;
				var contact = this.data.contact;
				
				if (contact) {
					// notify contact and the user
					var sessions = session.getUsersSessions([{userId: contact.userId}, 
						{userId: contact.userId2}]);
					
					for (var i = 0; i < sessions.length; i++) {
						var contactUser = sessions[i];
						
						contactUser.emit('contactChatRemoved', {contactId: contact.contactId});
					}
				}
				
				// notify remaining users
				var totalSessions = session.getUsersSessions(totalMembers);
				
				// notify every online member
				for (var i = 0; i < totalSessions.length; i++) {
					var userSession = totalSessions[i];
					
					// TODO: include user ack information(start, end)
					userSession.emit('membersExit', {groupId: groupId, 
						members: user.getUserInfo()});
				}
				
				// notify the user
				var sessions = session.getUserSessions(user);
				
				for(var i = 0; i < sessions.length; i++) {
					var userSession = sessions[i];
					
					userSession.emit('exitGroup', {status: 'success', groupId: groupId});
				}
				
				callback(null);
			}
		],
		function(err) {
			if (err) {
				console.log('failed to exit from group\r\n' + err);
				user.emit('exitGroup', {status: 'fail', errorMsg:'server error'});
			}
		});
	});
}

// undo every ack given by the user in the group
// input: data.user, data.groupId
var undoAcks = function(data, callback) {
	var pattern;
	
	var user = data.user;
	var groupId = data.groupId;
	
	if (data.trx)
		pattern = dbManager.trxPattern;
	else
		pattern = dbManager.atomicPattern;
	
	pattern([
		function(callback) {
			this.db.getAcksOfGroupByUser({groupId: groupId, userId: user.userId,
				lock: true}, callback);
		},
		function(result, fields, callback) {
			this.data.acks = result;
			
			this.db.removeAcksOfGroupByUser({groupId: groupId, userId: user.userId}, 
					callback);
		},
		function(result, fields, callback) {
			var db = this.db;
			var acks = this.data.acks;
			
			var updateIter = function(i) {
				if (i == acks.length) {
					return callback(null);
				}
				
				var ack = acks[i];
				
				db.decrementMessageNbread({groupId: groupId, userId: user.userId,
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
			var acks = this.data.acks;
			
			// tell online members to undo acks
			chatManager.undoAcks({groupId: groupId, acks: acks, user: user}, callback);
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

// create new group and chat room and notify members
// input: data.user, data.members(array of email)
var startNewGroup = function(data, callback) {
	var pattern;
	
	var user = data.user;
	
	if (data.trx)
		pattern = dbManager.trxPattern;
	else
		pattern = dbManager.atomicPattern;
	
	pattern([
		function(callback) {
			data.db = this.db;
			data.trx = false;
			
			// add group and members in database
			addGroup(data, callback);
		},
		function(group, callback) {
			var members = group.members;
			// get every session of every member
			var sessions = session.getUsersSessions(members);
			
			this.data.group = group;
			this.data.sessions = sessions;
			
			// create chatRoom and join every online members
			chatManager.joinGroupChat({groupId: group.groupId, 
				users: sessions, db: this.db}, callback);
		}
	],
	function(err, errSessions) {
		if (err) {
			callback(err);
		} else {
			var groupId = this.data.group.groupId;
			
			if (errSessions)
				chatManager.chatTryer.pushSessions(groupId, errSessions, true);
			
			callback(null, this.data.group, this.data.sessions);
		}
	},
	{db: data.db});
};

// get group list of user
// input: data.user
var getGroupList = function(data, callback) {
	var pattern;
	
	var user = data.user;
	
	if (data.trx)
		pattern = dbManager.trxPattern;
	else
		pattern = dbManager.atomicPattern;
	
	pattern([
		function(callback) {
			// get group list of the user
			this.db.getAllGroupListByUser({userId: user.userId, lock: true}, callback);
		},
		function(result, fields, callback) {
			var groups = result;
			var db = this.db;
			
			// get all group member information of all group
			var getMembers = function (i) {
				if (i >= groups.length)
					return callback(null, groups);
				
				db.getGroupMembers({groupId: groups[i].groupId, lock: true}, function(err, members) {
					if (err)
						return callback(err);
					
					groups[i].members = [];
					// for compartibility
					groups[i].id = groups[i].groupId;
					
					for (var j = 0; j < members.length; j++)
						groups[i].members.push(lib.filterUserData(members[j]));
					
					groups[i] = lib.filterGroupData(groups[i]);
					
					getMembers(i + 1);
				});
			}
			getMembers(0);
		}
	],
	function(err, result) {
		if (err) {	
			console.log('failed to get group list\r\n' + err);
			
			callback(err);
		} else {
			callback(null, result);
		}
	},
	{db: data.db});
	
};

// create group and members in database
// input: data.user, data.name, data.members
var addGroup = function(data, callback) {
	var groupId;
	var user = data.user
	var name = data.name;
	var members = data.members;
	
	if (data.trx)
		pattern = dbManager.trxPattern;
	else
		pattern = dbManager.atomicPattern;
	
	pattern([
		// create group
		function(callback) {
			this.db.addGroup({name: name}, callback);
		},
		// get group id
		function(result, fields, callback) {
			if (result.affectedRows == 0)
				return callback(new Error('failed to add group'));
			
			this.db.lastInsertId(callback);
		},
		// add members to group
		function(result, fields, callback) {
			if (result.length == 0)
				return callback(new Error('no last insert id'));
			
			members = data.members;
			groupId = result[0].lastInsertId;
			
			// members should be array
			if (lib.isArray(members)) {
				// add calling user as a member
				if (!contains.call(members, user.email))
					members.unshift(user.email);
				
				addMembers({db: this.db, groupId: groupId, user: user, 
					members: members}, callback);
			} else {
				callback(new Error('not array'));
			}
		},
		// if no group name, add default name
		function(result, callback) {
			// get group member information
			members = result;
			this.data.members = members;
			
			if (name) 
				return callback(null, false, null);
			
			name = getDefaultGroupName(members);
			this.db.updateGroupName({groupId: groupId, name: name},
					function(err, result, fields) {
				callback(err, true, result);
			});
		},
		// get group info
		function(updated, result, callback) {
			if (updated && result.affectedRows == 0)
				return callback(new Error('failed to update name'));
			
			this.db.getGroupOfUserById({groupId: groupId, 
				userId: user.userId, lock: true}, callback);
		},
		function(result, fields, callback) {
			if (result.length == 0)
				return callback(new Error('no group info'));
			
			var group = result[0];
			
			this.data.group = group;
			group.members = this.data.members;
			
			callback(null);
		}
	],
	function(err) {
		if (err) {
			console.log('failed to add group list\r\n' + err);
			
			callback(err);
		} else {
			var result = lib.filterGroupData(this.data.group);
			callback(null, result);
		}
	},
	{db: data.db});
};

// 'user' adds users in 'members' to group 'groupId', calling 'callback' at the end
var addMembers = function(data, userCallback) {
	var pattern;
	
	var addedMembers = [];
	
	var groupId = data.groupId;
	var user = data.user;
	var members = data.members;
	
	if (data.trx)
		pattern = dbManager.trxPattern;
	else
		pattern = dbManager.atomicPattern;
	
	if (!members)
		return userCallback(null, addedMembers);
	
	pattern([
		function(callback) {
			var db = this.db;
			
			// recursive function adding multiple users to group
			var addMembersIter = function(i, bigCallback) {
				var peer;
				
				if (i >= members.length)
					return bigCallback(null);
				
				dbManager.atomicPattern([
					// process data from client
					function(callback) {
						var email = members[i];
						if (email)
							email = email.toString().trim();
						
						// get user info
						this.db.getUserByEmail({email: email, lock: true}, callback);
					},
					function(result, fields, callback) {
						
						if (result.length == 0)
							return addMembersIter(i + 1, bigCallback);
						
						peer = result[0];
						
						// don't have to check contact when adding self
						if (user.userId == peer.id)
							return callback(null, true, null, null);
						
						// user can invite only contacts
						this.db.getAcceptedContact({userId: user.userId, userId2: peer.id, lock: true}, 
						function(err, result, fields) {
							callback(err, false, result, fields);
						});
					},
					function(self, result, fields, callback) {
						if (!self && result.length == 0)
							return callback(new Error('You can add only your contacts'));
						
						// check if the member added already
						this.db.getGroupMemberByUser({groupId: groupId, userId: peer.id, lock: true},
								callback);
					},
					function(result, fields, callback) {
						// ignore already added member
						if (result.length > 0)
							return addMembersIter(i + 1, bigCallback);
						
						// TODO : ackStart in groupMembers table is deprecated
						this.db.addGroupMember({groupId: groupId, userId: peer.id,
							ackStart: 0}, callback);
					},
					function(result, fields, callback) {
						if (result.affectedRows < 1)
							return callback(new Error('failed to insert member'));
						
						// push added user
						addedMembers.push(lib.filterUserData(peer));
						
						callback(null);
					}
				],
				function(err) {
					if (err)
						return bigCallback(err);
					
					addMembersIter(i + 1, bigCallback);
				},
				{db: db});
			}
			
			// start from 0th user
			addMembersIter(0, callback);
		}
	],
	function(err) {
		if (err) {
			userCallback(err);
		} else {
			userCallback(null, addedMembers);
		}
	},
	{db: data.db});
};


//when contact chat members changes, it's not contact chat anymore
//input: data.groupId
//output: contact
var invalidateContactGroup = function(data, callback) {
	var pattern;
	
	var groupId = data.groupId;
	
	if (data.trx)
		pattern = dbManager.trxPattern;
	else
		pattern = dbManager.atomicPattern;
	
	pattern([
		function(callback) {			
			this.db.getContactByGroup({groupId: groupId, 
				lock: true}, callback);
		},
		function(result, fields, callback) {
			// if the group was for contact chat, it's not anymore
			if (result.length > 0) {
				var contact = result[0];
				this.data.contact = contact;
				
				// set group id null
				this.db.updateContactGroupChat({contactId: null,
					groupId: groupId}, 
					function(err, result, fields) {
						callback(err, true, result);
					});
			} else 
				callback(null, false, null);
		},
		// send any notifications
		// this must be sent before commit
		function(updated, result, callback) {
			// when no such contact group or contact id for group is already null,
			// affected rows is 0
			if (updated && result.affectedRows == 0)
				return callback(new Error('failed to update contact info'));
			
			callback(null);
		}
	],
	function(err) {
		callback(err, this.data.contact);
	},
	{db: data.db});
};


// create default group name
var getDefaultGroupName = function(members) {
	// create string of names 'a, b, c...'
	// at most 5 names are listed
	if (members.length == 0)
		return '';
	
	var name = members[0].nickname;
	
	for (var i = 1; i < members.length && i < 5; i++) {
		var member = members[i];
		
		if (name.length + member.nickname.length + 2 > 125) {
			// if member can't be fully listed, '...' is appended
			name += '...';
			break;
		}
		
		name += ', ' + member.nickname;
	}
	
	return name;
}

// refer to http://stackoverflow.com/questions/1181575/determine-whether-an-array-contains-a-value
var contains = function(needle) {
    // Per spec, the way to identify NaN is that it is not equal to itself
    var findNaN = needle !== needle;
    var indexOf;

    if(!findNaN && typeof Array.prototype.indexOf === 'function') {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function(needle) {
            var i = -1, index = -1;

            for(i = 0; i < this.length; i++) {
                var item = this[i];

                if((findNaN && item !== item) || item === needle) {
                    index = i;
                    break;
                }
            }

            return index;
        };
    }

    return indexOf.call(this, needle) > -1;
};

module.exports = {init: init,
		startNewGroup: startNewGroup,
		getGroupList: getGroupList,
		addGroup: addGroup,
		addMembers: addMembers,};

var session = require('./session');
var dbManager = require('./dbManager');
var chatManager = require('./chatManager');
var lib = require('./lib');
var async = require('async');