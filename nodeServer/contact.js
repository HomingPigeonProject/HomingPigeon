/**
 * Contact list management
 * a user can add, remove contacts and get contact list
 */

var init = function(user) {
	/* User operations
	 * name              arguments
	 * getContactList    
	 * addContact        email
	 * removeContact     email
	 * acceptContact     email
	 * denyContact       email
	 */
	
	/* User events
	 * name
	 * newPendingContact
	 * contactRemoved
	 * newContact
	 * contactDenied
	 */
	user.on('getContactList', function() {
		if (!session.validateRequest('getContactList', user, false))
			return;
		
		getAcceptedContactList({user: user, trx: true},
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
	
	user.on('getPendingContactList', function() {
		if (!session.validateRequest('getPendingContactList', user, false))
			return;
		
		getPendingContactList({user: user, trx: true},
				function(err, result) {
					if (err) {
						console.log('failed to get pending contact list\r\n' + err);
						user.emit('getPendingContactList', {status: 'fail', errorMsg:'server error'});
					} else {
						//console.log(result);
						user.emit('getPendingContactList', {status: 'success', contacts: result});
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
				
				this.data.peer = result[0];
				var peerId = result[0].userId;
				
				if (peerId == user.userId)
					return callback(new Error('cannot add self contact'));
				
				this.db.getContact({userId: user.userId, userId2: peerId, lock: true}, 
						callback);
			},
			function(result, fields, callback) {
				if (result.length > 0)
					return callback(new Error('contact already exists'));
				
				var peerId = this.data.peer.userId;
				
				this.db.addContact({requestUserId: user.userId, acceptUserId: peerId}, callback);
			},
			function(result, fields, callback) {
				if (result.affectedRows < 1)
					return callback(new Error('failed to add contact'));
				
				var peer = this.data.peer;
				var peerId = peer.userId;
				
				// notify user and peer sessions new pending contact
				var sessions = session.getUsersSessions([user, {userId: peerId}]);
				
				var i = 0;
				if (sessions) {
					sessions.forEach(function(session) {
						if (session.userId == peer.userId)
							session.emit('newPendingContact', user.getUserInfo());
						else if (session.userId == user.userId)
							session.emit('newPendingContact', lib.filterUserData(peer));
						else
							throw new Error('bad session');
						
						i++;
						if (i == sessions.length)
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
			}
		});
	});
	
	user.on('removeContact', function(data) {
		if (!session.validateRequest('removeContact', user, true, data))
			return;
		
		var db;
		dbManager.trxPattern([
			function(callback) {
				this.db.getUserByEmail({email: data.email, lock: true}, callback);
			},
			function(result, fields, callback) {
				if (result.length < 1)
					return callback(new Error('contact not found'));
				
				this.data.peer = result[0];
				var peerId = result[0].userId;
				
				this.db.removeContact({userId: user.userId, userId2: peerId}, callback);
			},
			function(result, fields, callback) {
				if (result.affectedRows == 0) {
					return callback(new Error('cannot find contact'));
				}
				
				var peerId = this.data.peer.userId;
				var peerEmail = this.data.peer.email;
				var sessions = session.getUsersSessions([user, {userId: peerId}]);
				
				// notify every session of the other peer
				var i = 0;
				if (sessions) {
					sessions.forEach(function(session) {
						if (session.userId == peerId)
							session.emit('contactRemoved', 
									{status: 'success', userId: user.userId, email: user.email});
						else if (session.userId == user.userId)
							session.emit('contactRemoved', 
									{status: 'success', userId: peerId, email: peerEmail});
						else 
							throw new Error('bad session');
						
						i++;
						if (i == sessions.length)
							callback(null);
					});
				} else
					callback(null);
			}
		], 
		function(err) {
			if (err) {
				console.log('error when to remove contact\r\n' + err);
				
				return user.emit('removeContact', {status: 'fail', errorMsg: 'server error'});
			}
		});
	});
	
	// user accept pending contact, notify 
	user.on('acceptContact', function(data) {
		if (!session.validateRequest('acceptContact', user, true, data))
			return;
		
		reactPendingContact({user: user, email: data.email, accept: true, 
			trx: true},
		function(err) {
			if (err) {
				console.log('error when to accept contact\r\n' + err);
				
				user.emit('acceptContact', {status: 'fail', errorMsg: 'server error'});
			} 
		});
	});
	
	// user accept pending contact, notify 
	user.on('denyContact', function(data) {
		if (!session.validateRequest('denyContact', user, true, data))
			return;
		
		reactPendingContact({user: user, email: data.email, accept: false, 
			trx: true},
		function(err) {
			if (err) {
				console.log('error when to deny contact\r\n' + err);
				
				user.emit('denyContact', {status: 'fail', errorMsg: 'server error'});
			} 
		});
	});
}

//init user when logined
var initUser = function(user, callback) {
	// when logined, user will get contact list
	// automatically
	dbManager.trxPattern([
		function(callback) {
			getAcceptedContactList({user: user, db: this.db}, 
					callback);
		},
		function(contacts, callback) {
			this.data.contacts = contacts;
			
			user.emit('getContactList', {status: 'success', contacts: contacts});
			
			callback(null);
		}
	],
	function(err) {
		if (err) {
			console.log('failed to get contact list');
			
			callback(err);
		} else {
			callback(null);
		}
	});
};

var getAcceptedContactList = function(data, callback) {
	var user = data.user
	
	if (data.trx)
		pattern = dbManager.trxPattern;
	else
		pattern = dbManager.atomicPattern;
	
	pattern([
		function(callback) {
			this.db.getAcceptedContactListByUser({userId: user.userId,
				lock: true}, callback);
		}
	], 
	function(err, result) {
		if (err) {
			callback(err);
		} else {
			callback(null, result)
		}
	},
	{db: data.db});
};

var getPendingContactList = function(data, callback) {
	var user = data.user
	
	if (data.trx)
		pattern = dbManager.trxPattern;
	else
		pattern = dbManager.atomicPattern;
	
	pattern([
		function(callback) {
			this.db.getPendingContactListByUser({userId: user.userId,
				lock: true}, callback);
		}
	], 
	function(err, result) {
		if (err) {
			callback(err);
		} else {
			callback(null, result)
		}
	},
	{db: data.db});
};

// input: data.user, data.email(peer email), data.accept(bool)
var reactPendingContact = function(data, callback) {
	var user = data.user
	var accept = data.accept
	
	if (data.trx)
		pattern = dbManager.trxPattern;
	else
		pattern = dbManager.atomicPattern;
	
	pattern([
		function(callback) {
			this.db.getUserByEmail({email: data.email, lock: true}, callback);
		},
		function(result, fields, callback) {
			if (result.length == 0)
				return callback(Error('No such user'));
			
			var peer = result[0];
			this.data.peer = peer;
			
			this.db.getPendingContact({userId: user.userId, userId2: peer.userId, lock: true},
					callback);
		},
		function(result, fields, callback) {
			if (result.length == 0)
				return callback(new Error('You don\'t have such waiting contact'));
			
			if (result[0].requestUserId == user.userId) {
				if (accept)
					return callback(new Error('The other user did not accept'));
				else
					return callback(new Error('You already accepted contact'));
			}
			
			var peerId = this.data.peer.userId;
			
			if (accept)
				this.db.acceptPendingContact({userId: user.userId, userId2: peerId},
						callback);
			else
				this.db.removePendingContact({userId: user.userId, userId2: peerId},
						callback);
		},
		function(result, fields, callback) {
			var peer = this.data.peer;
			var peerId = this.data.peer.userId;
			
			// notify both users
			var sessions = session.getUsersSessions([user, {userId: peerId}]);
			
			var i = 0;
			if (sessions) {
				sessions.forEach(function(session) {
					if (session.userId == peerId) {
						
						if (accept)
							session.emit('newContact', user.getUserInfo());
						else
							session.emit('contactDenied', user.getUserInfo());
						
					} else if(session.userId == user.userId) {
						
						if (accept)
							session.emit('newContact', lib.filterUserData(peer));
						else
							session.emit('contactDenied', lib.filterUserData(peer));
						
					} else
						throw new Error('bad session');
					
					i++;
					if (i == sessions.length)
						callback(null);
				});
			} else
				callback(null);
		}
	],
	function(err) {
		callback(err);
	},
	{db: data.db});
}

module.exports = {init: init,
		initUser: initUser};

var session = require('./session');
var lib = require('./lib');
var dbManager = require('./dbManager');
var async = require('async');
