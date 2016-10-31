/**
 * Group management
 * user can create group chat for 2 or more users
 */
var session = require('./session');
var dbManager = require('./dbManager');
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
				// get group list of the user
				db.getGroupListByUser({userId: user.userId}, callback);
			},
			function(result, fields, callback) {
				var groups = result;
				// get all group member information of all group
				var getMembers = function (i, groups) {
					if (i >= groups.length)
						return callback(null, groups);
					db.getGroupMembers({groupId: groups[i].id}, function(err, data) {
						if (err)
							return callback(err);
						
						groups[i].members = data;
						getMembers(i + 1, groups);
					});
				}
				getMembers(0, groups);
			},
			function(result, callback) {
				db.commit(function(err) {
					callback(err, result);
				});
			}
		],
		function(err, result) {
			if (err) {
				if (db) {
					db.rollback(function() {
						db.release();
					});
				}
				console.log('failed to get group list\r\n' + err);
				return user.emit('getGroupList', {status: 'fail', errorMsg:'server error'});
			}
			if (db)
				db.release();
			user.emit('getGroupList', {status: 'success', groups: result});
		});
	});
	
	// add group and add initial members to group
	// input : {name: group name, members: array of email}
	// output : {status: 'success' or 'fail', errorMsg: error message}
	user.on('addGroup', function(data) {
		if (!session.validateRequest('addGroup', user, true, data))
			return;
		
		var db, groupId, members;
		async.waterfall([
			function(callback) {
				dbManager.getConnection(callback);
			},
			function(result, callback) {
				db = result;
				db.beginTransaction(callback);
			},
			// create group
			function(result, fields, callback) {
				db.addGroup({name: data.name}, callback);
			},
			// get group id
			function(result, fields, callback) {
				if (result.affectedRows == 0)
					callback(new Error('failed to add group'));
				
				db.lastInsertId(callback);
			},
			// add members to group
			function(result, fields, callback) {
				members = data.members;
				groupId = result[0].lastInsertId;
				
				// members should be array
				if (isArray(members)) {
					// add the user as a member
					if (!contains.call(members, user.email))
						members.unshift(user.email);
					addMembers(db, groupId, user, members, callback);
				} else {
					callback(new Error('not array'));
				}
			},
			// get group member information
			function(result, callback) {
				db.getGroupMembers({groupId: groupId}, callback);
			},
			function(result, fields, callback) {
				members = result;
				db.commit(callback);
			}
		],
		function(err, result) {
			if (err) {
				if (db) {
					db.rollback(function() {
						db.release();
					});
				}
				console.log('failed to add group list\r\n' + err);
				return user.emit('addGroup', {status: 'fail', errorMsg:'server error'});
			}
			if (db)
				db.release();
			
			user.emit('addGroup', {status: 'success', 
				groups: {groupId: groupId, name: data.name, members: members}});
		});
	});
	
	// invite contacts to group
	user.on('inviteGroupMembers', function(data) {
		if (!session.validateRequest('inviteGroupMembers', user, true, data))
			return;
		
		var db, groupId, members;
		async.waterfall([
			function(callback) {
				dbManager.getConnection(callback);
			},
			function(result, callback) {
				db = result;
				db.beginTransaction(callback);
			},
			function(result, fields, callback) {
				members = data.members;
				groupId = data.groupId;
				
				// members should be array
				if (isArray(members)) {
					addMembers(db, groupId, user, members, callback);
				} else {
					callback(new Error('not array'));
				}
			},
		],
		function(err, addedMembers) {
			if (err) {
				if (db) {
					db.rollback(function() {
						db.release();
					});
				}
				console.log('failed to invite users to group\r\n' + err);
				return user.emit('inviteGroupMembers', {status: 'fail', errorMsg:'server error'});
			}
			if (db)
				db.release();
			members = addedMembers;
			user.emit('inviteGroupMembers', {status: 'success', groupId: groupId, members: members});
		});
	});
	
	// the user exit from group
	user.on('exitGroup', function(data) {
		if (!session.validateRequest('exitGroup', user, true, data))
			return;
		
		var db;
		async.waterfall([
			function(callback) {
				dbManager.getConnection(callback);
			},
			function(result, callback) {
				db = result;
				db.removeGroupMember({groupId: data.groupId, userId: user.userId}, callback);
			},
		],
		function(err, result) {
			if (db)
				db.release();
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

// 'user' adds users in 'members' to group 'groupId', calling 'callback' at the end
var addMembers = function(db, groupId, user, members, callback) {
	var addedMembers = [];
	
	// recursive function adding mutiple users to group
	var addMembersIter = function(i) {
		if (i >= members.length)
			return callback(null, addedMembers);
		
		var peer;
		async.waterfall([
			function(callback) {
				db.getUserByEmail({email: members[i], lock: true}, callback);
			},
			function(result, fields, callback) {
				if (result.length == 0)
					return addMembersIter(i + 1);
				
				peer = result[0];
				
				// don't have to check contact when adding self
				if (user.userId == peer.id)
					return callback(null, true, null, null);
				
				// user can invite only contacts
				db.getContact({userId: user.userId, userId2: peer.id, lock: true}, 
				function(err, result, fields) {
					callback(err, false, result, fields);
				});
			},
			function(self, result, fields, callback) {
				if (!self && result.length == 0)
					return addMembersIter(i + 1);
				
				// check if the member added already
				db.getGroupMember({groupId: groupId, userId: peer.id, lock: true},
						callback);
			},
			function(result, fields, callback) {
				if (result.length > 0)
					return addMembersIter(i + 1);
				
				// TODO : ackStart should be coordinated
				db.addGroupMember({groupId: groupId, userId: peer.id,
					ackStart: 0}, callback);
			},
			function(result, fields, callback) {
				if (result.affectedRows < 1)
					return callback(new Error('failed to insert member'));
				
				// push added user
				addedMembers.push(peer);
				callback(null);
			}
		],
		function(err) {
			if (err)
				return callback(err);
			
			addMembersIter(i + 1);
		});
	}
	
	// start from 0th user
	addMembersIter(0);
}


var isArray = function(array) {
	if (typeof array == 'object' && array.hasOwnProperty('length'))
		return true;
	return false;
}

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