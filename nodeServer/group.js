/**
 * Group management
 * user can create group chat for 2 or more users
 */
var session = require('./session');
var dbManager = require('./dbManager');
var lib = require('./lib');
var async = require('async');

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
		
		dbManager.trxPattern([
			function(callback) {
				// get group list of the user
				this.db.getGroupListByUser({userId: user.userId}, callback);
			},
			function(result, fields, callback) {
				var groups = result;
				var db = this.db;
				
				// get all group member information of all group
				var getMembers = function (i, groups) {
					if (i >= groups.length)
						return callback(null, groups);
					
					db.getGroupMembers({groupId: groups[i].id}, function(err, data) {
						if (err)
							return callback(err);
						
						groups[i].members = [];
						
						for (var j = 0; j < data.length; j++)
							groups[i].members.push(lib.filterUserData(data[j]));
						
						getMembers(i + 1, groups);
					});
				}
				getMembers(0, groups);
			}
		],
		function(err, result) {
			if (err) {	
				console.log('failed to get group list\r\n' + err);
				return user.emit('getGroupList', {status: 'fail', errorMsg:'server error'});
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
		
		data.user = user;
		addGroup(data, function(err, data) {
			if (err)
				return user.emit('addGroup', {status: 'fail', errorMsg:'server error'});
			
			user.emit('addGroup', {status: 'success', group: data});
		});
	});
	
	// invite contacts to group
	user.on('inviteGroupMembers', function(data) {
		if (!session.validateRequest('inviteGroupMembers', user, true, data))
			return;
		
		var groupId, members;
		dbManager.trxPattern([
			function(callback) {
				members = data.members;
				groupId = data.groupId;
				
				// members should be array
				if (isArray(members)) {
					addMembers({db: this.db, groupId: groupId, user: user, 
						members: members, trx: false}, callback);
				} else {
					callback(new Error('not array'));
				}
			},
		],
		function(err, addedMembers) {
			if (err) {
				console.log('failed to invite users to group\r\n' + err);
				return user.emit('inviteGroupMembers', {status: 'fail', errorMsg:'server error'});
			} else {
				members = addedMembers;
				user.emit('inviteGroupMembers', {status: 'success', groupId: groupId, members: members});
			}
		});
	});
	
	// the user exit from group
	user.on('exitGroup', function(data) {
		if (!session.validateRequest('exitGroup', user, true, data))
			return;
		
		dbManager.atomicPattern([
			function(callback) {
				this.db.removeGroupMember({groupId: data.groupId, userId: user.userId}, callback);
			},
		],
		function(err, result) {
			if (err) {
				console.log('failed to exit from group\r\n' + err);
				return user.emit('exitGroup', {status: 'fail', errorMsg:'server error'});
			} 
			
			if (result.affectedRows == 0) {
				console.log('user is already not in group');
				return user.emit('exitGroup', {status: 'fail', errorMsg:'you are not group member'});
			}
			
			user.emit('exitGroup', {status: 'success', groupId: data.groupId});
		});
	});
}

var addGroup = function(data, callback) {
	var groupId;
	var user = data.user
	var name = data.name;
	var members = data.members;
	
	dbManager.trxPattern([
		// create group
		function(callback) {
			this.db.addGroup({name: name}, callback);
		},
		// get group id
		function(result, fields, callback) {
			if (result.affectedRows == 0)
				callback(new Error('failed to add group'));
			
			this.db.lastInsertId(callback);
		},
		// add members to group
		function(result, fields, callback) {
			members = data.members;
			groupId = result[0].lastInsertId;
			
			// members should be array
			if (isArray(members)) {
				// add calling user as a member
				if (!contains.call(members, user.email))
					members.unshift(user.email);
				console.log('hihi');
				addMembers({db: this.db, groupId: groupId, user: user, 
					members: members, trx: false}, callback);
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
			db.updateGroupName({groupId: groupId, name: name}, callback);
		},
	],
	function(err) {
		if (err) {
			console.log('failed to add group list\r\n' + err);
			
			callback(err);
		} else {
			callback(null, {groupId: groupId, name: name, members: members});
		}
	});
}

// 'user' adds users in 'members' to group 'groupId', calling 'callback' at the end
var addMembers = function(data, userCallback) {
	var pattern;
	
	var addedMembers = [];
	
	var db = data.db;
	var groupId = data.groupId;
	var user = data.user;
	var members = data.members;
	var trx = data.trx;
	
	// recursive function adding mutiple users to group
	var addMembersIter = function(i, bigCallback) {
		var peer;
		
		if (i >= members.length)
			return bigCallback(null);
		
		dbManager.atomicPattern([
			// get user info
			function(callback) {
				console.log('user');
				this.db.getUserByEmail({email: members[i].trim(), lock: true}, callback);
			},
			function(result, fields, callback) {
				if (result.length == 0)
					return addMembersIter(i + 1, bigCallback);
				
				peer = result[0];
				
				// don't have to check contact when adding self
				if (user.userId == peer.id)
					return callback(null, true, null, null);
				console.log('user2');
				// user can invite only contacts
				this.db.getContact({userId: user.userId, userId2: peer.id, lock: true}, 
				function(err, result, fields) {
					callback(err, false, result, fields);
				});
			},
			function(self, result, fields, callback) {
				if (!self && result.length == 0)
					return addMembersIter(i + 1, bigCallback);
				console.log('user3');
				// check if the member added already
				this.db.getGroupMember({groupId: groupId, userId: peer.id, lock: true},
						callback);
			},
			function(result, fields, callback) {
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
	
	if (trx)
		pattern = dbManager.trxPattern;
	else
		pattern = dbManager.atomicPattern;
	
	pattern([
		function(callback) {
			db = this.db;
			
			// start from 0th user
			addMembersIter(0, callback);
		}
	],
	function(err) {
		if (err) {
			userCallback(err);
		} else {
			console.log('hihi');
			userCallback(null, addedMembers);
		}
	},
	{db: db});
}

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

module.exports = {init: init};