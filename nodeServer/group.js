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
		
		// add user itself to group
		data.user = user;
		data.trx = true;
		
		startNewGroup(data, function(err) {});
	});
	
	// invite contacts to group
	// TODO: when users are invited to contact group, detach from contact.
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
				if (!groupId)
					return callback(new Error('no group id'));
				
				// members should be array
				if (isArray(members)) {
					addMembers({db: this.db, groupId: groupId, user: user, 
						members: members, trx: false}, callback);
				} else {
					callback(new Error('not array'));
				}
			},
			function(members, callback) {
				// get every session of every member
				var sessions = session.getUsersSessions(members);
				
				this.data.sessions = sessions;
				this.data.members = members;
				
				chatManager.joinInvitedGroupChat({groupId: groupId, 
					users: sessions, db: this.db}, callback);
			},
			function(callback) {
				// get group info
				this.db.getGroupById({groupId: groupId}, callback);
			},
			function(result, fields, callback) {
				this.data.group = result[0];
				
				// get group member info
				this.db.getGroupMembers({groupId: groupId}, callback);
			},
			function(result, fields, callback) {
				var sessions = this.data.sessions;
				var group = this.data.group;
				var members = lib.filterUsersData(result);
				
				group.members = members;
				
				// membersInvited event will replace this
				user.emit('inviteGroupMembers', {status: 'success', groupId: groupId, members: members});
			
				// notify every online member
				// this must be sent before commit
				for (var i = 0; i < sessions.length; i++) {
					var invitedUser = sessions[i];
					
					invitedUser.emit('addGroup', {status: 'success', group: group});
				}
				
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
	user.on('exitGroup', function(data) {
		if (!session.validateRequest('exitGroup', user, true, data))
			return;
		
		var groupId = parseInt(data.groupId);
		// ignore invalid group id
		if (groupId !== groupId)
			return;
		
		dbManager.trxPattern([
			function(callback) {
				this.db.removeGroupMember({groupId: groupId, userId: user.userId}, callback);
			},
			function(result, fields, callback) {
				if (result.affectedRows === 0) {
					return callback(new Error('user is already not in group'));
				}
				
				// exit group chat
				chatManager.exitGroupChat({groupId: groupId, user: user,
					db: this.db}, callback);
			}
		],
		function(err) {
			if (err) {
				console.log('failed to exit from group\r\n' + err);
				return user.emit('exitGroup', {status: 'fail', errorMsg:'server error'});
			}
			
			user.emit('exitGroup', {status: 'success', groupId: groupId});
		});
	});
}

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
		},
		function(callback) {
			var sessions = this.data.sessions;
			var group = this.data.group;
			
			// notify every online member
			// this must be sent before commit
			for (var i = 0; i < sessions.length; i++)
				sessions[i].emit('addGroup', {status: 'success', group: group});
			
			callback(null);
		}
	],
	function(err) {
		if (err) {
			user.emit('addGroup', {status: 'fail', errorMsg:'server error'});
			callback(err);
		} else {
			callback(err, this.data.group);
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
			this.db.getGroupListByUser({userId: user.userId, lock: true}, callback);
		},
		function(result, fields, callback) {
			var groups = result;
			var db = this.db;
			
			// get all group member information of all group
			var getMembers = function (i) {
				if (i >= groups.length)
					return callback(null, groups);
				
				db.getGroupMembers({groupId: groups[i].groupId}, function(err, members) {
					if (err)
						return callback(err);
					
					groups[i].members = [];
					// for compartibility
					groups[i].id = groups[i].groupId;
					
					for (var j = 0; j < members.length; j++)
						groups[i].members.push(lib.filterUserData(members[j]));
					
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
			if (isArray(members)) {
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
			
			if (name) 
				return callback(null);
			
			name = getDefaultGroupName(members);
			this.db.updateGroupName({groupId: groupId, name: name}, callback);
		},
	],
	function(err) {
		if (err) {
			console.log('failed to add group list\r\n' + err);
			
			callback(err);
		} else {
			callback(null, {groupId: groupId, name: name, members: members});
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
					// get user info
					function(callback) {
						this.db.getUserByEmail({email: members[i].trim(), lock: true}, callback);
					},
					function(result, fields, callback) {
						
						if (result.length == 0)
							return addMembersIter(i + 1, bigCallback);
						
						peer = result[0];
						
						// don't have to check contact when adding self
						if (user.userId == peer.id)
							return callback(null, true, null, null);
						
						// user can invite only contacts
						this.db.getContact({userId: user.userId, userId2: peer.id, lock: true}, 
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
						
						// TODO : ackStart should be coordinated
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

// create default group name
var getDefaultGroupName = function(members) {
	// create string of names 'a, b, c...'
	// at most 5 names are listed
	if (members.length == 0)
		return '';
	
	var name = members[0].nickname;
	
	for (var i = 1; i < members.length && i < 5; i++) {
		var member = members[i];
		
		if (name.length + member.nickname.length + 2 > 125)
			break;
		
		name += ', ' + member.nickname;
	}
	// if members are more than 1, '...' is appended
	if (i > 1)
		name += '...';
	
	return name;
}

var isArray = function(array) {
	if (typeof array == 'object' && array.hasOwnProperty('length'))
		return true;
	
	return false;
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