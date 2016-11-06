/**
 * Contact list management
 * a user can add, remove contacts and get contact list
 */
var session = require('./session');
var lib = require('./lib');
var dbManager = require('./dbManager');
var async = require('async');

var init = function(user) {
	/* User operations
	 * name              arguments
	 * getContactList    
	 * addContact        email
	 * removeContact     email
	 */
	
	/* User events
	 * name
	 * contactAdded
	 */
	user.on('getContactList', function() {
		if (!session.validateRequest('getContactList', user, false))
			return;
		
		dbManager.atomicPattern([
			function(callback) {
				this.db.getContactListByUser({userId: user.userId}, callback);
			}
		], 
		function(err, result) {
			if (err) {
				console.log('failed to get contact list\r\n' + err);
				user.emit('getContactList', {status: 'fail', errorMsg:'server error'});
			} else {
				//console.log(result);
				user.emit('getContactList', {status: 'success', contacts: result});
			}
		});
	});
	
	user.on('addContact', function(data) {
		if (!session.validateRequest('addContact', user, true, data))
			return;
		
		var peerId, peerData;
		dbManager.trxPattern([
			function(callback) {
				this.db.getUserByEmail({email: data.email, lock: true}, callback);
			},
			function(result, fields, callback) {
				if (result.length < 1)
					return callback(new Error('contact not found'));
				
				peerData = result[0];
				peerId = peerData.id;
				
				if (peerId == user.userId)
					return callback(new Error('cannot add self contact'));
				
				this.db.getContact({userId: user.userId, userId2: peerId, lock: true}, 
						callback);
			},
			function(result, fields, callback) {
				if (result.length > 0)
					return callback(new Error('contact already exists'));
				
				this.db.addContact({userId: user.userId, userId2: peerId}, callback);
			},
			function(result, fields, callback) {
				if (result.affectedRows < 1)
					return callback(new Error('failed to add contact'));
				
				// send notification to peer
				var peers = session.getUserSessions(peerId);
				
				if (peers) {
					peers.forEach(function(peer) {
						peer.emit('contactAdded', user.getUserInfo);
						
						if (peers.indexOf(peer) + 1 == peers.length)
							callback(null);
					});
				} else
					callback(null);
			}
		], 
		function(err) {
			if (err) {
				console.log('failed to add contact\r\n' + err);
				
				return user.emit('addContact', {status: 'fail', errorMsg: 'server error'});
			} else {
				console.log(result);
				
				var result = lib.filterUserData(peerData);
				result.status = 'success'
				user.emit('addContact', result);
			}
		});
	});
	
	user.on('removeContact', function(data) {
		if (!session.validateRequest('removeContact', user, true, data))
			return;
		
		var db, peerId;
		dbManager.trxPattern([
			function(callback) {
				this.db.getUserByEmail({email: data.email, lock: true}, callback);
			},
			function(result, fields, callback) {
				if (result.length < 1)
					return callback(new Error('contact not found'));
				
				peerId = result[0].id;
				this.db.removeContact({userId: user.userId, userId2: peerId}, callback);
			},
		], 
		function(err, result) {
			if (err) {
				console.log('error when to remove contact\r\n' + err);
				
				return user.emit('removeContact', {status: 'fail', errorMsg: 'server error'});
			}
			
			if (result.affectedRows == 0) {
				console.log('failed to remove contact\r\n' + err);
				
				return user.emit('removeContact', {status: 'fail', errorMsg: 'cannot find contact'});
			}
			
			user.emit('removeContact', {status: 'success', email: data.email});
		});
	});
}

module.exports = {init: init};

