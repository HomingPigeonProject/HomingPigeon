/**
 * Contact list management
 * a user can add, remove contacts and get contact list
 */
var session = require('./session');
var dbManager = require('./dbManager');
var async = require('async');

var init = function(user) {
	/* User operations
	 * name              arguments
	 * getContactList    
	 * addContact        email
	 * removeContact     email
	 */
	user.on('getContactList', function() {
		if (!session.validateRequest('getContactList', user, false))
			return;
		
		dbManager.getConnection(function(err, conn) {
			if (err) {
				console.log('failed to get connection');
				user.emit('getContactList', {status: 'fail', errorMsg:'server error'});
				throw err;
			}
			async.series([
				function(callback) {
					conn.getContactListByUser({userId: user.userId}, callback);
				}
			], 
			function(err, result) {
				if (err) {
					console.log('failed to get contact list\r\n' + err);
					user.emit('getContactList', {status: 'fail', errorMsg:'server error'});
					return;
				}
				
				console.log(result[0][0]);
				user.emit('getContactList', {status: 'success', contacts: result[0][0]});
			});
		});
	});
	
	user.on('addContact', function(data) {
		if (!session.validateRequest('addContact', user, true, data))
			return;
		
		var db, peerId;
		async.waterfall([
			function(callback) {
				dbManager.getConnection(callback);
			},
			function(result, callback) {
				db = result;
				db.getUserByEmail({email: data.email}, callback);
			},
			function(result, fields, callback) {
				if (result.length < 1)
					return callback(new Error('contact not found'));
				
				peerId = result[0].id;
				if (peerId == user.userId)
					return callback(new Error('cannot add self contact'));
				
				db.getContact({userId: user.userId, userId2: peerId, lock: true}, 
						callback);
			},
			function(result, fields, callback) {
				if (result.length > 0)
					return callback(new Error('contact already exists'));
				
				db.addContact({userId: user.userId, userId2: peerId}, callback);
			}
		], 
		function(err, result) {
			if (db)
				db.release();
			if (err || result.affectedRows == 0) {
				console.log('failed to add contact\r\n' + err);
				return user.emit('addContact', {status: 'fail', errorMsg: 'server error'});
			}
			console.log(result);
			user.emit('addContact', {status: 'success', email: data.email});
		});
	});
	
	user.on('removeContact', function(data) {
		if (!session.validateRequest('removeContact', user, true, data))
			return;
		
		var db, peerId;
		async.waterfall([
			function(callback) {
				dbManager.getConnection(callback);
			},
			function(result, callback) {
				db = result;
				db.getUserByEmail({email: data.email, lock: true}, callback);
			},
			function(result, fields, callback) {
				if (result.length < 1)
					return callback(new Error('contact not found'));
				
				peerId = result[0].id;
				db.removeContact({userId: user.userId, userId2: peerId}, callback);
			},
		], 
		function(err, result) {
			if (db)
				db.release();
			if (err) {
				console.log('failed to remove contact\r\n' + err);
				return user.emit('removeContact', {status: 'fail', errorMsg: 'server error'});
			}
			if (result.affectedRows == 0) {
				console.log('failed to remove contact\r\n' + err);
				return user.emit('removeContact', {status: 'fail', errorMsg: 'cannot find contact'});
			}
			console.log(result);
			user.emit('removeContact', {status: 'success', email: data.email});
		});
	});
}

module.exports = {init: init};

