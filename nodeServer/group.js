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
		if (!session.logined(user)) {
			return user.emit('getGroupList', {status: 'fail', errorMsg:'login before request'});
		}
		
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
						//console.log(data);
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
		if (!session.logined(user)) {
			return user.emit('addGroup', {status: 'fail', errorMsg:'login before request'});
		}
		
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
				var members = data.members;
				groupId = result[0].lastInsertId;
				// add the user as a member
				members.push(user.email);
				
				var addMembers = function(i, members) {
					if (i >= members.length)
						return callback(null);
					db.getUserByEmail({email: members[i]}, function(err, result) {
						if (err)
							return callback(err);
						
						// ignore not found member
						if (result.length == 0)
							return addMembers(i + 1, members);
						// add member to group
						db.addGroupMember({groupId: groupId, accountId: result[0].id,
							ackStart: 0}, 
							function(err, result) {
								if (err)
									return callback(err);
								if (result.affectedRows < 1)
									return callback(new Error('failed to insert member'));
								addMembers(i + 1, members);
							});
					});
				}
				// members should be array
				if (typeof members == 'object' &&
						members.hasOwnProperty('length')) {
					addMembers(0, members);
				} else {
					callback(new Error('not array'));
				}
			},
			// get group member information
			function(callback) {
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
		
		// invite contacts to group
		user.on('inviteGroupMembers', function(data) {
			if (!session.logined(user)) {
				return user.emit('inviteGroupMembers', {status: 'fail', errorMsg:'login before request'});
			}
			
			var db;
			async.waterfall([
				function(callback) {
					dbManager.getConnection(callback);
				},
				function(result, callback) {
					db = result;
					db.addGroup({name: data.name}, callback);
				},
			],
			function(err, result) {
				if (db)
					db.release();
				if (err) {
					console.log('failed to get group list\r\n' + err);
					return user.emit('inviteGroupMembers', {status: 'fail', errorMsg:'server error'});
				}
				user.emit('inviteGroupMembers', {status: 'success', groups: result});
			});
		});
		
		// exit from group
		user.on('exitGroup', function(data) {
			if (!session.logined(user)) {
				return user.emit('exitGroup', {status: 'fail', errorMsg:'login before request'});
			}
			
			var db;
			async.waterfall([
				function(callback) {
					dbManager.getConnection(callback);
				},
				function(result, callback) {
					db = result;
					db.addGroup({name: data.name}, callback);
				},
			],
			function(err, result) {
				if (db)
					db.release();
				if (err) {
					console.log('failed to get group list\r\n' + err);
					return user.emit('exitGroup', {status: 'fail', errorMsg:'server error'});
				}
				user.emit('exitGroup', {status: 'success', groups: result});
			});
		});
	});
}

module.exports = {init: init};