/**
 * Event management
 * user can create, check events
 * when time for event comes, group for event is created
 */
var dbManager = require('./dbManager');

function init(user) {
	// read every events of the user
	user.on('getEventList', function(data) {
		if (!session.validateRequest('getEventList', user, false))
			return;
		
		dbManager.trxPattern([
			function(callback) {
				this.db.getEventListByUser({userId: data.userId}, callback);
			},
			function(events, fields, callback) {
				this.data.events = events;
				var db = this.db;
				
				var eventIter = function(i) {
					if (i == events.length) {
						return callback(null);
					}
					
					var event = events[i];
					
					async.waterfall([
						function(callback) {
							db.getEventParticipants({eventId: event.eventId}, 
									callback);
						},
						function(result, fields, callback) {
							event.participants = lib.filterUsersData(result);
							
							callback(null);
						}
					],
					function(err) {
						if (err)
							return callback(err);
						
						eventIter(i + 1);
					});
				}
				
				eventIter(0);
			}
		],
		function(err) {
			if (err) {
				user.emit('getEventList', {status: 'fail', errorMsg: 'server error'});
			} else {
				user.emit('getEventList', {status: 'success', events: this.data.events});
			}
		});
	});
	
	// create event with participants
	user.on('createEvent', function(data) {
		if (!session.validateRequest('createEvent', user, false))
			return;
		
		var emails = data.participants;
		var nbParticipantsMax = parseInt(data.nbParticipantsMax);
		var name = data.name;
		var description = data.description;
		var date = data.date;
		if (nbParticipantsMax !== nbParticipantsMax ||
				!lib.isArray(participants) ||
				!lib.isDate(date) ||
				!name)
			return;
		
		dbManager.trxPattern([
			function(callback) {
				getParticipants({user: user, emails: emails, 
					db: this.db}, callback);
			},
			function(participants, callback) {
				this.data.participants = participants;
				
				// add the user if not contained
				if (!lib.containsUser(user, participants))
					participants.push(lib.filterUserData(user));
				
				var event = {name: name, description: description, groupId: null, 
						date: date.getTime(), nbParticipantsMax: nbParticipantsMax};
				
				this.data.event = event;
				
				this.db.addEvent(event, callback);
			},
			function(result, fields, callback) {
				this.db.lastInsertId(callback);
			},
			function(result, fields, callback) {
				if (result.length == 0)
					return callback(new Error('no last insert id'));
				
				var participants = this.data.participants;
				var eventId = result[0];
				this.data.eventId = eventId;
				
				addParticipants({eventId: eventId, participants: participants},
						callback);
			},
			function(callback) {
				this.db.getEventById({eventId: this.data.eventId}, callback);
			},
			function(result, fields, callback) {
				if (result.length == 0)
					return callback(new Error('event read failed'));
				
				var event = result[0];
				var participants = this.data.participants;
				var sessions = session.getUsersSessions(participants);
				
				event.participants = participants;
				
				// notify every online participants
				sessions.forEach(function(session) {
					session.emit('eventCreated', event);
				});
				
				callback(null);
			}
		],
		function(err) {
			if (err) {
				user.emit('createEvent', {status: 'fail', errorMsg: 'server error'});
			}
		});
	});
	
	// user leaves event and group of event
	user.on('exitEvent', function(data) {
		if (!session.validateRequest('exitEvent', user, false))
			return;
		
		var eventId = parseInt(data.eventId);
		
		if (eventId !== eventId)
			return;
		
		dbManager.trxPattern([
			function(callback) {
				this.db.getEventById({eventId: eventId}, callback);
			},
			function(result, fields, callback) {
				if (result.length == 0)
					return callback(new Error('You are not the event member or no such event'));
				
				this.data.event = result[0];
				
				// get participant is not should be consistent in transaction so don't lock
				this.db.getEventParticipantByUser({eventId: eventId, userId: user.userId}, 
						callback);
			},
			function(callback) {
				if (result.length == 0)
					return callback(new Error('You are not the event member or no such event'));
				
				this.db.getEventParticipants({eventId: eventId, update: true}, callback);
			},
			function(result, fiedls, callback) {
				this.data.participants = result;
				
				this.db.removeEventParticipant({eventId: eventId, userId: user.userId},
						callback);
			},
			function(result, fiedls, callback) {
				if (result.affectedRows == 0)
					return callback('Failed to exit event');
				
				var userSessions = session.getUserSessions(user);
				var sessions = session.getUsersSessions(this.data.participants);
				
				// notify exited user
				userSessions.forEach(function(user) {
					user.emit('exitEvent', {status: 'success', eventId: eventId});
				});
				
				// notify other participants
				sessions.forEach(function(user) {
					if (userSessions.indexOf(user) >= 0)
						return;
					user.emit('eventParticipantExited', {eventId: eventId, userId: user.userId});
				});
				
				callback(null);
			}
		],
		function(err) {
			if (err) {
				user.emit('exitEvent', {status: 'fail', errorMsg: 'server error'});
			} else {
				var groupId = this.data.event.groupId;
				// if event has a group, exit from the group
				if (groupId) {
					group.exitGroup({groupId: groupId, user: user, trx: true});
				}
			}
		});
	});
}

// input: data.user, data.emails(array of email)
var getParticipants = dbManager.composablePattern(function(pattern, callback) {
	var user = this.data.user;
	var emails = this.data.emails;
	
	if (!emails)
		return callback(null, []);
	
	pattern([
		function(callback) {
			var validps = [];
			var db = this.db;
			this.data.participants = validps;
			
			lib.recursion(function(i) {
				return i < emails.length;
			},
			function(i, callback) {
				dbManager.atomicPattern([
					function(callback) {
						// get user info
						this.db.getUserByEmail({email: email, lock: true}, callback);
					},
					function(result, fields, callback) {
						if (result.length == 0)
							return callback(new Error('no such user'));
						
						var peer = result[i];
						this.data.peer = peer;
						
						this.db.getAcceptedContact({userId: user.userId, userId2: peer.userId, 
							lock: true}, callback);
					},
					function(result, fields, callback) {
						if (result.length == 0)
							return callback(new Error('You can invite only your contacts'));
						
						// valid contact
						validps.push(lib.filterUserData(this.data.peer));
						
						callback(null);
					}
				],
				callback,
				{db: db});
			},
			callback);
		}
	],
	function(err) {
		if (err)
			callback(err);
		else
			callback(null, this.data.participants);
	});
});

// input: data.eventId, data.participants(array of user info)
var addParticipants = dbManager.composablePattern(function(pattern, callback) {
	var eventId = this.data.eventId;
	var participants = this.data.participants;
	
	if (!participants)
		return userCallback(null);
	
	pattern([
		function(callback) {
			var db = this.db;
			
			var parIter = function(i) {
				if (i == participants.length) {
					return callback(null);
				}
				
				var participant = participants[i];
				
				async.waterfall([
					function(callback) {
						// get user info
						this.db.addEventParticipant({eventId: eventId, 
							userId: participant.userId}, callback);
					}
				],
				function(err){
					if (err)
						callback(err);
					else
						parIter(i + 1);
				});
			};
			
			parIter(0)
		}
	],
	function(err) {
		if (err)
			callback(err);
		else
			callback(null);
	});
});

// Sees every events and starts events in its time
var eventManagerProto = {
	init: function() {
		dbManager.trxPattern([
			function(callback) {
				
			},
		],
		function(err) {
			
		});
	},
};

module.exports = {init: init};

var session = require('./session');
var chatManager = require('./chatManager');
var group = require('./group')
var lib = require('./lib');
var async = require('async');