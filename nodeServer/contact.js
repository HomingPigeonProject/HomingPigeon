/**
 * Contact list management
 * a user can add, remove contacts and get contact list
 */
var session = require('./session');
var dbManager = require('./dbManager');
var async = require('async');

var init = function(user) {
	// user operations
	// request           response
	// getContactList -> contactList
	// addContact     -> addedContact  
	// removeContact  -> removedContact
	user.on('getContactList', function() {
		if (!session.logined(user)) {
			user.emit('contactList', {errorMsg:'login before request'});
			//throw new Error('invalid request');
		}
		
		dbManager.getConnection(function(err, conn) {
			if (err) {
				console.log('failed to get connection');
				user.emit('contactList', {errorMsg:'server error'});
				throw err;
			}
			async.series([
				function(callback) {
					conn.getContactListByUser(user.userId, callback);
				}
			], 
			function(err, result) {
				if (err) {
					console.log('failed to get contact list\r\n' + err);
					user.emit('contactList', {errorMsg:'server error'});
					return;
				}
				
				console.log(result[0][0]);
				user.emit('contactList', result[0][0]);
			});
		});
	});
	
	user.on('addContact', function(data) {
		if (!session.logined(user)) {
			user.emit('addedContact', {status: 'fail', errorMsg:'login before request'});
		}
		console.log(data);
		var db, peerId;
		async.waterfall([
			function(callback) {
				dbManager.getConnection(callback);
			},
			function(result, callback) {
				db = result;
				db.getUserByEmail(data.email, callback);
			},
			function(result, fields, callback) {
				if (result.length < 1)
					return callback(new Error('contact not found'));
				peerId = result[0].id;
				db.getContact(user.userId, peerId, callback);
			},
			function(result, fields, callback) {
				if (result.length > 0)
					return callback(new Error('contact already exists'));
				db.addContact({accountId: user.userId, accountId2: peerId}, callback);
			}
		], 
		function(err, result) {
			if (db)
				db.release();
			if (err || result.affectedRows == 0) {
				console.log('failed to add contact\r\n' + err);
				user.emit('addedContact', {status: 'fail', errorMsg: 'server error'});
				return;
			}
			console.log(result);
			user.emit('addedContact', {status: 'success'});
		});
	});
	
	user.on('removeContact', function(data) {
		if (!session.logined(user)) {
			user.emit('removedContact', {status: 'fail', errorMsg:'login before request'});
		}
		
		var db;
		async.waterfall([
			function(callback) {
				dbManager.getConnection(callback);
			},
			function(conn, callback) {
				db = conn;
				db.getUserByEmail(data.email, callback);
			},
			function(result, field, callback) {
				if (result.length < 1)
					return callback(new Error('contact not found'));
				db.removeContact(user.userId, result[0].id, callback);
			}
		], 
		function(err, result) {
			if (db)
				db.release();
			if (err) {
				console.log('failed to remove contact\r\n' + err);
				user.emit('removedContact', {status: 'fail', errorMsg: 'server error'});
				return;
			}
			console.log(result);
			user.emit('removedContact', {status: 'success'});
		});
	});
}

module.exports = {init: init};

